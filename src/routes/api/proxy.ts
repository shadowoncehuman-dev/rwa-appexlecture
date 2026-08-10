import { createFileRoute } from "@tanstack/react-router";

const UPSTREAM = "https://spidyrwa.vercel.app";
const UPSTREAM_AUTH = "lalit_pro_max_v1_secure_2026";

async function forward(request: Request) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint");

  const target =
    endpoint === "batches" || !endpoint
      ? `${UPSTREAM}/api/batches`
      : `${UPSTREAM}/api/proxy?endpoint=${encodeURIComponent(endpoint)}`;

  try {
    const upstream = await fetch(target, {
      headers: {
        "x-spidy-vault-auth": UPSTREAM_AUTH,
        accept: "application/json",
      },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "upstream_unreachable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

export const Route = createFileRoute("/api/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => forward(request),
    },
  },
});
