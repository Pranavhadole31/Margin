import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Download, FileText, GraduationCap, Inbox, LineChart, NotebookPen, Search, Settings2, ShieldCheck, Upload, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { validateData } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Confirm } from "@/components/bits";
import { useToast } from "@/hooks/use-toast";

const NAV = [
  { href: "/", label: "Notebook", icon: NotebookPen },
  { href: "/sources", label: "Sources", icon: FileText },
  { href: "/review", label: "Review", icon: Inbox },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/study", label: "Study", icon: GraduationCap },
  { href: "/understanding", label: "Understanding", icon: LineChart },
];

function CourseSelect() {
  const { courses, activeCourse, setActiveCourse } = useStore();
  return (
    <Select value={activeCourse} onValueChange={setActiveCourse}>
      <SelectTrigger className="h-9 bg-card/70 text-[13px]" data-testid="select-course" aria-label="Course filter">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All courses</SelectItem>
        {courses.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data } = useStore();
  const [, go] = useLocation();
  const pick = (href: string) => {
    onOpenChange(false);
    go(href);
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search sources, items, tags…" data-testid="input-global-search" />
      <CommandList>
        <CommandEmpty>Nothing in your notebook matches.</CommandEmpty>
        <CommandGroup heading="Pages">
          {NAV.map((n) => (
            <CommandItem key={n.href} value={`page ${n.label}`} onSelect={() => pick(n.href)}>
              <n.icon className="mr-2 h-4 w-4" /> {n.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Sources">
          {data.sources.map((s) => (
            <CommandItem key={s.id} value={`source ${s.title} ${s.course} ${s.text.slice(0, 2000)}`} onSelect={() => pick(`/sources?id=${s.id}`)}>
              <FileText className="mr-2 h-4 w-4" /> {s.title} <span className="ml-2 text-xs text-muted-foreground">{s.course}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Items">
          {data.items
            .filter((i) => i.status !== "discarded")
            .map((i) => (
              <CommandItem
                key={i.id}
                value={`item ${i.title} ${i.tags.join(" ")} ${i.evidence.map((e) => e.excerpt).join(" ").slice(0, 1500)} ${i.id}`}
                onSelect={() => pick(i.status === "approved" ? `/library?item=${i.id}` : `/review`)}
              >
                <span className="truncate">{i.title}</span>
                <span className="ml-auto pl-2 text-[11px] uppercase tracking-wider text-muted-foreground">{i.status === "approved" ? "Library" : "Review"}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, replaceAll, resetDemo, clearAll, storageError, saveBlocked } = useStore();
  const { toast } = useToast();
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `margin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Backup exported", description: "Saved as a JSON file on this device." });
  };

  const importJson = async (f: File | undefined) => {
    setImportError(null);
    if (!f) return;
    if (!/\.json$/i.test(f.name)) return setImportError("Choose a .json backup exported from Margin.");
    if (f.size > 5 * 1024 * 1024) return setImportError("Backup is larger than 5 MB and was not imported.");
    try {
      const v = validateData(JSON.parse(await f.text()));
      if (!v.ok) return setImportError(v.error);
      replaceAll(v.data);
      toast({ title: "Backup imported", description: `${v.data.sources.length} sources, ${v.data.items.length} items, ${v.data.results.length} study results.` });
      onOpenChange(false);
    } catch {
      setImportError("This file is not valid JSON.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-reading text-2xl font-medium">Privacy & your data</DialogTitle>
          <DialogDescription>How Margin stores what you write.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-[14px] leading-relaxed">
          <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage" />Everything lives in this browser's localStorage. No account or login is needed, and nothing is uploaded.</li>
          <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage" />Extraction runs locally with headings, sentences and keywords. No external AI is called.</li>
          <li className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />Data is not synced between devices and is not encrypted. Anyone using this browser profile can read it, and clearing site data erases it. Export backups regularly.</li>
        </ul>
        {storageError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {storageError}
            {saveBlocked && " Saving is paused so unreadable data is not overwritten. Import a backup, reset the demo, or clear data to continue."}
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={exportJson} data-testid="button-export">
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} data-testid="button-import">
            <Upload className="mr-2 h-4 w-4" /> Import backup
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} data-testid="input-import-file" />
        </div>
        {importError && <p className="text-sm text-destructive" role="alert" data-testid="text-import-error">{importError}</p>}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Confirm
            trigger={<Button variant="ghost" size="sm" data-testid="button-reset-demo">Reset to demo notebook</Button>}
            title="Reset to the demo?"
            description="This replaces everything in this browser with the demo course. Export a backup first if you want to keep your notes."
            confirmLabel="Reset"
            onConfirm={() => { resetDemo(); onOpenChange(false); }}
          />
          <Confirm
            trigger={<Button variant="ghost" size="sm" className="text-destructive" data-testid="button-clear-all">Erase all data</Button>}
            title="Erase your notebook?"
            description="All sources, items and study history will be removed from this browser. This cannot be undone."
            confirmLabel="Erase everything"
            onConfirm={() => { clearAll(); onOpenChange(false); }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data, storageError } = useStore();
  const pending = data.items.filter((i) => i.status === "pending").length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-baseline gap-2 px-2" data-testid="link-home">
          <span className="font-reading text-[28px] italic leading-none">Margin</span>
          <span className="h-5 w-px translate-y-0.5 bg-pencil" />
        </Link>
        <button
          onClick={() => setSearchOpen(true)}
          className="mb-4 flex items-center gap-2 rounded-md border border-sidebar-border bg-card/60 px-3 py-2 text-left text-[13px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          data-testid="button-open-search"
        >
          <Search className="h-3.5 w-3.5" /> Search notebook
          <kbd className="ml-auto font-mono text-[10px]">Ctrl K</kbd>
        </button>
        <nav className="space-y-0.5">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              data-testid={`link-nav-${n.label.toLowerCase()}`}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[14px] transition-colors",
                isActive(n.href) ? "bg-sidebar-accent font-medium text-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <span className={cn("absolute -left-4 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-pencil transition-transform", isActive(n.href) ? "scale-y-100" : "scale-y-0")} />
              <n.icon className="h-4 w-4" />
              {n.label}
              {n.href === "/review" && pending > 0 && (
                <span className="ml-auto rounded-full bg-pencil/15 px-1.5 font-mono text-[11px] text-pencil" data-testid="text-pending-count">{pending}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-6 px-1">
          <p className="mb-1.5 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Course</p>
          <CourseSelect />
        </div>
        <div className="mt-auto space-y-3">
          <button onClick={() => setSettingsOpen(true)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent/60" data-testid="button-open-settings">
            <Settings2 className="h-4 w-4" /> Privacy & data
          </button>
          <p className="px-3 font-mono text-[10.5px] leading-relaxed text-muted-foreground">
            Local extraction • no external AI
            <br />
            Saved in this browser only
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/" className="font-reading text-2xl italic" data-testid="link-home-mobile">Margin</Link>
          <div className="ml-auto w-36"><CourseSelect /></div>
          <Button size="icon" variant="ghost" onClick={() => setSearchOpen(true)} aria-label="Search" data-testid="button-open-search-mobile"><Search className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setSettingsOpen(true)} aria-label="Privacy and data" data-testid="button-open-settings-mobile"><Settings2 className="h-4 w-4" /></Button>
        </header>
        {storageError && (
          <div role="alert" className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-[13px] text-destructive md:px-10" data-testid="text-storage-error">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{storageError}</span>
            <button className="underline" onClick={() => setSettingsOpen(true)}>Manage data</button>
          </div>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-8 md:px-10 md:pb-16 md:pt-12">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-background/95 backdrop-blur md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} data-testid={`link-mobile-${n.label.toLowerCase()}`} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px]", isActive(n.href) ? "text-pencil" : "text-muted-foreground")}>
              <n.icon className="h-[18px] w-[18px]" />
              {n.label === "Understanding" ? "Progress" : n.label}
            </Link>
          ))}
        </nav>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
