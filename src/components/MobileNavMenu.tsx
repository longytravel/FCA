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
    <div className="md:hidden flex items-center gap-3">
      <a
        href="#choose"
        className="eyebrow bg-accent text-paper-raised px-3 py-2 rounded-[2px] whitespace-nowrap"
      >
        Build with us
      </a>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="p-2 -mr-1 rounded-[2px] text-ink-secondary hover:bg-paper transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-ink/25"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-0 right-0 bottom-0 w-[86%] max-w-[340px] bg-paper-raised border-l border-rule flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <header className="px-5 py-4 border-b border-rule flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-1 text-ink-secondary hover:bg-paper rounded-[2px]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
            </header>

            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="px-3">
                {NAV_LINKS.map((l) => (
                  <li key={l.href} className="border-b border-rule last:border-b-0">
                    <a
                      href={l.href}
                      className={`block px-3 py-4 eyebrow transition-colors ${
                        l.page === activePage
                          ? "text-ink"
                          : "text-ink-secondary hover:text-accent"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <footer className="px-5 py-4 border-t border-rule">
              <a
                href="#choose"
                onClick={() => setOpen(false)}
                className="block text-center eyebrow bg-accent text-paper-raised py-3.5 rounded-[2px]"
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
