/**
 * Shared UI for the "Vibe Coding at the FCA" pitch site.
 *
 * Deliberately NOT using FCA logos, fonts or brand assets — this is a neutral
 * fintech/regtech look (deep slate canvas, electric-teal accent, Inter). The
 * wordmark is a plain type treatment, not an FCA mark.
 */

import MobileNavMenu from "./MobileNavMenu";

/** Dark ambient background: soft radial glows + faint grid. No external assets. */
export function GlowField({ intensity = "medium" }: { intensity?: "soft" | "medium" | "strong" }) {
  const a =
    intensity === "soft" ? 0.10 :
    intensity === "strong" ? 0.24 :
    0.16;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute -top-1/3 -left-[10%] w-[55%] h-[120%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, rgba(45,212,191,${a}), transparent 70%)` }}
      />
      <div
        className="absolute top-1/4 -right-[10%] w-[50%] h-[120%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, rgba(59,130,246,${a * 0.9}), transparent 70%)` }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 75%)",
        }}
      />
    </div>
  );
}

/** Small monogram wordmark used in nav + footer. Pure type, no FCA branding. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-blue text-ink font-black text-sm shadow-lg shadow-teal/20">
        {"</>"}
      </span>
      <span className="font-extrabold tracking-tight text-text leading-none">
        Vibe&nbsp;Coding<span className="text-muted font-semibold"> · FCA</span>
      </span>
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
    `text-sm font-semibold transition-colors ${
      activePage === page ? "text-teal" : "text-text-soft hover:text-teal"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-ink/80 backdrop-blur-md border-b border-line">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-3">
        <a href="/" className="flex-shrink-0">
          <Wordmark />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className={linkClass(l.page)}>{l.label}</a>
          ))}
          <a
            href="#choose"
            className="bg-teal text-ink text-sm font-bold px-4 py-2 rounded-full hover:bg-teal-bright transition-colors whitespace-nowrap"
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
    <footer className="bg-ink-2 border-t border-line">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="max-w-md">
            <Wordmark className="mb-3" />
            <p className="text-muted text-sm leading-relaxed">
              A live demonstration for the Financial Conduct Authority. Every tool
              shown is built from <strong className="text-text-soft">100% public FCA
              data</strong> — nothing touches internal systems.
            </p>
            <p className="text-muted-dark text-xs mt-3">
              Not affiliated with, or endorsed by, the FCA. No FCA logos, fonts or
              brand assets are used.
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-teal text-sm font-semibold mb-1">Public data verified</p>
            <p className="text-text-soft text-sm font-bold">21 July 2026</p>
            <p className="text-muted-dark text-xs mt-2 max-w-xs md:ml-auto">
              Register API, Warning List, fines tables, complaints workbooks and the
              news feed — all checked live this morning.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
