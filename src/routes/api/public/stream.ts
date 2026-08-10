import { createFileRoute } from "@tanstack/react-router";

/**
 * Media relay. The upstream CDN blocks direct browser access (no CORS and
 * signed URLs), so playlists and segments are fetched server-side and any
 * playlist entries are rewritten to point back at this route.
 */

const EDGE = "https://player.spidyxuniverserwaa.workers.dev/";
const EDGE_KEY = "bruce_wayne_rwa_2024_dark_knight";
const EDGE_ORIGIN = "https://spidyrwa.vercel.app";

const ALLOWED_HOSTS = [
  "transcoded-videos.classx.co.in",
  "appx-content-v2.classx.co.in",
  "static-trans-v2.appx.co.in",
  "static-db-v2.appx.co.in",
  "liveclasses.cloud-front.in",
  "appx-transcoded-videos.classx.co.in",
  "player.spidyxuniverserwaa.workers.dev",
];

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "range, content-type",
  "access-control-expose-headers":
    "content-length, content-range, accept-ranges",
};

function isAllowed(raw: string) {
  try {
    const u = new URL(raw);
    return (
      u.protocol === "https:" &&
      ALLOWED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}

/** Unwrap the edge worker wrapper so we always relay the original CDN url. */
function unwrap(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname === "player.spidyxuniverserwaa.workers.dev") {
      const inner = u.searchParams.get("url");
      if (inner) return unwrap(inner);
    }
  } catch {
    /* keep as-is */
  }
  return raw;
}

function edgeUrl(target: string) {
  return `${EDGE}?key=${EDGE_KEY}&url=${encodeURIComponent(target)}`;
}

function selfUrl(target: string) {
  return `/api/public/stream?url=${encodeURIComponent(target)}`;
}

function rewritePlaylist(text: string, baseUrl: string) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith("#")) {
        // Rewrite URI="..." attributes (keys, maps, renditions).
        return trimmed.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
          try {
            return `URI="${selfUrl(unwrap(new URL(uri, baseUrl).toString()))}"`;
          } catch {
            return `URI="${uri}"`;
          }
        });
      }

      try {
        return selfUrl(unwrap(new URL(trimmed, baseUrl).toString()));
      } catch {
        return line;
      }
    })
    .join("\n");
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const rawTarget = url.searchParams.get("url");
  const download = url.searchParams.get("download");

  if (!rawTarget) {
    return new Response("missing url", { status: 400, headers: CORS });
  }

  const target = unwrap(rawTarget);
  if (!isAllowed(target)) {
    return new Response("host not allowed", { status: 403, headers: CORS });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(edgeUrl(target), {
    headers: {
      origin: EDGE_ORIGIN,
      referer: `${EDGE_ORIGIN}/`,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      accept: "*/*",
      ...(range ? { range } : {}),
    },
    redirect: "follow",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`upstream ${upstream.status}`, {
      status: upstream.status === 404 ? 404 : 502,
      headers: CORS,
    });
  }

  const type = upstream.headers.get("content-type") ?? "";
  const looksLikePlaylist =
    /mpegurl/i.test(type) || /\.m3u8(\?|$)/i.test(target);

  if (looksLikePlaylist) {
    const body = await upstream.text();
    return new Response(rewritePlaylist(body, target), {
      status: 200,
      headers: {
        ...CORS,
        "content-type": "application/vnd.apple.mpegurl",
        "cache-control": "no-store",
      },
    });
  }

  const headers = new Headers(CORS);
  headers.set("content-type", type || "application/octet-stream");
  headers.set("accept-ranges", "bytes");
  for (const key of ["content-length", "content-range"]) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set("cache-control", "public, max-age=3600");
  if (download) {
    headers.set(
      "content-disposition",
      `attachment; filename="${download.replace(/[^\w.\-]+/g, "_").slice(0, 80)}"`,
    );
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

export const Route = createFileRoute("/api/public/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
