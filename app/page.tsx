import { GlowField, SiteNav, SiteFooter } from "@/src/components/ui";

/**
 * Build options for the live session. Sourced from the plans in /plans.
 * Adding a new option = append one object here. The card styling is uniform and
 * editorial — no per-card accent colours.
 */
type Demo = {
  number: number;
  title: string;
  hook: string;
  description: string;
  stats: { value: string; label: string }[];
  feature?: string;
  /**
   * Set on cards that join FCA data with an external public source. Presence of
   * this field floats the card into the "Cross-data" group at the top of the
   * #choose section — a new 11-/12- plan just needs this field to appear there.
   */
  crossData?: { sources: string[] };
};

const demos: Demo[] = [
  {
    number: 1,
    title: "Register Explorer",
    hook: "Is this firm actually authorised — and for exactly what?",
    description:
      "A search-first app over the FCA's own Financial Services Register: type any firm name and see its authorisation status, permissions, approved people and disciplinary history — then ask a plain-English chatbot “can this firm give investment advice?” and get an answer grounded in live Register data. The public register, made conversational, in front of the people who run it.",
    stats: [
      { value: "Live", label: "register API" },
      { value: "8+", label: "data endpoints" },
      { value: "Plain-English", label: "chatbot" },
    ],
  },
  {
    number: 2,
    title: "Scam Radar",
    hook: "Is this firm a scam — and which scam types are surging now?",
    description:
      "A live threat feed that streams the FCA's newest unauthorised-firm and clone warnings as they publish, with a one-keystroke “is this firm on the Warning List?” search and trend charts showing which scam types are spiking. It turns a buried government table into a dashboard that feels like a real-time radar.",
    stats: [
      { value: "18,000+", label: "warning records" },
      { value: "20", label: "live RSS warnings" },
      { value: "Daily", label: "new scams added" },
    ],
  },
  {
    number: 3,
    title: "Enforcement Insights",
    hook: "Where does FCA enforcement actually land, year on year?",
    description:
      "An interactive dashboard of every FCA fine from 2013 to 2025 — total penalties by year, biggest notices, sector and breach-type breakdowns, and a searchable ledger where each row deep-links to its Final Notice. Thirteen scattered tables on the FCA's own site, turned into one living picture of enforcement.",
    stats: [
      { value: "13 yrs", label: "of fines (2013–2025)" },
      { value: "£474m", label: "peak year (2013)" },
      { value: "400+", label: "penalty notices" },
    ],
  },
  {
    number: 4,
    title: "Complaints Explorer",
    hook: "Who complains about whom — and who loses the argument?",
    description:
      "A “who complains about whom” explorer: type any firm and see its complaint volumes, uphold rates and closure speed across five product groups, then flip to live league tables ranking the best and worst firms. Pairs FCA firm-level data with Financial Ombudsman outcomes to show both sides of every complaint.",
    stats: [
      { value: "600+", label: "named firms" },
      { value: "5", label: "product groups" },
      { value: "Uphold %", label: "league tables" },
    ],
  },
  {
    number: 5,
    title: "Ask the Handbook",
    hook: "What does the Handbook actually say — chapter and verse?",
    description:
      "A citation-first assistant over the FCA Handbook: ask a plain-English question like “does Consumer Duty apply to a prospective customer?” and get an answer that quotes the exact rule and links its provision code (e.g. PRIN 2A.1.5). It turns the dense, JS-heavy Handbook into a conversational, grounded reference that never invents a citation.",
    stats: [
      { value: "PRIN 2A", label: "Consumer Duty scope" },
      { value: "Cited", label: "rule + provision code" },
      { value: "Grounded", label: "no hallucinated links" },
    ],
  },
  {
    number: 6,
    title: "Regulatory Pulse",
    hook: "What is the FCA worried about this quarter?",
    description:
      "An AI insight feed that reads every public FCA communication — press releases, speeches, statements, Dear CEO letters, consultations — and turns them into plain-English summaries, a rolling theme timeline, and a heatmap of which priorities are heating up. See the regulator's focus in one glance, without reading 200 PDFs.",
    stats: [
      { value: "Every", label: "public FCA comms" },
      { value: "9", label: "priority themes" },
      { value: "AI", label: "summaries" },
    ],
  },
  {
    number: 7,
    title: "Phoenix Watch",
    hook: "When a fined firm dies, where do its directors resurface?",
    description:
      "Cross-references FCA fined and Warning-List firms against Companies House officer records to expose the “phoenix” pattern: directors whose old firm was shut down while they already control freshly incorporated ones. Type a fined firm and watch its directors light up a network graph of their other active companies.",
    stats: [
      { value: "2", label: "public datasets joined" },
      { value: "Free", label: "Companies House API" },
      { value: "Network", label: "director graph" },
    ],
    feature: "Most novel",
    crossData: { sources: ["Companies House officer records"] },
  },
  {
    number: 8,
    title: "Scam & Sanctions Heatmap",
    hook: "Where does financial harm physically cluster on the map?",
    description:
      "A single UK map fusing four disconnected public datasets: FCA fined firms geolocated by registered office, cross-checked against the OFSI sanctions list, layered over ONS regional deprivation. Enforcement hotspots light up, with a red pin wherever a firm's officer name matches a sanctioned individual — automated screening, on stage.",
    stats: [
      { value: "4", label: "datasets fused" },
      { value: "OFSI", label: "sanctions screening" },
      { value: "£0", label: "in paid APIs" },
    ],
    crossData: { sources: ["OFSI sanctions list", "ONS deprivation"] },
  },
  {
    number: 9,
    title: "Financial Harm Map",
    hook: "Is consumer harm evenly spread — or does it hunt vulnerability?",
    description:
      "An interactive UK map where every FCA-flagged scam firm and enforcement fine is geocoded and stacked against ONS deprivation — so you watch harm cluster in the poorest postcodes. Click any region and an AI writes a plain-English consumer-risk briefing for that area on the spot.",
    stats: [
      { value: "Geocoded", label: "harm choropleth" },
      { value: "IMD", label: "deprivation overlay" },
      { value: "AI", label: "per-region briefing" },
    ],
    feature: "Most visual",
    crossData: { sources: ["ONS deprivation (IMD)"] },
  },
  {
    number: 10,
    title: "Rate Shock & Distress Timeline",
    hook: "What did the rate hikes actually do to consumers?",
    description:
      "Scrub a single timeline from 2020 to today and watch the Bank of England base rate climb while FCA complaint volumes and scam warnings surge behind it — then an AI narrates the story quarter by quarter, connecting the macro shock to the human harm. One elegant chart of a national story everyone in the room lived through.",
    stats: [
      { value: "2020→now", label: "animated timeline" },
      { value: "BoE + FCA", label: "data joined" },
      { value: "AI", label: "scrub-synced narration" },
    ],
    crossData: { sources: ["Bank of England base rate"] },
  },
  {
    number: 11,
    title: "Born Yesterday",
    hook: "How old is a scam website when the regulator blocklists it?",
    description:
      "Joins the FCA Warning List's scam-site names with live domain-registration records from RDAP (the WHOIS successor) to reveal a signal the FCA's own data can't: the gap between a domain's registration date and the day the FCA warned about it. Four in ten warned scam domains were registered within the last six months — the freshest just six days old — while a long tail of aged, respectable-looking domains points to legitimate names repurposed for fraud.",
    stats: [
      { value: "216 days", label: "median reg-to-warning" },
      { value: "41%", label: "under 6 months old" },
      { value: "6 days", label: "freshest scam domain" },
    ],
    crossData: { sources: ["RDAP domain registry"] },
  },
  {
    number: 12,
    title: "Fined, Then Folded",
    hook: "Of the firms and people the FCA fined, who later went insolvent?",
    description:
      "Joins FCA enforcement notices with The Gazette — the UK's statutory record of insolvency — to surface the sanctioned firms and individuals that later formally collapsed, the trail where redress money evaporates. A confidence-scored, pre-curated watchlist: one FCA-sanctioned individual maps to seven insolvency notices under his exact name, each row linking back to both public sources so every claim is checkable.",
    stats: [
      { value: "300", label: "FCA fines cross-checked" },
      { value: "7", label: "notices, one sanctioned name" },
      { value: "Gazette", label: "statutory insolvency record" },
    ],
    crossData: { sources: ["The Gazette insolvency notices"] },
  },
];

const twoDigit = (n: number) => n.toString().padStart(2, "0");

function DemoCard({ demo }: { demo: Demo }) {
  return (
    <article className="group flex flex-col bg-card border border-rule rounded-[2px] p-7 transition-[border-color,transform] duration-150 hover:border-accent hover:-translate-y-px">
      {demo.crossData && (
        <div className="mb-5 -mt-1 border-l-2 border-highlight bg-highlight-tint rounded-r-[2px] pl-3 pr-4 py-2.5">
          <p className="eyebrow text-highlight mb-1">
            Cross-data &mdash; joins external sources for novel insight
          </p>
          <p className="text-ink-secondary text-xs leading-snug">
            FCA data joined with{" "}
            <strong className="text-ink font-semibold">
              {demo.crossData.sources.join(" · ")}
            </strong>
            .
          </p>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-4 mb-4">
        <span className="font-display text-2xl text-ink-muted tnum leading-none">
          {twoDigit(demo.number)}
        </span>
        {demo.feature && (
          <span className="eyebrow text-highlight border-l-2 border-highlight pl-2">
            Editor&apos;s note &mdash; {demo.feature}
          </span>
        )}
      </div>

      <h3 className="font-display text-[26px] font-medium text-ink leading-tight mb-3">
        {demo.title}
      </h3>
      <p className="text-ink font-medium text-[15px] leading-snug mb-3">
        {demo.hook}
      </p>
      <p className="text-ink-secondary text-sm leading-relaxed">
        {demo.description}
      </p>

      <div className="mt-6 pt-5 border-t border-rule flex flex-wrap gap-x-8 gap-y-4">
        {demo.stats.map((stat, i) => (
          <div key={i}>
            <div className="text-ink font-semibold text-lg tnum leading-none">
              {stat.value}
            </div>
            <div className="eyebrow text-ink-muted mt-1.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <p className="eyebrow text-success border-l border-success pl-2 mt-5">
        Public data &middot; verified 21 Jul
      </p>
    </article>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <SiteNav activePage="home" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-rule">
        <GlowField />
        <div className="relative max-w-[1240px] mx-auto px-5 md:px-8 py-24 md:py-32">
          <p className="eyebrow text-ink-muted mb-8 animate-fade-in">
            Live session &mdash; demo day at the FCA
          </p>

          <h1 className="font-display text-[clamp(48px,6vw,80px)] font-medium text-ink leading-[0.98] mb-8 max-w-[13ch] animate-fade-in delay-1">
            What if you could build{" "}
            <span className="italic text-accent">a working regulatory tool</span>{" "}
            in hours?
          </h1>

          <p className="text-lg md:text-xl text-ink-secondary leading-relaxed mb-10 max-w-[62ch] animate-fade-in delay-2">
            <strong className="text-ink font-semibold">Vibe coding</strong> is a new way
            to build software: describe what you need in plain English and an AI builds it
            &mdash; live, on screen. No procurement. No vendor lock-in. Today, everything is
            built from{" "}
            <strong className="text-ink font-semibold">100% public FCA data</strong> &mdash;
            nothing touches internal systems.
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-in delay-3">
            <a
              href="#choose"
              className="eyebrow bg-accent hover:bg-accent-hover text-paper-raised px-6 py-3.5 rounded-[2px] transition-colors"
            >
              See what we can build today
            </a>
            <a
              href="/how-it-works"
              className="eyebrow text-ink border border-rule-strong hover:border-accent hover:text-accent px-6 py-3.5 rounded-[2px] transition-colors"
            >
              How does this work?
            </a>
          </div>
        </div>
      </section>

      {/* ── What is vibe coding ── */}
      <section className="bg-paper py-24 md:py-28">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <p className="eyebrow text-ink-muted mb-4">The idea</p>
              <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight mb-6">
                What is vibe coding?
              </h2>
              <p className="text-ink-secondary leading-relaxed mb-4">
                Vibe coding is building software by{" "}
                <strong className="text-ink font-semibold">describing what you want in
                natural language</strong>{" "}
                and letting AI write the code. You don&apos;t need to be a programmer. You
                need to understand the problem you&apos;re trying to solve.
              </p>
              <p className="text-ink-secondary leading-relaxed mb-4">
                Combined with <strong className="text-ink font-semibold">BMAD</strong> (an
                AI-native agile method), we go from a blank page to a deployed, working
                prototype in hours &mdash; not months.
              </p>
              <p className="text-ink-secondary leading-relaxed">
                Today we demonstrate this live. You choose an idea, and we start building it
                &mdash; right here, with you watching.
              </p>
            </div>

            <div className="divide-y divide-rule border-y border-rule">
              {[
                { num: "1", title: "You describe the problem", desc: "In plain English. No specifications, no technical jargon." },
                { num: "2", title: "AI agents research and design", desc: "Specialist AI agents gather public data, analyse requirements, and design the solution." },
                { num: "3", title: "Working software appears in minutes", desc: "Real, deployable code — not a mockup. Built live, on the web." },
                { num: "4", title: "Iterate in real time", desc: "Don't like something? Say so. The AI adjusts immediately." },
              ].map((step) => (
                <div key={step.num} className="flex gap-6 py-6">
                  <span className="font-display text-2xl text-accent tnum leading-none flex-shrink-0 w-8">
                    {twoDigit(Number(step.num))}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink text-base">{step.title}</h3>
                    <p className="text-ink-secondary text-sm mt-1.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How today works ── */}
      <section className="bg-paper-raised py-24 md:py-28 border-y border-rule">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-16">
            <p className="eyebrow text-ink-muted mb-4">How today works</p>
            <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight mb-5">
              A hands-on demonstration, not a sales pitch.
            </h2>
            <p className="text-ink-secondary text-lg leading-relaxed">
              We&apos;ve already gathered real public FCA data &mdash; the register, warning
              lists, enforcement notices, complaints returns and the news feed &mdash; and
              verified every source this morning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Choose an idea", desc: "Pick one of the pre-researched options below — or suggest your own. The data is ready to go." },
              { step: "2", title: "Watch us build", desc: "We build a working prototype live, talking through every decision as we go." },
              { step: "3", title: "Shape the result", desc: "Give feedback as we build. Different chart? Different cut of the data? Just say the word." },
            ].map((s) => (
              <div key={s.step} className="bg-card border border-rule rounded-[2px] p-7">
                <span className="font-display text-3xl text-accent tnum leading-none block mb-5">
                  {twoDigit(Number(s.step))}
                </span>
                <h3 className="text-ink font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-ink-secondary text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Choose your demo ── */}
      <section id="choose" className="bg-paper py-24 md:py-28">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-16">
            <p className="eyebrow text-ink-muted mb-4">The options</p>
            <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight mb-5">
              What shall we build?
            </h2>
            <p className="text-ink-secondary text-lg leading-relaxed">
              Every option is backed by real, publicly available data we&apos;ve already
              gathered and verified &mdash; and the strongest ideas go{" "}
              <strong className="text-ink font-semibold">beyond the FCA&apos;s own tables</strong>,
              joining them with other public sources like Companies House, OFSI, ONS, the Bank
              of England, RDAP and The Gazette. That cross-referencing is where the novel
              insight comes from. Each is buildable live in about two hours &mdash; pick the one
              most useful to your team, or suggest something different.
            </p>
          </div>

          {/* Cross-data ideas lead */}
          <div className="mb-8 pb-3 border-b border-rule-strong flex items-baseline justify-between gap-4 flex-wrap">
            <h3 className="font-display text-2xl font-medium text-ink">Cross-data ideas</h3>
            <p className="eyebrow text-highlight">FCA data joined with external public sources</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            {demos
              .filter((d) => d.crossData)
              .map((demo) => (
                <DemoCard key={demo.number} demo={demo} />
              ))}
          </div>

          {/* Single-source FCA tools */}
          <div className="mb-8 pb-3 border-b border-rule-strong flex items-baseline justify-between gap-4 flex-wrap">
            <h3 className="font-display text-2xl font-medium text-ink">Single-source FCA tools</h3>
            <p className="eyebrow text-ink-muted">Built on one FCA public dataset</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {demos
              .filter((d) => !d.crossData)
              .map((demo) => (
                <DemoCard key={demo.number} demo={demo} />
              ))}

            {/* Bring your own idea */}
            <article className="md:col-span-2 bg-paper-raised border border-dashed border-rule-strong rounded-[2px] p-10 text-center">
              <p className="eyebrow text-ink-muted mb-4">Or</p>
              <h3 className="font-display text-[26px] font-medium text-ink mb-3">
                Got a different idea?
              </h3>
              <p className="text-ink-secondary text-sm max-w-xl mx-auto leading-relaxed">
                These are starting points. If there&apos;s a supervision question you
                can&apos;t answer quickly, a public dataset you want to make sense of, or a
                manual task worth automating &mdash; tell us and we&apos;ll build it live.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Data principles ── */}
      <section className="bg-paper-raised py-20 border-y border-rule">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8">
          <p className="eyebrow text-ink-muted mb-10">Principles</p>
          <div className="grid md:grid-cols-4 gap-x-8 gap-y-10">
            {[
              { title: "Public data only", desc: "Every dataset is publicly available. No internal FCA systems accessed, ever." },
              { title: "Respectful collection", desc: "All data gathered respecting robots.txt, rate limits, and published API terms." },
              { title: "Insight, not surveillance", desc: "Tools built for supervision and consumer protection — not monitoring individuals." },
              { title: "Yours to keep", desc: "Everything we build is standard open-source code. The code, data and deployment are yours." },
            ].map((p, i) => (
              <div key={p.title} className="border-t border-rule-strong pt-5">
                <span className="font-display text-2xl text-accent tnum leading-none block mb-4">
                  {twoDigit(i + 1)}
                </span>
                <h3 className="font-semibold text-ink text-sm mb-2">{p.title}</h3>
                <p className="text-ink-secondary text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-paper py-24 md:py-28">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight mb-5">
            Want to understand the technology behind this?
          </h2>
          <p className="text-ink-secondary text-lg mb-9 max-w-2xl mx-auto leading-relaxed">
            See the BMAD method, the specialist AI agents, and how a non-technical team can
            build production-grade tools over public data &mdash; in hours, not months.
          </p>
          <a
            href="/how-it-works"
            className="eyebrow inline-block bg-accent hover:bg-accent-hover text-paper-raised px-6 py-3.5 rounded-[2px] transition-colors"
          >
            How It Works
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
