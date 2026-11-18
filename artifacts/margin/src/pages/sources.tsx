import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { FilePlus2, Trash2, Wand2, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { MAX_FILE_BYTES, MAX_SOURCE_CHARS } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Confirm, EmptyState, PageHeader } from "@/components/bits";
import { useToast } from "@/hooks/use-toast";

function AddSourceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { courses, addSource, activeCourse } = useStore();
  const [, go] = useLocation();
  const { toast } = useToast();
  const [course, setCourse] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCourse(activeCourse !== "all" ? activeCourse : "");
      setTitle("");
      setText("");
      setErrors({});
    }
  }, [open, activeCourse]);

  const onFile = async (f: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!f) return;
    if (!/\.(txt|md|markdown)$/i.test(f.name)) return setErrors({ file: `"${f.name}" is not supported. Upload a .txt or .md file.` });
    if (f.size > MAX_FILE_BYTES) return setErrors({ file: `"${f.name}" is ${(f.size / 1024).toFixed(1)} KB — the limit is ${MAX_FILE_BYTES / 1024} KB. Split it into smaller sources.` });
    try {
      const content = await f.text();
      setText(content);
      if (!title) setTitle(f.name.replace(/\.(txt|md|markdown)$/i, ""));
      setErrors({});
    } catch {
      setErrors({ file: "The file could not be read." });
    }
  };

  const submit = (extract: boolean) => {
    const e: Record<string, string> = {};
    if (!course.trim()) e.course = "Name the topic or course.";
    if (!title.trim()) e.title = "Give the source a title.";
    if (!text.trim()) e.text = "Paste your notes or upload a file.";
    if (text.length > MAX_SOURCE_CHARS) e.text = `This text is ${text.length.toLocaleString()} characters; the limit is ${MAX_SOURCE_CHARS.toLocaleString()}. Nothing was cut — split it into smaller sources.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    const { source: src, extracted: n } = addSource({ course, title, text }, extract);
    onOpenChange(false);
    if (extract) {
      toast({ title: `${n} item${n === 1 ? "" : "s"} proposed`, description: n ? "Pending in Review — nothing enters your library until you approve it." : "No extractable sentences found. Try notes with full sentences, definitions or lists." });
    } else toast({ title: "Source saved", description: src.title });
    go(`/sources?id=${src.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-reading text-2xl font-medium">Add a source</DialogTitle>
          <DialogDescription>Your text stays in this browser. It is never uploaded.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="src-course">Topic or course</Label>
              <Input id="src-course" list="course-list" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Cell biology" data-testid="input-source-course" />
              <datalist id="course-list">{courses.map((c) => <option key={c} value={c} />)}</datalist>
              {errors.course && <p className="text-xs text-destructive">{errors.course}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="src-title">Source title</Label>
              <Input id="src-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lecture 3 notes" data-testid="input-source-title" />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="src-text">Notes</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} data-testid="button-upload-file">
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload .txt / .md
              </Button>
              <input ref={fileRef} type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="input-source-file" />
            </div>
            <Textarea id="src-text" rows={12} value={text} onChange={(e) => setText(e.target.value)} className="font-reading text-[15px] leading-relaxed" placeholder="Paste paragraphs, headings or lists exactly as you wrote them." data-testid="input-source-text" />
            <p className="text-right font-mono text-[11px] text-muted-foreground">{text.length.toLocaleString()} / {MAX_SOURCE_CHARS.toLocaleString()} characters</p>
            {errors.text && <p className="text-xs text-destructive" role="alert">{errors.text}</p>}
            {errors.file && <p className="text-xs text-destructive" role="alert" data-testid="text-file-error">{errors.file}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => submit(false)} data-testid="button-save-source">Save only</Button>
          <Button onClick={() => submit(true)} data-testid="button-save-extract"><Wand2 className="mr-2 h-4 w-4" />Save & extract</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Highlighted({ text, hl }: { text: string; hl: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const idx = hl ? text.indexOf(hl) : -1;
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [hl]);
  if (idx < 0 || !hl) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark ref={ref} className="source-hl">{text.slice(idx, idx + hl.length)}</mark>
      {text.slice(idx + hl.length)}
    </>
  );
}

export default function Sources() {
  const { data, activeCourse, deleteSource, runExtraction } = useStore();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, go] = useLocation();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const sources = useMemo(() => data.sources.filter((s) => activeCourse === "all" || s.course === activeCourse), [data.sources, activeCourse]);
  const selectedId = params.get("id") ?? sources[0]?.id;
  const selected = data.sources.find((s) => s.id === selectedId);
  const hl = params.get("hl");
  const grouped = useMemo(() => {
    const m = new Map<string, typeof sources>();
    sources.forEach((s) => m.set(s.course, [...(m.get(s.course) ?? []), s]));
    return Array.from(m.entries());
  }, [sources]);
  const itemCount = (id: string) => data.items.filter((i) => i.status !== "discarded" && i.evidence.some((e) => e.sourceId === id)).length;

  return (
    <div>
      <PageHeader eyebrow="Sources" title="Your original notes" lede="The ground truth. Everything in Margin points back to a line on one of these pages.">
        <Button onClick={() => setAdding(true)} data-testid="button-add-source"><FilePlus2 className="mr-2 h-4 w-4" />Add source</Button>
      </PageHeader>

      {sources.length === 0 ? (
        <EmptyState title="No sources yet" action={<Button onClick={() => setAdding(true)} data-testid="button-add-source-empty">Add your first source</Button>}>
          Paste lecture notes or upload a .txt or .md file. Margin will propose items for you to review — locally.
        </EmptyState>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="space-y-6">
            {grouped.map(([course, list]) => (
              <div key={course}>
                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{course}</p>
                <ul className="space-y-1">
                  {list.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/sources?id=${s.id}`}
                        className={cn("block rounded-md border px-3 py-2.5 transition-colors", s.id === selectedId ? "border-primary/40 bg-card shadow-sm" : "border-transparent hover:bg-card/60")}
                        data-testid={`link-source-${s.id}`}
                      >
                        <p className="font-reading text-[16px] leading-snug">{s.title}</p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {itemCount(s.id)} items{s.demo && " · demo"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {selected ? (
            <article className="rise min-w-0 rounded-2xl border bg-card">
              <header className="flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] text-muted-foreground">{selected.course} · added {format(new Date(selected.createdAt), "d MMM yyyy")}{selected.demo && " · demo source"}</p>
                  <h2 className="mt-1 font-reading text-3xl" data-testid="text-source-title">{selected.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const n = runExtraction(selected.id);
                      toast({ title: n ? `${n} new item${n === 1 ? "" : "s"} proposed` : "Nothing new found", description: n ? "Review them before they reach your library." : "Every extractable line is already in Review or your library." });
                    }}
                    data-testid="button-extract"
                  >
                    <Wand2 className="mr-1.5 h-3.5 w-3.5" />Extract
                  </Button>
                  <Confirm
                    trigger={<Button variant="ghost" size="sm" aria-label="Delete source" data-testid="button-delete-source"><Trash2 className="h-4 w-4" /></Button>}
                    title="Delete this source?"
                    description="Its text is removed. Items that only cite this source, and their study history, are removed too. Items citing other sources keep those citations."
                    confirmLabel="Delete source"
                    onConfirm={() => { deleteSource(selected.id); go("/sources"); }}
                  />
                </div>
              </header>
              {hl && <p className="border-b bg-ochre/[0.07] px-6 py-2 text-[12.5px] text-muted-foreground">Showing the cited excerpt highlighted in the full original text.</p>}
              <div className="ruled whitespace-pre-wrap px-6 py-4 font-reading text-[17px] text-foreground/90 md:px-10" data-testid="text-source-body">
                <Highlighted text={selected.text} hl={hl} />
              </div>
            </article>
          ) : (
            <EmptyState title="Source not found">It may have been deleted.</EmptyState>
          )}
        </div>
      )}
      <AddSourceDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
