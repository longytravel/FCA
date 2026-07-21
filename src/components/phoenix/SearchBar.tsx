"use client";

import { useEffect, useRef, useState } from "react";
import { CASES, fmtDate } from "./graph-utils";

type CHResult = {
  title: string;
  company_number: string;
  company_status?: string;
  date_of_creation?: string;
  address_snippet?: string;
};

export default function SearchBar({
  onSelect,
  busy,
}: {
  onSelect: (companyNumber: string, name: string) => void;
  busy?: boolean;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CHResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ch/search?q=${encodeURIComponent(q.trim())}`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`Search unavailable (${res.status})`);
        const data = await res.json();
        setResults(Array.isArray(data.items) ? data.items.slice(0, 8) : []);
        setOpen(true);
        setActive(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (r: CHResult) => {
    setQ(r.title);
    setOpen(false);
    onSelect(r.company_number, r.title);
  };

  // Immediate search (Search button / Enter) — no debounce wait.
  const searchNow = async () => {
    const term = q.trim();
    if (term.length < 2) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ch/search?q=${encodeURIComponent(term)}`, { signal: ac.signal });
      if (!res.ok) throw new Error(`Search unavailable (${res.status})`);
      const data = await res.json();
      const items: CHResult[] = Array.isArray(data.items) ? data.items.slice(0, 8) : [];
      setResults(items);
      setOpen(true);
      setActive(-1);
      if (items.length === 1) choose(items[0]);
      if (items.length === 0) setError(`No Companies House match for “${term}”.`);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (results.length > 0) choose(results[active >= 0 ? active : 0]);
    else searchNow();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="w-full">
      <div ref={boxRef} className="relative">
        <div className="flex">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Search a firm by name or company number…"
            aria-label="Search Companies House"
            className="w-full border border-[#d2d2d4] border-r-0 bg-white px-3 py-2 text-[14px] text-[#3f3f3f] placeholder:text-[#9a9a9d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c1d45]"
          />
          <button
            type="button"
            onClick={submit}
            aria-label="Search Companies House"
            className="flex items-center border border-[#6c1d45] bg-[#6c1d45] px-3 text-[13px] font-bold text-white hover:bg-[#59183a]"
          >
            {loading || busy ? "…" : "Search"}
          </button>
        </div>

        {open && (results.length > 0 || error) ? (
          <ul className="absolute z-30 mt-[1px] max-h-80 w-full overflow-y-auto border border-[#d2d2d4] bg-white shadow-md">
            {error ? (
              <li className="px-3 py-2 text-[13px] text-[#ff585d]">{error}</li>
            ) : (
              results.map((r, i) => (
                <li key={r.company_number}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(r)}
                    className={`block w-full border-b border-[#eeeeef] px-3 py-2 text-left last:border-b-0 ${
                      i === active ? "bg-[#f0f0f1]" : "bg-white"
                    }`}
                  >
                    <span className="block text-[13px] font-bold text-[#6c1d45]">{r.title}</span>
                    <span className="block text-[12px] text-[#75767a]">
                      {r.company_number}
                      {r.company_status ? ` · ${r.company_status}` : ""}
                      {r.date_of_creation ? ` · inc. ${fmtDate(r.date_of_creation)}` : ""}
                    </span>
                    {r.address_snippet ? (
                      <span className="block truncate text-[12px] text-[#9a9a9d]">{r.address_snippet}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[#75767a]">Jump to a case:</span>
        {CASES.map((c, i) => (
          <button
            key={c.number}
            onClick={() => onSelect(c.number, c.name)}
            className="border border-[#6c1d45] bg-white px-2 py-1 text-[12px] font-medium text-[#6c1d45] hover:bg-[#6c1d45] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c1d45]"
            title={c.blurb}
          >
            <span className="mr-1 font-bold opacity-60">{i + 1}</span>
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
