import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, Merge, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseItems, useStore } from "@/lib/store";
import { type Item, type Kind, KINDS, KIND_LABEL } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Confirm, DemoTag, EmptyState, EvidenceList, Interpretation, ItemEditDialog, KindBadge, PageHeader } from "@/components/bits";
import { useToast } from "@/hooks/use-toast";

function ReviewCard({ item, selected, onSelect, onEdit }: { item: Item; selected: boolean; onSelect: (v: boolean) => void; onEdit: () => void }) {
  const { setStatus, updateItem, deleteItem } = useStore();
  const { toast } = useToast();
  const discarded = item.status === "discarded";
  return (
    <article className={cn("rise rounded-xl border bg-card p-5 transition-shadow", selected && "border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]")} data-testid={`card-review-${item.id}`}>
      <div className="flex items-start gap-3">
        {!discarded && <Checkbox checked={selected} onCheckedChange={(v) => onSelect(!!v)} className="mt-1.5" aria-label={`Select ${item.title}`} data-testid={`checkbox-select-${item.id}`} />}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <KindBadge kind={item.kind} generated={item.generated} />
            <DemoTag item={item} />
            {item.edited && <span className="text-[11px] text-primary">edited</span>}
            {item.evidence.length > 1 && <span className="font-mono text-[11px] text-muted-foreground">{item.evidence.length} sources merged</span>}
            {item.tags.map((t) => <span key={t} className="font-mono text-[11px] text-muted-foreground">#{t}</span>)}
          </div>
          <h3 className="font-reading text-xl leading-snug">{item.title}</h3>
          <div className="mt-3 space-y-3">
            <Interpretation item={item} />
            <EvidenceList item={item} compact />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {discarded ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setStatus(item.id, "pending")} data-testid={`button-restore-${item.id}`}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Restore</Button>
                <Confirm
                  trigger={<Button size="sm" variant="ghost" className="text-destructive" data-testid={`button-delete-${item.id}`}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete forever</Button>}
                  title="Delete permanently?"
                  description="The item is removed. Your source text is not affected and you can extract it again."
                  confirmLabel="Delete"
                  onConfirm={() => deleteItem(item.id)}
                />
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => { setStatus(item.id, "approved"); toast({ title: "Approved", description: "Added to your library." }); }} data-testid={`button-approve-${item.id}`}>
                  <Check className="mr-1.5 h-3.5 w-3.5" />Approve
                </Button>
                <Button size="sm" variant="outline" onClick={onEdit} data-testid={`button-edit-${item.id}`}><Pencil className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
                <Select value={item.kind} onValueChange={(v) => updateItem(item.id, { kind: v as Kind })}>
                  <SelectTrigger className="h-8 w-[130px] text-[13px]" aria-label="Change kind" data-testid={`select-kind-${item.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>)}</SelectContent>
                </Select>
                <Confirm
                  trigger={<Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" data-testid={`button-discard-${item.id}`}><X className="mr-1.5 h-3.5 w-3.5" />Discard</Button>}
                  title="Discard this item?"
                  description="It moves to Discarded, where you can restore it later. It will not appear in your library or study sessions."
                  confirmLabel="Discard"
                  onConfirm={() => setStatus(item.id, "discarded")}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Review() {
  const items = useCourseItems();
  const { mergeItems } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"pending" | "discarded">("pending");
  const [kind, setKind] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Item | null>(null);

  const list = useMemo(() => items.filter((i) => i.status === tab && (kind === "all" || i.kind === kind)), [items, tab, kind]);
  const counts = { pending: items.filter((i) => i.status === "pending").length, discarded: items.filter((i) => i.status === "discarded").length };

  const toggle = (id: string, v: boolean) => setSelected((s) => { const n = new Set(s); if (v) n.add(id); else n.delete(id); return n; });
  const doMerge = () => {
    const m = mergeItems(Array.from(selected));
    setSelected(new Set());
    if (m) toast({ title: "Merged — still pending", description: `${m.evidence.length} original references kept. Approve it when ready.` });
  };

  return (
    <div>
      <PageHeader eyebrow="Review" title="What did your notes say?" lede="Proposed by local extraction from your sources. Each item shows the full, unchanged excerpt it came from. Only what you approve reaches the library." />

      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur md:top-0 md:-mx-0 md:px-0">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as "pending" | "discarded"); setSelected(new Set()); }}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">Pending · {counts.pending}</TabsTrigger>
            <TabsTrigger value="discarded" data-testid="tab-discarded">Discarded · {counts.discarded}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="h-9 w-[150px]" data-testid="select-review-kind"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kinds</SelectItem>
            {KINDS.map((k) => <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>)}
          </SelectContent>
        </Select>
        {tab === "pending" && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground" data-testid="text-selected-count">{selected.size} selected</span>
            {selected.size > 0 && <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} data-testid="button-clear-selection">Clear</Button>}
            <Button size="sm" variant="secondary" disabled={selected.size < 2} onClick={doMerge} data-testid="button-merge"><Merge className="mr-1.5 h-3.5 w-3.5" />Merge</Button>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        tab === "pending" ? (
          <EmptyState title="All caught up" action={<Link href="/sources" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Go to sources</Link>}>
            No pending items{kind !== "all" ? " of this kind" : ""}. Add a source or run extraction to propose more.
          </EmptyState>
        ) : (
          <EmptyState title="Nothing discarded">Items you discard rest here and can be restored.</EmptyState>
        )
      ) : (
        <div className="space-y-4">
          {list.map((i) => (
            <ReviewCard key={i.id} item={i} selected={selected.has(i.id)} onSelect={(v) => toggle(i.id, v)} onEdit={() => setEditing(i)} />
          ))}
        </div>
      )}
      <ItemEditDialog item={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
}
