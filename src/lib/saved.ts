const KEY = "rwa_saved_batches";

export type SavedBatch = {
  batch_id: string;
  batch_name: string;
  thumbnail: string;
};

export function getSaved(): SavedBatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedBatch[]) : [];
  } catch {
    return [];
  }
}

export function isSaved(id: string): boolean {
  return getSaved().some((b) => b.batch_id === id);
}

export function toggleSaved(batch: SavedBatch): boolean {
  const list = getSaved();
  const exists = list.some((b) => b.batch_id === batch.batch_id);
  const next = exists
    ? list.filter((b) => b.batch_id !== batch.batch_id)
    : [...list, batch];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("rwa-saved-changed"));
  return !exists;
}
