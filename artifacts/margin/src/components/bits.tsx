import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { type Item, type Kind, KINDS, KIND_LABEL } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const KIND_TONE: Record<Kind, string> = {
  concept: "bg-primary/10 text-primary",
  term: "bg-pencil/10 text-pencil",
  system: "bg-sage/12 text-sage",
  process: "bg-ochre/12 text-ochre",
  howto: "bg-chart-5/12 text-chart-5",
  question: "bg-muted text-muted-foreground",
};

export function KindBadge({ kind, generated }: { kind: Kind; generated?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em]", KIND_TONE[kind])}>
      {generated ? "Generated question" : KIND_LABEL[kind]}
    </span>
  );
}

export function DemoTag({ item }: { item: Pick<Item, "demo" | "status"> }) {
  if (!item.demo) return null;
  return (
    <span className="rounded-full border border-dashed border-ochre/50 px-2 py-0.5 text-[11px] text-ochre">
      {item.status === "approved" ? "Demo-approved" : "Demo"}
    </span>
  );
}

export function PageHeader({ eyebrow, title, children, lede }: { eyebrow: string; title: string; lede?: ReactNode; children?: ReactNode }) {
  return (
    <header className="rise mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-pencil">{eyebrow}</p>
        <h1 className="font-reading text-4xl font-medium tracking-tight md:text-5xl">{title}</h1>
        {lede && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{lede}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rise rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <div className="mx-auto mb-4 h-10 w-px bg-pencil/50" />
      <h3 className="font-reading text-2xl">{title}</h3>
      {children && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{children}</p>}
      {action && <div className="mt-6 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Original source facts. Each excerpt is shown in full and links to the source. */
export function EvidenceList({ item, compact }: { item: Item; compact?: boolean }) {
  const { sourceById } = useStore();
  return (
    <div className="space-y-2">
      {item.evidence.map((e, i) => {
        const src = sourceById(e.sourceId);
        return (
          <figure key={i} className="group">
            <Link
              href={`/sources?id=${e.sourceId}&hl=${encodeURIComponent(e.excerpt.slice(0, 400))}`}
              className="block rounded-r-md px-4 py-2.5 transition-colors excerpt hover:bg-pencil/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid={`link-evidence-${item.id}-${i}`}
            >
              <blockquote className={cn("text-[15.5px] leading-relaxed text-foreground/90", compact && "text-[14.5px]")}>{e.excerpt}</blockquote>
              <figcaption className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-muted-foreground group-hover:text-pencil">
                [{i + 1}] {src ? `${src.title} · ${src.course}` : "Source removed"}
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </figcaption>
            </Link>
          </figure>
        );
      })}
    </div>
  );
}

export function Interpretation({ item }: { item: Item }) {
  if (item.generated)
    return (
      <div className="flex gap-2 rounded-md bg-muted/70 px-3 py-2 text-[13px] text-muted-foreground">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Generated investigation prompt — a question to explore, not a factual claim. The excerpt shows what prompted it.
      </div>
    );
  if (!item.body) return null;
  return (
    <div className="rounded-md border border-primary/20 bg-primary/[0.04] px-3 py-2">
      <p className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-primary">Your interpretation</p>
      <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{item.body}</p>
    </div>
  );
}

export function Confirm({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-reading text-2xl font-medium">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-confirm-cancel">Keep it</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-ok">
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ItemEditDialog({ item, open, onOpenChange }: { item: Item | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { updateItem } = useStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Kind>("concept");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item && open) {
      setTitle(item.title);
      setBody(item.body);
      setKind(item.kind);
      setTags(item.tags.join(", "));
      setError(null);
    }
  }, [item, open]);

  if (!item) return null;
  const save = () => {
    if (!title.trim()) return setError("Title cannot be empty.");
    const changedText = title.trim() !== item.title || body.trim() !== item.body;
    updateItem(item.id, {
      title: title.trim(),
      body: body.trim(),
      kind,
      tags: Array.from(new Set(tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))),
      edited: item.edited || changedText,
    });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-reading text-2xl font-medium">Edit item</DialogTitle>
          <DialogDescription>Edits are saved as your interpretation. The original excerpt below never changes.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-edit-title" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                <SelectTrigger data-testid="select-edit-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input id="edit-tags" value={tags} onChange={(e) => setTags(e.target.value)} data-testid="input-edit-tags" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-body">Your interpretation</Label>
            <Textarea
              id="edit-body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="In your own words — optional. Shown separately from the source."
              data-testid="input-edit-body"
            />
          </div>
          <div>
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Original source (read-only)</p>
            <EvidenceList item={item} compact />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="button-edit-cancel">
            Cancel
          </Button>
          <Button onClick={save} data-testid="button-edit-save">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Meter({ value, label, tone = "primary" }: { value: number; label: string; tone?: "primary" | "pencil" | "sage" }) {
  const pct = Math.round(value * 1000) / 10;
  const color = tone === "pencil" ? "bg-pencil" : tone === "sage" ? "bg-sage" : "bg-primary";
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full origin-left rounded-full transition-transform duration-700", color)} style={{ transform: `scaleX(${value})` }} />
    </div>
  );
}
