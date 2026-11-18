import { useMemo } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useCourseItems, useStore } from "@/lib/store";
import { accuracy, studyable } from "@/lib/study";
import { KINDS, KIND_LABEL, type StudyResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState, Meter, PageHeader } from "@/components/bits";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 1000) / 10}%`);

export default function Understanding() {
  const items = useCourseItems();
  const { data, sourceById } = useStore();
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const results = useMemo(() => data.results.filter((r) => byId.has(r.itemId)), [data.results, byId]);
  const pool = studyable(items);
  const studied = new Set(results.map((r) => r.itemId));
  const unstudied = pool.filter((i) => !studied.has(i.id));

  const courseOf = (itemId: string) => sourceById(byId.get(itemId)!.evidence[0].sourceId)?.course ?? "Unknown";
  const group = (key: (r: StudyResult) => string) => {
    const m = new Map<string, StudyResult[]>();
    results.forEach((r) => m.set(key(r), [...(m.get(key(r)) ?? []), r]));
    return m;
  };
  const byCourse = Array.from(group((r) => courseOf(r.itemId)).entries());
  const byKind = group((r) => byId.get(r.itemId)!.kind);
  const perItem = Array.from(group((r) => r.itemId).entries())
    .map(([id, rs]) => ({ item: byId.get(id)!, rs, acc: accuracy(rs) ?? 0 }))
    .sort((a, b) => a.acc - b.acc || b.rs.length - a.rs.length);

  return (
    <div>
      <PageHeader eyebrow="Understanding" title="What you can actually recall" lede="Built only from study attempts you've made in this browser. Nothing is estimated or pre-filled." />

      {results.length === 0 ? (
        <EmptyState title="No study history yet" action={<Button asChild><Link href="/study">Start a session</Link></Button>}>
          {pool.length ? `You have ${pool.length} approved items ready. Once you study, your recall and quiz results appear here by topic.` : "Approve items in Review first, then study them."}
        </EmptyState>
      ) : (
        <div className="space-y-12">
          <section className="rise grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-4">
            {[
              ["Attempts", String(results.length)],
              ["Correct", pct(accuracy(results))],
              ["Items studied", `${studied.size} / ${pool.length}`],
              ["Never studied", String(unstudied.length)],
            ].map(([l, v]) => (
              <div key={l} className="bg-card px-5 py-5">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{l}</p>
                <p className="mt-1 font-reading text-4xl tabular-nums" data-testid={`text-stat-${l.toLowerCase().replace(/\s/g, "-")}`}>{v}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-4 font-reading text-2xl">By course</h2>
              <ul className="space-y-4">
                {byCourse.map(([c, rs]) => (
                  <li key={c}>
                    <div className="mb-1.5 flex justify-between text-sm"><span>{c}</span><span className="font-mono text-muted-foreground">{rs.filter((r) => r.correct).length}/{rs.length} · {pct(accuracy(rs))}</span></div>
                    <Meter value={accuracy(rs) ?? 0} label={`${c} accuracy`} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 font-reading text-2xl">By kind</h2>
              <ul className="space-y-4">
                {KINDS.filter((k) => byKind.has(k)).map((k) => {
                  const rs = byKind.get(k)!;
                  return (
                    <li key={k}>
                      <div className="mb-1.5 flex justify-between text-sm"><span>{KIND_LABEL[k]}</span><span className="font-mono text-muted-foreground">{rs.filter((r) => r.correct).length}/{rs.length} · {pct(accuracy(rs))}</span></div>
                      <Meter value={accuracy(rs) ?? 0} label={`${KIND_LABEL[k]} accuracy`} tone="sage" />
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-reading text-2xl">Item by item <span className="text-base text-muted-foreground">— weakest first</span></h2>
            <ul className="divide-y rounded-2xl border bg-card">
              {perItem.map(({ item, rs, acc }) => (
                <li key={item.id} className="grid gap-2 px-5 py-3 md:grid-cols-[1fr_180px] md:items-center">
                  <Link href={`/library?item=${item.id}`} className="font-reading text-[17px] hover:text-primary" data-testid={`link-understanding-item-${item.id}`}>{item.title}</Link>
                  <div>
                    <div className="mb-1 flex justify-between font-mono text-[11px] text-muted-foreground"><span>{rs.filter((r) => r.correct).length}/{rs.length}</span><span>{pct(acc)}</span></div>
                    <Meter value={acc} label={`${item.title} accuracy`} tone={acc < 0.5 ? "pencil" : "primary"} />
                  </div>
                </li>
              ))}
            </ul>
            {unstudied.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{unstudied.length} approved item{unstudied.length === 1 ? " has" : "s have"} never been studied: {unstudied.slice(0, 4).map((i) => i.title).join(", ")}{unstudied.length > 4 && "…"}</p>}
          </section>

          <section>
            <h2 className="mb-4 font-reading text-2xl">Recent history</h2>
            <ol className="space-y-1.5 font-mono text-[12.5px]">
              {results.slice().reverse().slice(0, 15).map((r) => (
                <li key={r.id} className="flex gap-3">
                  <span className="text-muted-foreground">{format(new Date(r.createdAt), "d MMM, HH:mm")}</span>
                  <span className={r.correct ? "text-sage" : "text-pencil"}>{r.correct ? "correct" : "missed"}</span>
                  <span className="text-muted-foreground">{r.mode}</span>
                  <span className="truncate">{byId.get(r.itemId)?.title}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
