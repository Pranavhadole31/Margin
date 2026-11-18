import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Check, Eye, Pause, Play, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseItems, useStore } from "@/lib/store";
import { type ClozeQuestion, clozeFor, flashcardFor, gradeCloze, shuffleSeeded, studyable } from "@/lib/study";
import type { Item } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EmptyState, EvidenceList, KindBadge, Meter, PageHeader } from "@/components/bits";

type Mode = "flashcard" | "quiz";
interface Outcome { itemId: string; correct: boolean }

function useTimer(totalSec: number, running: boolean) {
  const [left, setLeft] = useState(totalSec);
  useEffect(() => setLeft(totalSec), [totalSec]);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => window.clearInterval(t);
  }, [running]);
  return { left, reset: () => setLeft(totalSec) };
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Flashcard({ item, onRate }: { item: Item; onRate: (c: boolean) => void }) {
  const [shown, setShown] = useState(false);
  const card = flashcardFor(item);
  return (
    <div className="flip-in">
      <div className="mb-3 flex items-center gap-2"><KindBadge kind={item.kind} /></div>
      <p className="font-reading text-3xl leading-snug md:text-4xl" data-testid="text-card-front">{card.front}</p>
      {!shown ? (
        <Button className="mt-8" onClick={() => setShown(true)} data-testid="button-reveal"><Eye className="mr-2 h-4 w-4" />Reveal answer from source</Button>
      ) : (
        <div className="mt-8 space-y-5 flip-in">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-pencil">Answer — your source, verbatim</p>
          <EvidenceList item={item} />
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Be honest — did you recall it before revealing?</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-sage/50 text-sage hover:bg-sage/10" onClick={() => onRate(true)} data-testid="button-rate-recalled"><Check className="mr-1.5 h-4 w-4" />I recalled it</Button>
              <Button variant="outline" className="border-pencil/50 text-pencil hover:bg-pencil/10" onClick={() => onRate(false)} data-testid="button-rate-missed"><X className="mr-1.5 h-4 w-4" />I didn't</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Quiz({ q, onDone }: { q: ClozeQuestion; onDone: (c: boolean) => void }) {
  const [answer, setAnswer] = useState("");
  const [graded, setGraded] = useState<boolean | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (graded === null) setGraded(gradeCloze(q, answer));
  };
  return (
    <form onSubmit={submit} className="flip-in">
      <div className="mb-3 flex items-center gap-2"><KindBadge kind={q.item.kind} /><span className="text-[13px] text-muted-foreground">Fill the missing word from your notes</span></div>
      <p className="whitespace-pre-wrap font-reading text-2xl leading-relaxed md:text-[26px]" data-testid="text-quiz-prompt">
        {q.before}
        <span className={cn("mx-1 inline-block min-w-[5ch] border-b-2 px-1 text-center", graded === null ? "border-primary" : graded ? "border-sage text-sage" : "border-pencil text-pencil")}>
          {graded === null ? "\u00a0" : q.answer}
        </span>
        {q.after}
      </p>
      <div className="mt-8 flex max-w-md gap-2">
        <Label htmlFor="quiz-answer" className="sr-only">Your answer</Label>
        <Input id="quiz-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={graded !== null} autoFocus autoComplete="off" placeholder="Type the missing word" data-testid="input-quiz-answer" />
        {graded === null && <Button type="submit" disabled={!answer.trim()} data-testid="button-check">Check</Button>}
      </div>
      {graded !== null && (
        <div className="mt-6 space-y-4 flip-in">
          <p className={cn("font-medium", graded ? "text-sage" : "text-pencil")} data-testid="text-quiz-result">
            {graded ? "Correct — matches your source." : `Not quite. Your source says "${q.answer}"; you wrote "${answer}".`}
          </p>
          <EvidenceList item={q.item} compact />
          <Button type="button" onClick={() => onDone(graded)} data-testid="button-next">Next</Button>
        </div>
      )}
    </form>
  );
}

export default function Study() {
  const items = useCourseItems();
  const { addResult } = useStore();
  const pool = useMemo(() => studyable(items), [items]);
  const [mode, setMode] = useState<Mode>("flashcard");
  const [length, setLength] = useState("10");
  const [minutes, setMinutes] = useState("15");
  const [session, setSession] = useState<{ items: Item[]; quiz: ClozeQuestion[] } | null>(null);
  const [idx, setIdx] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const seed = useRef(1);

  const total = session ? (mode === "quiz" ? session.quiz.length : session.items.length) : 0;
  const { left, reset } = useTimer(Number(minutes) * 60, !!session && !paused && !done);
  useEffect(() => { if (session && left === 0) setDone(true); }, [left, session]);

  const quizable = useMemo(() => pool.map(clozeFor).filter(Boolean) as ClozeQuestion[], [pool]);

  const start = () => {
    seed.current = Date.now() % 100000;
    const n = length === "all" ? Infinity : Number(length);
    const its = shuffleSeeded(pool, seed.current).slice(0, n);
    const qs = shuffleSeeded(quizable, seed.current).slice(0, n);
    setSession({ items: its, quiz: qs });
    setIdx(0);
    setOutcomes([]);
    setPaused(false);
    setDone(false);
    reset();
  };

  const record = (itemId: string, correct: boolean) => {
    addResult({ itemId, mode, correct });
    const next = [...outcomes, { itemId, correct }];
    setOutcomes(next);
    if (idx + 1 >= total) setDone(true);
    else setIdx(idx + 1);
  };

  if (pool.length === 0)
    return (
      <div>
        <PageHeader eyebrow="Study" title="Practice from your own evidence" />
        <EmptyState title="Nothing approved to study yet" action={<Button asChild><Link href="/review">Go to review</Link></Button>}>
          Flashcards and quizzes are built only from approved items, with answers taken word-for-word from your sources. Generated investigation questions are never used as answers.
        </EmptyState>
      </div>
    );

  if (!session)
    return (
      <div>
        <PageHeader eyebrow="Study" title="Practice from your own evidence" lede={`${pool.length} approved items available. Every answer is a verbatim excerpt from your notes — nothing is invented.`} />
        <div className="rise grid gap-8 rounded-2xl border bg-card p-6 md:grid-cols-3 md:p-8">
          <fieldset>
            <legend className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Mode</legend>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="gap-3">
              <label className="flex items-start gap-3"><RadioGroupItem value="flashcard" className="mt-1" data-testid="radio-flashcard" /><span><span className="font-medium">Flashcards</span><br /><span className="text-sm text-muted-foreground">Recall, reveal, rate yourself.</span></span></label>
              <label className="flex items-start gap-3"><RadioGroupItem value="quiz" className="mt-1" disabled={!quizable.length} data-testid="radio-quiz" /><span><span className="font-medium">Short quiz</span><br /><span className="text-sm text-muted-foreground">Fill a missing word, graded against your source.</span></span></label>
            </RadioGroup>
          </fieldset>
          <fieldset>
            <legend className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Length</legend>
            <RadioGroup value={length} onValueChange={setLength} className="gap-3">
              {["5", "10", "all"].map((l) => <label key={l} className="flex items-center gap-3"><RadioGroupItem value={l} data-testid={`radio-length-${l}`} />{l === "all" ? "Everything available" : `${l} items`}</label>)}
            </RadioGroup>
          </fieldset>
          <fieldset>
            <legend className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Focus timer</legend>
            <RadioGroup value={minutes} onValueChange={setMinutes} className="gap-3">
              {["10", "15", "25"].map((m) => <label key={m} className="flex items-center gap-3"><RadioGroupItem value={m} data-testid={`radio-minutes-${m}`} />{m} minutes</label>)}
            </RadioGroup>
          </fieldset>
          <div className="md:col-span-3">
            <Button size="lg" onClick={start} data-testid="button-start-session">Begin focused session</Button>
          </div>
        </div>
      </div>
    );

  const correct = outcomes.filter((o) => o.correct).length;

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-10 border-b bg-background/90 px-4 py-3 backdrop-blur md:top-0 md:mx-0 md:rounded-b-xl md:px-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[13px] tabular-nums" data-testid="text-timer">{fmt(left)}</span>
          <Button size="icon" variant="ghost" onClick={() => setPaused((p) => !p)} disabled={done} aria-label={paused ? "Resume timer" : "Pause timer"} data-testid="button-pause">
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={reset} disabled={done} aria-label="Reset timer" data-testid="button-reset-timer"><RotateCcw className="h-4 w-4" /></Button>
          <span className="ml-auto font-mono text-[12px] text-muted-foreground">{Math.min(idx + (done ? 1 : 0), total)} / {total}</span>
          <Button size="sm" variant="ghost" onClick={() => setDone(true)} disabled={done} data-testid="button-end-session">End</Button>
        </div>
        <div className="mt-2"><Meter value={total ? outcomes.length / total : 0} label="Session progress" /></div>
      </div>

      {paused && !done && <p className="mb-6 rounded-md bg-ochre/10 px-4 py-2 text-sm text-ochre">Paused. Take a breath — resume when ready.</p>}

      {done ? (
        <div className="rise mx-auto max-w-xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-pencil">Session complete{left === 0 && " · time's up"}</p>
          <p className="mt-4 font-reading text-6xl" data-testid="text-session-score">{correct}<span className="text-muted-foreground">/{outcomes.length}</span></p>
          <p className="mt-2 text-muted-foreground">{outcomes.length ? `${mode === "quiz" ? "answered correctly" : "recalled"} · ${fmt(Number(minutes) * 60 - left)} focused` : "No answers recorded in this session."}</p>
          <div className="mt-8 flex justify-center gap-2">
            <Button onClick={start} data-testid="button-again">Study again</Button>
            <Button variant="outline" onClick={() => setSession(null)} data-testid="button-new-session">Change settings</Button>
            <Button variant="ghost" asChild><Link href="/understanding">See understanding</Link></Button>
          </div>
        </div>
      ) : (
        <div className={cn("mx-auto max-w-2xl transition-opacity", paused && "pointer-events-none opacity-40")} key={idx}>
          {mode === "flashcard" ? (
            <Flashcard item={session.items[idx]} onRate={(c) => record(session.items[idx].id, c)} />
          ) : (
            <Quiz q={session.quiz[idx]} onDone={(c) => record(session.quiz[idx].item.id, c)} />
          )}
        </div>
      )}
    </div>
  );
}
