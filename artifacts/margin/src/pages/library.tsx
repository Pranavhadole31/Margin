import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Pencil, Search, Undo2 } from "lucide-react";
import { useCourseItems, useStore } from "@/lib/store";
import { type Item, KINDS, KIND_LABEL } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DemoTag, EmptyState, EvidenceList, Interpretation, ItemEditDialog, KindBadge, PageHeader } from "@/components/bits";

function ItemDetail({ item, onClose, onEdit }: { item: Item | null; onClose: () => void; onEdit: () => void }) {
  const { setStatus, data } = useStore();
  if (!item) return null;
  const res = data.results.filter((r) => r.itemId === item.id);
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2"><KindBadge kind={item.kind} generated={item.generated} /><DemoTag item={item} /></div>
          <DialogTitle className="pt-1 font-reading text-3xl font-medium leading-tight">{item.title}</DialogTitle>
          <DialogDescription>
            {item.kind === "howto" ? "How-to, exactly as written in your source." : "Approved item."}{" "}
            {res.length ? `Studied ${res.length} time${res.length === 1 ? "" : "s"}, ${res.filter((r) => r.correct).length} correct.` : "Not studied yet."}
          </DialogDescription>
        </DialogHeader>
        <section>
          <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-pencil">Original source</p>
          <EvidenceList item={item} />
        </section>
        {(item.body || item.generated) && (
          <section>
            <Interpretation item={item} />
          </section>
        )}
        {item.tags.length > 0 && <p className="font-mono text-[12px] text-muted-foreground">{item.tags.map((t) => `#${t}`).join("  ")}</p>}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={onEdit} data-testid="button-detail-edit"><Pencil className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => { setStatus(item.id, "pending"); onClose(); }} data-testid="button-detail-unapprove"><Undo2 className="mr-1.5 h-3.5 w-3.5" />Move back to review</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Library() {
  const items = useCourseItems();
  const { data, activeCourse } = useStore();
  const search = useSearch();
  const [, go] = useLocation();
  const openId = new URLSearchParams(search).get("item");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [editing, setEditing] = useState<Item | null>(null);

  const approved = useMemo(() => items.filter((i) => i.status === "approved"), [items]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/^#/, "");
    return approved.filter(
      (i) =>
        (kind === "all" || i.kind === kind) &&
        (!needle || i.title.toLowerCase().includes(needle) || i.body.toLowerCase().includes(needle) || i.tags.some((t) => t.includes(needle)) || i.evidence.some((e) => e.excerpt.toLowerCase().includes(needle))),
    );
  }, [approved, q, kind]);
  const open = approved.find((i) => i.id === openId) ?? null;

  const summaries = useMemo(
    () =>
      data.sources
        .filter((s) => activeCourse === "all" || s.course === activeCourse)
        .map((s) => ({ source: s, items: approved.filter((i) => !i.generated && i.evidence.some((e) => e.sourceId === s.id)) }))
        .filter((x) => x.items.length > 0),
    [data.sources, approved, activeCourse],
  );

  return (
    <div>
      <PageHeader eyebrow="Library" title="What you've decided to keep" lede="Only approved items live here. Original excerpts are marked in rust and link back to the source; anything you wrote is labeled as your interpretation." />
      {approved.length === 0 ? (
        <EmptyState title="Your library is empty" action={<Button asChild><Link href="/review">Review pending items</Link></Button>}>
          Approve items in Review and they'll appear here, each tied to the exact lines they came from.
        </EmptyState>
      ) : (
        <Tabs defaultValue="items">
          <TabsList className="mb-6">
            <TabsTrigger value="items" data-testid="tab-items">Items · {approved.length}</TabsTrigger>
            <TabsTrigger value="summaries" data-testid="tab-summaries">Source summaries</TabsTrigger>
          </TabsList>
          <TabsContent value="items">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search text or #tag" className="pl-9" data-testid="input-library-search" />
              </div>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className="sm:w-[170px]" data-testid="select-library-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All kinds</SelectItem>
                  {KINDS.map((k) => <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {filtered.length === 0 ? (
              <EmptyState title="No matches">Try another word or clear the kind filter.</EmptyState>
            ) : (
              <ul className="divide-y rounded-2xl border bg-card">
                {filtered.map((i) => (
                  <li key={i.id}>
                    <button onClick={() => go(`/library?item=${i.id}`)} className="group grid w-full gap-1 px-5 py-4 text-left transition-colors hover:bg-muted/40 md:grid-cols-[1fr_auto] md:gap-6" data-testid={`button-open-item-${i.id}`}>
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2"><KindBadge kind={i.kind} generated={i.generated} /><DemoTag item={i} /></div>
                        <p className="font-reading text-[19px] leading-snug group-hover:text-primary">{i.title}</p>
                        <p className="mt-1 line-clamp-2 font-reading text-[14.5px] italic text-muted-foreground">“{i.evidence[0].excerpt}”</p>
                      </div>
                      <div className="flex items-start gap-2 font-mono text-[11px] text-muted-foreground md:flex-col md:items-end">
                        <span>{i.evidence.length} citation{i.evidence.length === 1 ? "" : "s"}</span>
                        {i.tags.slice(0, 2).map((t) => <span key={t}>#{t}</span>)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="summaries" className="space-y-8">
            <p className="text-sm text-muted-foreground">Extractive summaries: the approved excerpts from each source, in their original words, with numbered citations. Nothing here is rewritten.</p>
            {summaries.length === 0 && <EmptyState title="No summaries yet">Approve non-question items to build summaries.</EmptyState>}
            {summaries.map(({ source, items: its }) => (
              <article key={source.id} className="rounded-2xl border bg-card px-6 py-5">
                <p className="font-mono text-[11px] text-muted-foreground">{source.course}</p>
                <h3 className="mb-4 font-reading text-2xl">
                  <Link href={`/sources?id=${source.id}`} className="hover:text-primary" data-testid={`link-summary-source-${source.id}`}>{source.title}</Link>
                </h3>
                <ol className="space-y-3">
                  {its.map((it, n) =>
                    it.evidence
                      .filter((e) => e.sourceId === source.id)
                      .map((e, k) => (
                        <li key={`${it.id}-${k}`} className="flex gap-3">
                          <Link href={`/sources?id=${source.id}&hl=${encodeURIComponent(e.excerpt.slice(0, 400))}`} className="font-mono text-[12px] text-pencil hover:underline" data-testid={`link-cite-${it.id}-${k}`}>[{n + 1}]</Link>
                          <p className="whitespace-pre-wrap font-reading text-[16px] leading-relaxed">{e.excerpt}</p>
                        </li>
                      )),
                  )}
                </ol>
              </article>
            ))}
          </TabsContent>
        </Tabs>
      )}
      <ItemDetail item={editing ? null : open} onClose={() => go("/library")} onEdit={() => setEditing(open)} />
      <ItemEditDialog item={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
}
