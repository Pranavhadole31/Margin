import { type Item, type Kind, type Source, uid } from "./types";

/**
 * Local, deterministic, source-bound extraction.
 * Every item carries the full, unchanged sentence/block it came from.
 * Nothing is paraphrased, invented, or sent anywhere.
 */

const LIST_RE = /^\s*(?:[-*\u2022]|\d+[.)])\s+/;
const PRONOUN_START = /^(it|this|that|they|these|those|there|here|he|she|we|you|i|which|what|one)\b/i;

const HOWTO_RE =
  /^(to\s+\w+[^,]{0,60},|try|start|begin|use|set|write|close|open|take|pick|choose|review|avoid|make|spend|ask|explain|space|mix|schedule|keep|put|read|test|practi[cs]e|draw|teach|sleep|switch|break|focus|turn|step\s+\d)\b/i;
const PROCESS_RE =
  /\b(first|then|next|afterwards?|finally|stages?|phases?|cycle|process|sequence|over time|gradually|leads? to|followed by|begins?|starts?|triggers?)\b/i;
const SYSTEM_RE =
  /\b(system|network|consists? of|made up of|components?|structure|interacts?|feedback|mechanism|loop)\b/i;
const CONCEPT_RE =
  /\b(because|principle|idea|theory|effect|means that|depends|therefore|so that|key|important|why|instead|rather than|illusion)\b/i;

export const STOPWORDS = new Set(
  "a an the and or but if then so of to in on at by for with from as is are was were be been being this that these those it its into about over under than more most less very can could should would will may might do does did not no you your we our they their he she his her them what which who when where why how also just only such each any some much many other there here because while".split(
    " ",
  ),
);

interface Unit {
  excerpt: string; // exact substring of the source
  heading: string | null;
  isBlockList?: boolean;
}

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (/^#{1,6}\s+/.test(t)) return true;
  return t.length > 0 && t.length <= 70 && !/[.!?:;,]$/.test(t) && !LIST_RE.test(t) && t.split(/\s+/).length <= 9;
}

function cleanHeading(line: string) {
  return line.trim().replace(/^#{1,6}\s+/, "");
}

export function splitSentences(paragraph: string): string[] {
  const out: string[] = [];
  const re = /[^.!?]+(?:[.!?]+["'\u201d)\]]*|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(paragraph))) {
    const s = m[0].trim();
    if (s) out.push(s);
  }
  // re-join fragments split on abbreviations like "e.g." so excerpts stay whole
  const merged: string[] = [];
  for (const s of out) {
    const prev = merged[merged.length - 1];
    if (prev && (/\b(e\.g|i\.e|etc|vs|Dr|Mr|Ms|cf)\.$/i.test(prev) || s.length < 4)) {
      const start = paragraph.indexOf(prev);
      const end = paragraph.indexOf(s, start + prev.length) + s.length;
      merged[merged.length - 1] = paragraph.slice(start, end);
    } else merged.push(s);
  }
  return merged;
}

function toUnits(text: string): Unit[] {
  const units: Unit[] = [];
  const blocks = text.split(/\n\s*\n/);
  let heading: string | null = null;
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    let lines = block.split("\n");
    if (lines.length === 1 && isHeadingLine(lines[0])) {
      heading = cleanHeading(lines[0]);
      continue;
    }
    if (lines.length > 1 && isHeadingLine(lines[0])) {
      heading = cleanHeading(lines[0]);
      lines = lines.slice(1);
    }
    const body = lines.join("\n").trim();
    const listLines = lines.filter((l) => LIST_RE.test(l));
    if (listLines.length >= 2 && listLines.length >= lines.length - 1) {
      units.push({ excerpt: body, heading, isBlockList: true });
      continue;
    }
    for (const line of lines) {
      if (LIST_RE.test(line)) {
        units.push({ excerpt: line.trim(), heading });
      }
    }
    const prose = lines.filter((l) => !LIST_RE.test(l)).join("\n").trim();
    if (prose) for (const s of splitSentences(prose)) units.push({ excerpt: s, heading });
  }
  return units;
}

function shortTitle(s: string, words = 9): string {
  const clean = s.replace(LIST_RE, "").replace(/\s+/g, " ").replace(/[.!?]+$/, "").trim();
  const w = clean.split(" ");
  return w.length > words ? w.slice(0, words).join(" ") + "\u2026" : clean;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Draft {
  title: string;
  kind: Kind;
  excerpt: string;
  generated?: boolean;
  body?: string;
  tags: string[];
}

function classify(u: Unit): Draft | null {
  const flat = u.excerpt.replace(LIST_RE, "").replace(/\s+/g, " ").trim();
  const words = flat.split(" ").length;
  const tags = u.heading ? [u.heading.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")].filter(Boolean) : [];

  if (u.isBlockList) {
    const isSteps = /how|step|routine|method|procedure|guide|technique|checklist/i.test(u.heading ?? "") || /^\s*\d/.test(u.excerpt);
    return {
      title: u.heading ? cap(u.heading) : shortTitle(u.excerpt.split("\n")[0]),
      kind: isSteps ? "howto" : "concept",
      excerpt: u.excerpt,
      tags,
    };
  }
  if (words < 5) return null;
  if (/\?["')]*$/.test(flat)) return { title: shortTitle(flat, 14), kind: "question", excerpt: u.excerpt, tags };

  const def = flat.match(/^(?:an?\s+|the\s+)?(.{2,60}?)\s+(?:is|are|refers to|means|describes)\s+/i);
  if (def && !PRONOUN_START.test(def[1]) && def[1].split(" ").length <= 6 && !/[,;:]/.test(def[1])) {
    return { title: cap(def[1].replace(/^["']|["']$/g, "")), kind: "term", excerpt: u.excerpt, tags };
  }
  const called = flat.match(/\b(?:called|known as|termed)\s+(?:the\s+)?["\u201c]?([A-Za-z][\w\s-]{2,40}?)["\u201d]?(?:[,.;]|$)/i);
  if (called && called[1].split(" ").length <= 5) {
    return { title: cap(called[1].trim()), kind: "term", excerpt: u.excerpt, tags };
  }
  if (HOWTO_RE.test(flat)) return { title: shortTitle(flat), kind: "howto", excerpt: u.excerpt, tags };
  if (PROCESS_RE.test(flat) && words >= 8) return { title: shortTitle(flat), kind: "process", excerpt: u.excerpt, tags };
  if (SYSTEM_RE.test(flat) && words >= 8) return { title: shortTitle(flat), kind: "system", excerpt: u.excerpt, tags };
  if (CONCEPT_RE.test(flat) && words >= 8) return { title: shortTitle(flat), kind: "concept", excerpt: u.excerpt, tags };
  return null;
}

function investigationFor(d: Draft): Draft | null {
  if (d.kind === "term")
    return {
      title: `How would you explain "${d.title}" in your own words, and where do your notes support it?`,
      kind: "question",
      excerpt: d.excerpt,
      generated: true,
      tags: d.tags,
    };
  if (d.kind === "process")
    return {
      title: `What triggers each step here, and what would break the sequence?`,
      kind: "question",
      excerpt: d.excerpt,
      generated: true,
      tags: d.tags,
    };
  return null;
}

export function extractFromSource(source: Source, existing: Item[], opts: { demo?: boolean; now?: string } = {}): Item[] {
  const units = toUnits(source.text);
  const seen = new Set(
    existing.flatMap((i) => i.evidence.filter((e) => e.sourceId === source.id).map((e) => `${i.kind}|${i.generated ? "g" : ""}|${e.excerpt}`)),
  );
  const out: Item[] = [];
  const now = opts.now ?? new Date().toISOString();
  const push = (d: Draft) => {
    const key = `${d.kind}|${d.generated ? "g" : ""}|${d.excerpt}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      id: uid(),
      title: d.title,
      body: "",
      kind: d.kind,
      tags: d.tags,
      evidence: [{ sourceId: source.id, excerpt: d.excerpt }],
      status: "pending",
      createdAt: now,
      demo: !!opts.demo,
      generated: d.generated,
    });
  };
  for (const u of units) {
    if (!source.text.includes(u.excerpt)) continue; // guarantee verbatim
    const d = classify(u);
    if (!d) continue;
    push(d);
    const q = investigationFor(d);
    if (q) push(q);
  }
  return out;
}
