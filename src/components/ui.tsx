/**
 * Shared site chrome for the "Vibe Coding at the FCA" pitch site.
 *
 * Restyled to match fca.org.uk: white top bar with the FCA logo + a search-box
 * lookalike, a mulberry navigation strip, a grey breadcrumb bar on subpages, and
 * a mulberry footer with white link columns. Arial throughout, flat 1px rules.
 *
 * The user has the FCA's blessing to use the logo for this live demonstration.
 */

import MobileNavMenu from "./MobileNavMenu";

/**
 * Faint neutral rule grid behind heroes. Kept as a component (heroes render it)
 * but toned right down for the flat FCA look.
 */
export function GlowField() {
  return (
    <div className="absolute inset-0 pointer-events-none paper-grid" aria-hidden />
  );
}

/** Plain-type wordmark used in the footer. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`eyebrow ${className}`} style={{ letterSpacing: "0.08em" }}>
      FCA Vibe-Coding Sessions
    </span>
  );
}

export type ActivePage = "home" | "how-it-works" | "method" | "phoenix-watch";

type NavLink = { href: string; label: string; page: string; highlight?: boolean };

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home", page: "home" },
  { href: "/#choose", label: "What we build", page: "build" },
  { href: "/method", label: "Method", page: "method" },
  { href: "/how-it-works", label: "How it works", page: "how-it-works" },
  { href: "/phoenix-watch", label: "Phoenix Watch", page: "phoenix-watch", highlight: true },
];

export type Crumb = { label: string; href?: string };

/** White top bar: FCA logo + a (decorative) search box. */
function TopBar() {
  return (
    <div className="bg-card border-b border-rule">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-3 flex items-center justify-between gap-4">
        <a href="/" className="flex-shrink-0" aria-label="FCA — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fca/logo.png" alt="Financial Conduct Authority" className="h-9 md:h-10 w-auto" />
        </a>

        {/* Search-box lookalike (decorative on this demo site). */}
        <div
          role="search"
          className="hidden sm:flex items-stretch h-10 w-full max-w-[340px] border border-rule-strong rounded-[2px] overflow-hidden focus-within:border-accent"
        >
          <input
            type="search"
            aria-label="Search the site"
            placeholder="Search"
            className="flex-1 min-w-0 px-3 text-sm text-ink-secondary placeholder:text-ink-muted bg-card outline-none"
          />
          <button
            type="button"
            aria-label="Search"
            className="flex-shrink-0 w-11 grid place-items-center bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Mulberry navigation strip with white links; Phoenix Watch highlighted. */
function NavStrip({ activePage }: { activePage: ActivePage }) {
  return (
    <nav className="bg-accent text-white" aria-label="Primary">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 flex items-center justify-between">
        <ul className="hidden md:flex items-stretch">
          {NAV_LINKS.map((l) => {
            const isActive = l.page === activePage;
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center h-12 px-4 text-sm font-semibold border-b-[3px] transition-colors ${
                    l.highlight
                      ? "bg-white text-accent border-brand-yellow hover:bg-brand-yellow hover:text-accent"
                      : isActive
                        ? "text-white border-brand-yellow"
                        : "text-white/90 border-transparent hover:bg-accent-hover hover:text-white"
                  }`}
                >
                  {l.highlight && <span aria-hidden className="mr-1.5 text-brand-coral">★</span>}
                  {l.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Mobile: logo-side handled in TopBar; menu button lives here. */}
        <MobileNavMenu activePage={activePage} />
      </div>
    </nav>
  );
}

/** Grey breadcrumb bar for subpages. */
function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="bg-paper-raised border-b border-rule">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-2.5">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={i} className="flex items-center gap-x-2">
                  {c.href && !last ? (
                    <a href={c.href} className="fca-link">
                      {c.label}
                    </a>
                  ) : (
                    <span className={last ? "text-ink-secondary font-semibold" : ""}>{c.label}</span>
                  )}
                  {!last && <span aria-hidden className="text-ink-muted">›</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}

export function SiteNav({
  activePage,
  breadcrumb,
}: {
  activePage: ActivePage;
  breadcrumb?: Crumb[];
}) {
  return (
    <header className="sticky top-0 z-50">
      <TopBar />
      <NavStrip activePage={activePage} />
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumbs crumbs={breadcrumb} />}
    </header>
  );
}

export function SiteFooter() {
  const columns: { heading: string; links: { href: string; label: string }[] }[] = [
    {
      heading: "The session",
      links: [
        { href: "/", label: "Home" },
        { href: "/#choose", label: "What we build" },
        { href: "/phoenix-watch", label: "Phoenix Watch" },
      ],
    },
    {
      heading: "How it's made",
      links: [
        { href: "/how-it-works", label: "How it works" },
        { href: "/method", label: "The method" },
      ],
    },
    {
      heading: "Principles",
      links: [
        { href: "/#choose", label: "Public data only" },
        { href: "/method", label: "Auditable & defensible" },
      ],
    },
  ];

  return (
    <footer className="bg-accent text-white">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Wordmark className="text-white mb-4 inline-block" />
            <p className="text-white/85 text-sm leading-relaxed">
              A live demonstration for the Financial Conduct Authority. Every tool
              shown is built from{" "}
              <strong className="text-white font-semibold">100% public data</strong> —
              company records, regulator publications and more — nothing touches
              anyone&apos;s internal systems.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="eyebrow text-white/70 mb-4">{col.heading}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-white/90 hover:text-white hover:underline underline-offset-2"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/25 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-white/70 text-xs leading-relaxed max-w-2xl">
            A live vibe-coding demonstration built with the FCA — not the official
            fca.org.uk. Public data · verified 21 July 2026.
          </p>
          <p className="text-white/70 text-xs tnum whitespace-nowrap">
            Register API · Warning List · Companies House
          </p>
        </div>
      </div>
    </footer>
  );
}
