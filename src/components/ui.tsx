/**
 * Shared UI for the "Vibe Coding at the FCA" pitch site.
 *
 * Light, editorial regulator aesthetic: warm paper, deep regulator-blue ink,
 * Newsreader serif display + Inter. Deliberately NOT using FCA logos, fonts or
 * brand assets. The wordmark is a plain type treatment, not an FCA mark.
 */

import MobileNavMenu from "./MobileNavMenu";

/**
 * Optional near-imperceptible rule grid behind a hero. Replaces the old neon
 * glow field. No radial glows, blur or animation — paper and spacing do the work.
 */
export function GlowField() {
  return (
    <div className="absolute inset-0 pointer-events-none paper-grid" aria-hidden />
  );
}

/** Pure-type wordmark used in nav + footer. No logo, monogram, symbol or icon. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`eyebrow text-ink ${className}`}
      style={{ letterSpacing: "0.12em" }}
    >
      FCA <span className="text-highlight">/</span> Vibe-Coding Sessions
    </span>
  );
}

export type ActivePage = "home" | "how-it-works" | "method";

export const NAV_LINKS: { href: string; label: string; page: ActivePage }[] = [
  { href: "/", label: "The Session", page: "home" },
  { href: "/how-it-works", label: "How It Works", page: "how-it-works" },
  { href: "/method", label: "The Method", page: "method" },
];

export function SiteNav({ activePage }: { activePage: ActivePage }) {
  const linkClass = (page: string) =>
    `eyebrow transition-colors pb-1 border-b ${
      activePage === page
        ? "text-ink border-ink"
        : "text-ink-secondary border-transparent hover:text-accent"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-paper-raised border-b border-rule">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        <a href="/" className="flex-shrink-0">
          <Wordmark />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className={linkClass(l.page)}>
              {l.label}
            </a>
          ))}
          <a
            href="#choose"
            className="eyebrow bg-accent text-paper-raised px-4 py-2.5 rounded-[2px] hover:bg-accent-hover transition-colors whitespace-nowrap"
          >
            What shall we build?
          </a>
        </nav>

        {/* Mobile */}
        <MobileNavMenu activePage={activePage} />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-paper-raised border-t border-rule-strong">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-14">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="max-w-md">
            <Wordmark className="mb-4 inline-block" />
            <p className="text-ink-secondary text-sm leading-relaxed">
              A live demonstration for the Financial Conduct Authority. Every tool
              shown is built from{" "}
              <strong className="text-ink font-semibold">100% public data</strong> &mdash;
              company records, regulator publications and more &mdash; nothing touches
              anyone&apos;s internal systems.
            </p>
            <p className="text-ink-muted text-xs mt-3 leading-relaxed">
              Not affiliated with, or endorsed by, the FCA. No FCA logos, fonts or
              brand assets are used.
            </p>
          </div>
          <div className="md:text-right">
            <p className="eyebrow text-success mb-2 md:pr-3 md:border-r-0">
              Public data &middot; verified
            </p>
            <p className="text-ink text-sm font-semibold tnum">21 July 2026</p>
            <p className="text-ink-muted text-xs mt-2 max-w-xs md:ml-auto leading-relaxed">
              Register API, Warning List, fines tables, complaints workbooks and the
              news feed &mdash; all checked live this morning.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
