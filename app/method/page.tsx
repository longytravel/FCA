import type { Metadata } from "next";
import { SiteNav, SiteFooter, GlowField } from "@/src/components/ui";

export const metadata: Metadata = {
  title: "The method behind the work | Vibe Coding at the FCA",
  description:
    "How this pipeline turns public FCA data into auditable, defensible tools — with every claim traceable to a source.",
};

export default function MethodPage() {
  return (
    <main className="min-h-screen bg-ink">
      <SiteNav activePage="method" />

      {/* ── Hero ── */}
      <section className="relative py-16 md:py-24 border-b border-line overflow-hidden">
        <GlowField intensity="medium" />
        <div className="relative max-w-3xl mx-auto px-6">
          <p className="text-teal text-xs font-bold uppercase tracking-[0.18em] mb-4">
            How this work is produced
          </p>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6 text-text">
            The method behind the work
          </h1>
          <p className="text-text-soft text-lg leading-relaxed">
            This isn&rsquo;t a static demo. It&rsquo;s a repeatable pipeline that turns public FCA
            data into auditable, defensible tools &mdash; with every number traceable back to a
            source. The sections below set out how the work is built, how it&rsquo;s reviewed, and
            what that means for a regulator thinking about building this way in-house.
          </p>
        </div>
      </section>

      {/* ── Body ── */}
      <article className="max-w-3xl mx-auto px-6 py-16 md:py-20 text-text-soft">
        {/* 01 */}
        <section className="mb-16 md:mb-20">
          <p className="text-teal text-xs font-bold uppercase tracking-[0.18em] mb-3">01 &middot; Tight-loop development</p>
          <h2 className="text-3xl font-black mb-5 text-text">Specified, planned, built, reviewed &mdash; in days, not weeks.</h2>
          <p className="mb-4 leading-relaxed">
            The whole pipeline runs in tight loops: brainstorm, write the spec, draft the plan,
            implement, verify. A powerful generative tool produces the first draft of code, copy,
            queries and tests. A human supervises every step, redirects, and rejects anything that
            isn&rsquo;t right.
          </p>
          <p className="mb-4 leading-relaxed">
            The point isn&rsquo;t speed for its own sake &mdash; it&rsquo;s that the supervisor holds
            the whole picture in their head while the drafting moves quickly underneath them. That
            keeps the rigour bar high while compressing weeks of build into days.
          </p>
          <p className="leading-relaxed">
            Each of the demo options on the session page &mdash; a live register explorer, a scam
            radar, an enforcement dashboard &mdash; is scoped to be specified, planned, built and
            reviewed inside a single two-hour session.
          </p>
        </section>

        {/* 02 */}
        <section className="mb-16 md:mb-20">
          <p className="text-teal text-xs font-bold uppercase tracking-[0.18em] mb-3">02 &middot; Structured agentic review</p>
          <h2 className="text-3xl font-black mb-5 text-text">A team of specialist reviewers, each doing one job.</h2>
          <p className="mb-4 leading-relaxed">
            Behind the scenes there isn&rsquo;t one generalist doing everything. There is a
            structured workflow of specialist reviewers &mdash; an analyst who interrogates
            requirements, an architect who weighs design choices, a developer who implements, a
            tester who validates. Each has a narrow remit and a written brief, and each sees a clean
            slice of the work.
          </p>
          <p className="mb-4 leading-relaxed">
            One reviewer is a <strong className="text-text">data-accuracy auditor</strong>. It
            inspects every number in every commit and asks one question: does this claim trace back
            to a source? Hand-typed statistics, rounded-from-memory figures and unsourced numbers are
            auto-failed and sent back for repair before they reach the supervisor.
          </p>
          <p className="leading-relaxed">
            Another is an <strong className="text-text">insight &amp; clarity scorer</strong>. It
            rates each view on quotability, novelty, clarity of action, visual simplicity, and the
            strength of the trace from claim to source. Anything below threshold is sent back for
            polish &mdash; not shipped hoping nobody looks closely.
          </p>
        </section>

        {/* 03 */}
        <section className="mb-16 md:mb-20">
          <p className="text-teal text-xs font-bold uppercase tracking-[0.18em] mb-3">03 &middot; Independent defensibility consult</p>
          <h2 className="text-3xl font-black mb-5 text-text">Every analytic technique gets a second opinion before it ships.</h2>
          <p className="mb-4 leading-relaxed">
            For each analytic technique under consideration &mdash; ranked comparisons, trend
            momentum, anomaly detection, category tagging of free text &mdash; a sealed brief is sent
            to a separate, stronger reviewer model on its highest reasoning setting. The brief asks
            one question: is this technique <em>defensible</em> on this dataset, with these caveats?
            Return SHIP or VETO with a reason.
          </p>
          <p className="mb-4 leading-relaxed">
            Techniques that would look impressive on a slide but can&rsquo;t survive scrutiny are
            vetoed and left out of the product. What ships is only what the reviewer cleared, with the
            exact caveat wording it demanded &mdash; which matters especially when the data is a
            regulator&rsquo;s own.
          </p>
          <p className="leading-relaxed">
            Every brief, every verdict and every reason is logged and readable end-to-end. Nothing in
            the tool is a black box you have to take on trust.
          </p>
        </section>

        {/* 04 */}
        <section className="mb-16 md:mb-20">
          <p className="text-teal text-xs font-bold uppercase tracking-[0.18em] mb-3">04 &middot; Four-gate review pipeline</p>
          <h2 className="text-3xl font-black mb-5 text-text">Nothing ships without passing four independent gates.</h2>
          <p className="mb-6 leading-relaxed">
            Every deliverable &mdash; a panel, a chart, a number in a sentence &mdash; passes the same
            four gates in order. A beautiful chart of indefensible statistics fails. So does a
            defensible chart nobody can read.
          </p>

          <div className="my-8" role="img" aria-label="Four-gate review pipeline: data accuracy, then defensibility, then benchmark verifier, then insight and clarity">
            <svg viewBox="0 0 720 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#2dd4bf" />
                </marker>
              </defs>
              {[
                { x: 0, l1: "Data", l2: "accuracy" },
                { x: 190, l1: "Defensibility", l2: "consult" },
                { x: 380, l1: "Benchmark", l2: "verifier" },
                { x: 570, l1: "Insight", l2: "& clarity" },
              ].map((b, i) => (
                <g key={i}>
                  <rect x={b.x} y="30" width="150" height="60" rx="10" fill="#0f1a2e" stroke="#2a3b5c" />
                  <text x={b.x + 75} y="58" textAnchor="middle" fill="#e6edf7" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">{b.l1}</text>
                  <text x={b.x + 75} y="76" textAnchor="middle" fill="#e6edf7" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">{b.l2}</text>
                  {i < 3 && <line x1={b.x + 155} y1="60" x2={b.x + 185} y2="60" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#arrow)" />}
                </g>
              ))}
            </svg>
          </div>

          <p className="mb-4 leading-relaxed">
            <strong className="text-text">Order matters.</strong> Defensibility outranks wow-factor.
            A chart that&rsquo;s indefensible never reaches the clarity scorer &mdash; it&rsquo;s
            killed at gate two. The benchmark verifier sits between them to confirm that any
            cross-firm or cross-year comparison uses a like-for-like baseline.
          </p>
          <p className="leading-relaxed">
            The supervisor sees the gate results for every deliverable. A failure at any gate sends
            the work back to the relevant specialist for repair, not forward to the next stage.
          </p>
        </section>

        {/* 05 */}
        <section className="mb-16 md:mb-20">
          <p className="text-teal text-xs font-bold uppercase tracking-[0.18em] mb-3">05 &middot; Heavy precomputation, lightweight runtime</p>
          <h2 className="text-3xl font-black mb-5 text-text">Frozen data, instant interaction.</h2>
          <p className="mb-4 leading-relaxed">
            Where a tool works from a fixed dataset &mdash; the enforcement fines tables, the
            complaints workbooks, a snapshot of the warning list &mdash; the slicing, scoring,
            tagging and reconciliation happens once, up front, when the data lands. What ships to the
            browser is the result, not the raw data or a live query layer.
          </p>
          <p className="mb-4 leading-relaxed">
            Where a tool is genuinely live &mdash; the register API, the news feed &mdash; calls run
            server-side, cached and rate-limited, with committed fallback snapshots so a demo never
            depends on a third party being up.
          </p>
          <p className="leading-relaxed">
            The user-visible effect is that everything feels instant. The practical effect is that
            running cost is near zero and there is little for an IT team to maintain.
          </p>
        </section>

        {/* 06 */}
        <section className="mb-4">
          <p className="text-teal text-xs font-bold uppercase tracking-[0.18em] mb-3">06 &middot; What this means for the FCA</p>
          <h2 className="text-3xl font-black mb-5 text-text">The same pipeline can run against any public dataset.</h2>
          <p className="mb-4 leading-relaxed">
            The workflow isn&rsquo;t bespoke to any one demo. The same tight-loop development, the
            same specialist reviewers, the same defensibility consult and the same four-gate pipeline
            can run against any public source the FCA already publishes &mdash; register data,
            warning lists, enforcement notices, complaints returns, the news feed.
          </p>
          <p className="mb-4 leading-relaxed">
            What you get at the end is a deployed, working tool, with the source provenance for every
            number baked in and a readable log of every review decision that shaped the build. All of
            it standard open-source code you own outright.
          </p>
          <p className="leading-relaxed">
            Everything shown today is built from{" "}
            <strong className="text-text">100% public data</strong> and never touches internal FCA
            systems. If you want to inspect the auditable trail behind any number before going
            further, the entire codebase is open to inspection.
          </p>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
