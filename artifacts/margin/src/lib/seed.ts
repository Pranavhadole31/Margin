import { extractFromSource } from "./extract";
import type { AppData, Item, Source } from "./types";

export const DEMO_COURSE = "Learning how to learn";
const T = "2025-01-06T09:00:00.000Z";

const SOURCE_A = `# Two modes of thinking

Focused mode is the tight, deliberate attention you use when working a familiar kind of problem. It runs along paths you have already laid down, which makes it efficient but narrow.

Diffuse mode is a relaxed, wide-angle state of mind where ideas connect loosely in the background. It often shows up during a walk, a shower, or the minutes before sleep.

Hard new material usually needs both modes, because focused work loads the pieces and diffuse time lets the brain find connections between them. Switching away from a stuck problem is therefore not quitting; it is handing the problem to a different kind of thinking.

## Chunking

A chunk is a compact unit of meaning that your mind can retrieve as a single piece. Building a chunk starts with focused attention on the new idea, then repeated practice until the steps fuse, and finally seeing where the chunk does and does not apply.

Working memory is a small system that holds only a handful of items at once, while long-term memory stores chunks that can be pulled into working memory when needed. Chunks matter because they let a limited working memory carry far more meaning.

## Illusions of competence

Rereading a highlighted page feels productive because the text looks familiar, but familiarity is not the same as being able to recall it. This gap is called the illusion of competence.

How can I tell, before an exam, whether I actually know a topic or only recognise it?`;

const SOURCE_B = `# Practice that sticks

Retrieval practice is the act of pulling information out of memory without looking at the source. Each successful recall strengthens the path back to that idea more than another reading would.

Spaced repetition means returning to material over increasing intervals instead of cramming it in one sitting. Memories weaken over time, and a well-timed review rebuilds them so they fade more slowly afterwards.

Interleaving is mixing different problem types within one practice session rather than doing a block of the same type. It feels harder, but it trains you to choose the right method, not just execute it.

## A focused session routine

1. Close every tab and notification you will not need.
2. Set a timer for twenty-five minutes and pick one specific task.
3. Work only on that task until the timer ends.
4. Take a five-minute break away from the screen.
5. Write one sentence about what you finished before starting again.

## Procrastination

Procrastination often begins with a small cue, such as opening a hard assignment, which triggers mild discomfort. The brain then shifts attention to something more pleasant, and the relief from that shift reinforces the habit over time.

Focus on the process, a block of time spent working, rather than the product, a finished assignment, so that starting feels manageable.`;

export function buildDemoData(): AppData {
  const sources: Source[] = [
    { id: "demo-src-modes", course: DEMO_COURSE, title: "Modes of thinking and chunking", text: SOURCE_A, createdAt: T, demo: true },
    { id: "demo-src-practice", course: DEMO_COURSE, title: "Practice, routines and procrastination", text: SOURCE_B, createdAt: T, demo: true },
  ];
  let items: Item[] = [];
  for (const s of sources) items = items.concat(extractFromSource(s, items, { demo: true, now: T }));
  // Explicitly demo-approved: a small, labeled set so Library and Study work out of the box.
  const approveTitles = ["Focused mode", "Diffuse mode", "Chunk", "Retrieval practice", "Spaced repetition", "A focused session routine"];
  items = items.map((i) =>
    !i.generated && approveTitles.some((t) => i.title.toLowerCase() === t.toLowerCase()) ? { ...i, status: "approved" } : i,
  );
  return { version: 1, sources, items, results: [] };
}
