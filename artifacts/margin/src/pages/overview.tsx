import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useCourseItems, useStore } from "@/lib/store";
import { studyable } from "@/lib/study";
import { Button } from "@/components/ui/button";

export default function Overview() {
  const { data, activeCourse } = useStore();
  const items = useCourseItems();
  const sources = data.sources.filter((s) => activeCourse === "all" || s.course === activeCourse);
  const pending = items.filter((i) => i.status === "pending");
  const approved = items.filter((i) => i.status === "approved");
  const ids = new Set(items.map((i) => i.id));
  const results = data.results.filter((r) => ids.has(r.itemId));
  const hasDemo = data.sources.some((s) => s.demo);

  const steps = [
    { n: "01", title: "Bring your notes", text: `${sources.length} source${sources.length === 1 ? "" : "s"} in this view.`, href: "/sources", cta: "Open sources" },
    { n: "02", title: "Review what was found", text: `${pending.length} pending item${pending.length === 1 ? "" : "s"} wait for your judgement.`, href: "/review", cta: "Start reviewing" },
    { n: "03", title: "Keep only what you approve", text: `${approved.length} approved in your library.`, href: "/library", cta: "Browse library" },
    { n: "04", title: "Study from evidence", text: `${studyable(approved).length} items ready for cards and quizzes.`, href: "/study", cta: "Begin a session" },
  ];

  return (
    <div>
      <section className="rise mb-12">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-pencil">Your notebook{activeCourse !== "all" && ` · ${activeCourse}`}</p>
        <h1 className="max-w-3xl font-reading text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
          Every claim, <em className="text-primary">traceable</em> to a line you wrote.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Margin reads your notes locally, proposes what might be worth keeping, and lets nothing into your library without your approval. Study only from what you approved.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="rounded-full border px-3 py-1">Local extraction • no external AI</span>
          <span className="rounded-full border px-3 py-1">Stored in this browser — no sync, no encryption</span>
          <span className="rounded-full border px-3 py-1">No account needed</span>
        </div>
      </section>

      {hasDemo && (
        <div className="rise rise-1 mb-10 rounded-xl border border-dashed border-ochre/50 bg-ochre/[0.06] px-5 py-4 text-[14px] leading-relaxed">
          <span className="font-medium text-ochre">Demo course loaded.</span> “Learning how to learn” contains original sample notes written for this demo. A few items are marked <em>demo-approved</em>; the rest are pending for you to review. There is no study history until you study.
        </div>
      )}

      <section className="rise rise-2 grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-2">
        {steps.map((s) => (
          <Link key={s.n} href={s.href} className="group flex flex-col bg-card p-6 transition-colors hover:bg-card/70" data-testid={`link-step-${s.n}`}>
            <span className="font-mono text-[11px] text-pencil">{s.n}</span>
            <h2 className="mt-2 font-reading text-2xl">{s.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-primary">
              {s.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>

      <section className="rise rise-3 mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 font-reading text-2xl">Waiting for review</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing pending. Add a source and run extraction to propose new items.</p>
          ) : (
            <ul className="divide-y border-y">
              {pending.slice(0, 5).map((i) => (
                <li key={i.id} className="py-3">
                  <Link href="/review" className="block hover:text-primary" data-testid={`link-pending-${i.id}`}>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">{i.generated ? "generated question" : i.kind}</span>
                    <p className="font-reading text-[17px] leading-snug">{i.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-4 font-reading text-2xl">Study so far</h2>
          {results.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">You haven't studied yet. Your recall and quiz history will appear here — nothing is pre-filled.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              <span className="font-reading text-4xl text-foreground">{results.length}</span> attempts recorded,{" "}
              {Math.round((results.filter((r) => r.correct).length / results.length) * 1000) / 10}% recalled correctly.
            </p>
          )}
          <Button asChild variant="outline" className="mt-4" data-testid="button-go-understanding">
            <Link href="/understanding">See understanding</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
