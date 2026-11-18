import { z } from "zod";
import type { AppData } from "./types";
import { KINDS } from "./types";

export const STORAGE_KEY = "margin.notebook.v1";
export const MAX_SOURCE_CHARS = 400_000;
export const MAX_FILE_BYTES = 500 * 1024;

const evidence = z.object({ sourceId: z.string().min(1), excerpt: z.string().min(1) });
export const dataSchema = z.object({
  version: z.literal(1),
  sources: z.array(
    z.object({
      id: z.string().min(1),
      course: z.string().min(1),
      title: z.string().min(1),
      text: z.string(),
      createdAt: z.string(),
      demo: z.boolean(),
    }),
  ),
  items: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string(),
      body: z.string(),
      kind: z.enum(KINDS as [string, ...string[]]),
      tags: z.array(z.string()),
      evidence: z.array(evidence).min(1),
      status: z.enum(["pending", "approved", "discarded"]),
      createdAt: z.string(),
      demo: z.boolean(),
      edited: z.boolean().optional(),
      generated: z.boolean().optional(),
    }),
  ),
  results: z.array(
    z.object({
      id: z.string().min(1),
      itemId: z.string().min(1),
      mode: z.enum(["flashcard", "quiz"]),
      correct: z.boolean(),
      createdAt: z.string(),
    }),
  ),
});

export function validateData(raw: unknown): { ok: true; data: AppData } | { ok: false; error: string } {
  const r = dataSchema.safeParse(raw);
  if (!r.success) {
    const first = r.error.issues[0];
    return { ok: false, error: `Not a valid Margin backup: ${first.path.join(".") || "root"} — ${first.message}` };
  }
  const data = r.data as AppData;
  const ids = new Set(data.sources.map((s) => s.id));
  const orphan = data.items.find((i) => i.evidence.some((e) => !ids.has(e.sourceId)));
  if (orphan) return { ok: false, error: `Item "${orphan.title}" references a source that is not in the backup.` };
  return { ok: true, data };
}

export type LoadResult = { status: "empty" } | { status: "ok"; data: AppData } | { status: "error"; error: string };

export function loadData(): LoadResult {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return { status: "error", error: `Browser storage is unavailable (${(e as Error).message}). Changes will not be saved.` };
  }
  if (!raw) return { status: "empty" };
  try {
    const v = validateData(JSON.parse(raw));
    return v.ok ? { status: "ok", data: v.data } : { status: "error", error: `Saved notebook could not be read. ${v.error}` };
  } catch {
    return { status: "error", error: "Saved notebook is corrupted (invalid JSON)." };
  }
}

export function saveData(data: AppData): string | null {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return null;
  } catch (e) {
    const name = (e as Error).name;
    if (name === "QuotaExceededError") return "Browser storage is full. Your latest change was not saved — export a backup and remove large sources.";
    return `Could not save to browser storage: ${(e as Error).message}`;
  }
}
