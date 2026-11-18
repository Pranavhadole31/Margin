import { STOPWORDS } from "./extract";
import type { Item, StudyResult } from "./types";

export interface Flashcard {
  item: Item;
  front: string;
}

export interface ClozeQuestion {
  item: Item;
  excerpt: string;
  before: string;
  after: string;
  answer: string;
}

/** Only approved, non-generated items can become study material (they have source answers). */
export function studyable(items: Item[]): Item[] {
  return items.filter((i) => i.status === "approved" && !i.generated);
}

export function flashcardFor(item: Item): Flashcard {
  const front =
    item.kind === "term"
      ? `What is ${item.title}?`
      : item.kind === "howto"
        ? `How do you do this: ${item.title}`
        : item.kind === "question"
          ? item.title
          : `Recall what your notes say about: ${item.title}`;
  return { item, front };
}

function pickAnswer(item: Item, excerpt: string): { index: number; word: string } | null {
  if (item.kind === "term") {
    const idx = excerpt.toLowerCase().indexOf(item.title.toLowerCase());
    if (idx >= 0 && item.title.split(" ").length <= 4) return { index: idx, word: excerpt.slice(idx, idx + item.title.length) };
  }
  const re = /[A-Za-z][A-Za-z'-]{4,}/g;
  let best: { index: number; word: string } | null = null;
  let m: RegExpExecArray | null;
  const titleWords = new Set(item.title.toLowerCase().split(/\W+/));
  while ((m = re.exec(excerpt))) {
    const w = m[0];
    if (STOPWORDS.has(w.toLowerCase())) continue;
    if (m.index < 3) continue;
    const score = w.length + (titleWords.has(w.toLowerCase()) ? -3 : 0);
    if (!best || score > best.word.length) best = { index: m.index, word: w };
  }
  return best;
}

export function clozeFor(item: Item): ClozeQuestion | null {
  const excerpt = item.evidence[0]?.excerpt;
  if (!excerpt) return null;
  const pick = pickAnswer(item, excerpt);
  if (!pick) return null;
  return {
    item,
    excerpt,
    before: excerpt.slice(0, pick.index),
    after: excerpt.slice(pick.index + pick.word.length),
    answer: pick.word,
  };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

export function gradeCloze(q: ClozeQuestion, response: string): boolean {
  const a = norm(q.answer);
  const r = norm(response);
  if (!r) return false;
  return r === a || r + "s" === a || r === a + "s" || r.replace(/^(a|an|the) /, "") === a.replace(/^(a|an|the) /, "");
}

export function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function accuracy(results: StudyResult[]): number | null {
  if (!results.length) return null;
  return results.filter((r) => r.correct).length / results.length;
}
