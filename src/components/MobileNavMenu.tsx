"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS, Wordmark, type ActivePage } from "./ui";

export default function MobileNavMenu({ activePage }: { activePage: ActivePage }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="md:hidden flex items-center gap-2">
      <a
        href="#choose"
        className="bg-teal text-ink text-[11px] font-bold px-3 py-2 rounded-full whitespace-nowrap"
      >
        Build with us
      </a>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="p-2 -mr-1 rounded-md text-text-soft hover:bg-panel transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-0 right-0 bottom-0 w-[86%] max-w-[340px] bg-ink-2 border-l border-line shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <header className="px-5 py-4 border-b border-line flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-1 text-text-soft hover:bg-panel rounded-md"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
            </header>

            <nav className="flex-1 overflow-y-auto py-3">
              <ul className="space-y-1 px-3">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className={`block px-3 py-3 rounded-lg text-base font-bold transition-colors ${
                        l.page === activePage
                          ? "bg-teal text-ink"
                          : "text-text-soft hover:bg-panel"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <footer className="px-5 py-4 border-t border-line">
              <a
                href="#choose"
                onClick={() => setOpen(false)}
                className="block text-center bg-teal text-ink text-sm font-bold py-3 rounded-full"
              >
                What shall we build?
              </a>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
