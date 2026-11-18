export type Kind = "concept" | "term" | "system" | "process" | "howto" | "question";
export type Status = "pending" | "approved" | "discarded";

export const KINDS: Kind[] = ["concept", "term", "system", "process", "howto", "question"];

export const KIND_LABEL: Record<Kind, string> = {
  concept: "Concept",
  term: "Term",
  system: "System",
  process: "Process",
  howto: "How-to",
  question: "Question",
};

export interface Source {
  id: string;
  course: string;
  title: string;
  text: string;
  createdAt: string;
  demo: boolean;
}

export interface Evidence {
  sourceId: string;
  excerpt: string;
}

export interface Item {
  id: string;
  title: string;
  body: string;
  kind: Kind;
  tags: string[];
  evidence: Evidence[];
  status: Status;
  createdAt: string;
  demo: boolean;
  /** true once the user has edited title/body — body is then "your interpretation" */
  edited?: boolean;
  /** true for investigation prompts Margin generated (not factual claims) */
  generated?: boolean;
}

export interface StudyResult {
  id: string;
  itemId: string;
  mode: "flashcard" | "quiz";
  correct: boolean;
  createdAt: string;
}

export interface AppData {
  version: 1;
  sources: Source[];
  items: Item[];
  results: StudyResult[];
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
