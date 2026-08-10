import type { VideoDetails } from "./api";
import { decryptLink } from "./vault";

export type MediaSource = {
  label: string;
  /** Original CDN url (already decrypted). */
  url: string;
  kind: "hls" | "mp4";
  height: number;
};

/** Route any media url through our relay so the browser can actually load it. */
export function proxied(url: string, downloadName?: string) {
  const base = `/api/public/stream?url=${encodeURIComponent(url)}`;
  return downloadName
    ? `${base}&download=${encodeURIComponent(downloadName)}`
    : base;
}

function heightOf(label: string) {
  const m = /(\d{3,4})\s*p/i.exec(label);
  if (m) return Number(m[1]);
  if (/high/i.test(label)) return 720;
  if (/medium/i.test(label)) return 480;
  if (/low/i.test(label)) return 360;
  return 0;
}

/**
 * Build the playable quality list. `download_links` carry the real per-quality
 * HLS renditions, so they come first; live streams and the original mp4 are
 * only used as fallbacks. Encrypted `.mkv` links are unplayable in a browser.
 */
export function buildSources(data?: VideoDetails | null): MediaSource[] {
  if (!data) return [];
  const out: MediaSource[] = [];

  const push = (label: string, raw?: string | null, key?: string) => {
    const url = decryptLink(raw ?? undefined, key);
    if (!url || !url.startsWith("http")) return;
    if (/\.mkv(\?|$)/i.test(url)) return;
    const kind: MediaSource["kind"] = url.includes(".m3u8") ? "hls" : "mp4";
    out.push({ label, url, kind, height: heightOf(label) });
  };

  for (const link of data.download_links ?? []) push(link.quality, link.path);
  if (!out.length) {
    for (const link of data.livestream_links ?? []) push(link.quality, link.path);
  }
  push("Original", data.file_link);

  // De-dupe by url, keep the best label, then sort high → low.
  const seen = new Set<string>();
  const unique = out.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
  unique.sort((a, b) => b.height - a.height);
  return unique;
}

export function pdfLinkOf(data?: VideoDetails | null) {
  return decryptLink(data?.pdf_link) || decryptLink(data?.["pdf_link2"] as string);
}

function safeName(name: string) {
  return (
    name
      .replace(/[^\w\s.-]+/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 70) || "lecture"
  );
}

/**
 * Download a lecture. mp4 sources stream straight through the relay; HLS
 * sources are stitched segment-by-segment into a single .ts file.
 */
export async function downloadSource(
  source: MediaSource,
  title: string,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
) {
  const name = safeName(`${title}_${source.label}`);

  if (source.kind === "mp4") {
    const a = document.createElement("a");
    a.href = proxied(source.url, `${name}.mp4`);
    a.rel = "noreferrer";
    a.click();
    onProgress(100);
    return;
  }

  const init: RequestInit = signal ? { signal } : {};
  const playlist = await fetch(proxied(source.url), init).then((r) => {
    if (!r.ok) throw new Error("playlist_failed");
    return r.text();
  });

  const segments = playlist
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (!segments.length) throw new Error("no_segments");

  const parts: BlobPart[] = [];
  for (let i = 0; i < segments.length; i++) {
    const res = await fetch(segments[i]!, init);
    if (!res.ok) throw new Error("segment_failed");
    parts.push(await res.arrayBuffer());
    onProgress(Math.round(((i + 1) / segments.length) * 100));
  }

  const blob = new Blob(parts, { type: "video/mp2t" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `${name}.ts`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 30_000);
}
