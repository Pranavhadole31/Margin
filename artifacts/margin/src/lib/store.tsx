import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { extractFromSource } from "./extract";
import { buildDemoData } from "./seed";
import { loadData, saveData } from "./storage";
import { type AppData, type Item, type Source, type Status, type StudyResult, uid } from "./types";

interface Store {
  data: AppData;
  storageError: string | null;
  saveBlocked: boolean;
  courses: string[];
  activeCourse: string; // "all" or course name
  setActiveCourse: (c: string) => void;
  inCourse: (sourceIds: string[]) => boolean;
  sourceById: (id: string) => Source | undefined;
  addSource: (s: { course: string; title: string; text: string }, extract?: boolean) => { source: Source; extracted: number };
  deleteSource: (id: string) => void;
  runExtraction: (sourceId: string) => number;
  updateItem: (id: string, patch: Partial<Item>) => void;
  setStatus: (id: string, status: Status) => void;
  deleteItem: (id: string) => void;
  mergeItems: (ids: string[]) => Item | null;
  addResult: (r: Omit<StudyResult, "id" | "createdAt">) => void;
  replaceAll: (d: AppData) => void;
  resetDemo: () => void;
  clearAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadData(), []);
  const [data, setData] = useState<AppData>(() => (initial.status === "ok" ? initial.data : buildDemoData()));
  const [storageError, setStorageError] = useState<string | null>(initial.status === "error" ? initial.error : null);
  const blocked = useRef(initial.status === "error");
  const [saveBlocked, setSaveBlocked] = useState(blocked.current);
  const [activeCourse, setActiveCourse] = useState("all");
  const first = useRef(true);

  useEffect(() => {
    if (first.current && initial.status === "ok") {
      first.current = false;
      return;
    }
    first.current = false;
    if (blocked.current) return;
    const err = saveData(data);
    setStorageError(err);
  }, [data, initial.status]);

  const unblock = () => {
    blocked.current = false;
    setSaveBlocked(false);
    setStorageError(null);
  };

  const courses = useMemo(() => Array.from(new Set(data.sources.map((s) => s.course))).sort(), [data.sources]);

  const sourceMap = useMemo(() => new Map(data.sources.map((s) => [s.id, s])), [data.sources]);
  const sourceById = useCallback((id: string) => sourceMap.get(id), [sourceMap]);
  const inCourse = useCallback(
    (ids: string[]) => activeCourse === "all" || ids.some((id) => sourceMap.get(id)?.course === activeCourse),
    [activeCourse, sourceMap],
  );

  const addSource: Store["addSource"] = (s, extract) => {
    const src: Source = { id: uid(), course: s.course.trim(), title: s.title.trim(), text: s.text, createdAt: new Date().toISOString(), demo: false };
    const fresh = extract ? extractFromSource(src, []) : [];
    setData((d) => ({ ...d, sources: [src, ...d.sources], items: [...fresh, ...d.items] }));
    return { source: src, extracted: fresh.length };
  };

  const deleteSource = (id: string) =>
    setData((d) => {
      const items = d.items
        .map((i) => ({ ...i, evidence: i.evidence.filter((e) => e.sourceId !== id) }))
        .filter((i) => i.evidence.length > 0);
      const keep = new Set(items.map((i) => i.id));
      return { ...d, sources: d.sources.filter((s) => s.id !== id), items, results: d.results.filter((r) => keep.has(r.itemId)) };
    });

  const runExtraction = (sourceId: string) => {
    const src = data.sources.find((s) => s.id === sourceId);
    if (!src) return 0;
    const fresh = extractFromSource(src, data.items);
    if (fresh.length) setData((d) => ({ ...d, items: [...fresh, ...d.items] }));
    return fresh.length;
  };

  const updateItem = (id: string, patch: Partial<Item>) =>
    setData((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const setStatus = (id: string, status: Status) => updateItem(id, { status });
  const deleteItem = (id: string) =>
    setData((d) => ({ ...d, items: d.items.filter((i) => i.id !== id), results: d.results.filter((r) => r.itemId !== id) }));

  const mergeItems = (ids: string[]) => {
    const parts = ids.map((id) => data.items.find((i) => i.id === id)).filter(Boolean) as Item[];
    if (parts.length < 2) return null;
    const evidence = parts.flatMap((p) => p.evidence).filter((e, i, arr) => arr.findIndex((x) => x.sourceId === e.sourceId && x.excerpt === e.excerpt) === i);
    const bodies = parts.map((p) => p.body).filter(Boolean);
    const merged: Item = {
      id: uid(),
      title: parts[0].title,
      body: bodies.join("\n\n"),
      kind: parts[0].kind,
      tags: Array.from(new Set(parts.flatMap((p) => p.tags))),
      evidence,
      status: "pending",
      createdAt: new Date().toISOString(),
      demo: parts.every((p) => p.demo),
      edited: parts.some((p) => p.edited),
      generated: parts.every((p) => p.generated),
    };
    const gone = new Set(ids);
    setData((d) => ({ ...d, items: [merged, ...d.items.map((i) => (gone.has(i.id) ? { ...i, status: "discarded" as Status } : i))] }));
    return merged;
  };

  const addResult: Store["addResult"] = (r) =>
    setData((d) => ({ ...d, results: [...d.results, { ...r, id: uid(), createdAt: new Date().toISOString() }] }));

  const replaceAll = (d: AppData) => {
    unblock();
    setData(d);
  };
  const resetDemo = () => replaceAll(buildDemoData());
  const clearAll = () => replaceAll({ version: 1, sources: [], items: [], results: [] });

  const value: Store = {
    data,
    storageError,
    saveBlocked,
    courses,
    activeCourse: activeCourse !== "all" && !courses.includes(activeCourse) ? "all" : activeCourse,
    setActiveCourse,
    inCourse,
    sourceById,
    addSource,
    deleteSource,
    runExtraction,
    updateItem,
    setStatus,
    deleteItem,
    mergeItems,
    addResult,
    replaceAll,
    resetDemo,
    clearAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

/** Items visible under the active course filter. */
export function useCourseItems() {
  const { data, inCourse } = useStore();
  return useMemo(() => data.items.filter((i) => inCourse(i.evidence.map((e) => e.sourceId))), [data.items, inCourse]);
}
