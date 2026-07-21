"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS, type ActivePage } from "./ui";

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
    <div className="md:hidden flex items-center w-full justify-end min-h-12">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex items-center gap-2 py-2 text-white text-sm font-semibold"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
        Menu
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-0 right-0 bottom-0 w-[86%] max-w-[340px] bg-card border-l border-rule flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <header className="px-5 h-14 bg-accent text-white flex items-center justify-between">
              <span className="eyebrow" style={{ letterSpacing: "0.08em" }}>
                FCA Vibe-Coding
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-1 text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
            </header>

            <nav className="flex-1 overflow-y-auto">
              <ul>
                {NAV_LINKS.map((l) => (
                  <li key={l.href} className="border-b border-rule">
                    <a
                      href={l.href}
                      className={`flex items-center px-5 py-4 text-sm font-semibold transition-colors ${
                        l.highlight
                          ? "text-accent"
                          : l.page === activePage
                            ? "text-accent border-l-[3px] border-accent pl-[17px]"
                            : "text-ink-secondary hover:text-accent"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {l.highlight && <span aria-hidden className="mr-1.5 text-brand-coral">★</span>}
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <footer className="px-5 py-4 border-t border-rule">
              <a
                href="/phoenix-watch"
                onClick={() => setOpen(false)}
                className="block text-center text-sm font-semibold bg-accent text-white py-3 rounded-[2px] hover:bg-accent-hover transition-colors"
              >
                Open Phoenix Watch
              </a>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
