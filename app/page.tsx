import { GlowField, SiteNav, SiteFooter } from "@/src/components/ui";

/**
 * Build options for the live session. Sourced from the plans in /plans.
 * Adding a new option = append one object here (accents cycle automatically).
 * `accent` holds full literal Tailwind classes so the v4 JIT always emits them.
 */
type Accent = {
  bar: string;
  chip: string;
  hook: string;
  stat: string;
  hoverBorder: string;
};

const TEAL: Accent = {
  bar: "bg-teal",
  chip: "bg-teal text-ink",
  hook: "text-teal",
  stat: "text-teal",
  hoverBorder: "hover:border-teal/60",
};
const BLUE: Accent = {
  bar: "bg-blue",
  chip: "bg-blue text-ink",
  hook: "text-blue-bright",
  stat: "text-blue-bright",
  hoverBorder: "hover:border-blue/60",
};
const VIOLET: Accent = {
  bar: "bg-violet",
  chip: "bg-violet text-white",
  hook: "text-violet",
  stat: "text-violet",
  hoverBorder: "hover:border-violet/60",
};
const ACCENTS = [TEAL, BLUE, VIOLET];

type Demo = {
  number: number;
  title: string;
  hook: string;
  description: string;
  stats: { value: string; label: string }[];
  feature?: string;
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
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ink">
      <SiteNav activePage="home" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[88vh] flex items-center border-b border-line">
        <GlowField intensity="medium" />

        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <p className="inline-flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-[0.2em] mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-teal" style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
            Live session &mdash; demo day at the FCA
          </p>

          <h1 className="text-5xl md:text-7xl font-black text-text leading-[1.05] mb-6 animate-fade-in delay-1">
            What if you could build
            <br />
            <span className="text-gradient">a working regulatory tool</span>
            <br />
            in hours?
          </h1>

          <p className="text-lg md:text-xl text-text-soft leading-relaxed mb-10 max-w-2xl animate-fade-in delay-3">
            <strong className="text-text">Vibe coding</strong> is a new way to build software:
            describe what you need in plain English and an AI builds it &mdash; live, on screen.
            No procurement. No vendor lock-in. Today, everything is built from{" "}
            <strong className="text-text">100% public FCA data</strong> &mdash; nothing touches
            internal systems.
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-in delay-4">
            <a
              href="#choose"
              className="bg-teal hover:bg-teal-bright text-ink font-bold px-8 py-4 rounded-full transition-all hover:scale-[1.03]"
            >
              See what we can build today
            </a>
            <a
              href="/how-it-works"
              className="bg-white/5 hover:bg-white/10 text-text font-semibold px-8 py-4 rounded-full border border-line-2 transition-all"
            >
              How does this work?
            </a>
          </div>
        </div>
      </section>

      {/* ── What is vibe coding ── */}
      <section className="bg-ink py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black text-text mb-6">What is vibe coding?</h2>
              <p className="text-text-soft leading-relaxed mb-4">
                Vibe coding is building software by{" "}
                <strong className="text-text">describing what you want in natural language</strong>{" "}
                and letting AI write the code. You don&apos;t need to be a programmer. You need to
                understand the problem you&apos;re trying to solve.
              </p>
              <p className="text-text-soft leading-relaxed mb-4">
                Combined with <strong className="text-text">BMAD</strong> (an AI-native agile
                method), we go from a blank page to a deployed, working prototype in hours &mdash;
                not months.
              </p>
              <p className="text-text-soft leading-relaxed">
                Today we demonstrate this live. You choose an idea, and we start building it &mdash;
                right here, with you watching.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { num: "1", title: "You describe the problem", desc: "In plain English. No specifications, no technical jargon.", dot: "bg-teal" },
                { num: "2", title: "AI agents research and design", desc: "Specialist AI agents gather public data, analyse requirements, and design the solution.", dot: "bg-blue" },
                { num: "3", title: "Working software appears in minutes", desc: "Real, deployable code — not a mockup. Built live, on the web.", dot: "bg-violet" },
                { num: "4", title: "Iterate in real time", desc: "Don't like something? Say so. The AI adjusts immediately.", dot: "bg-teal" },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex gap-4 p-5 rounded-xl bg-panel border border-line hover:border-line-2 transition-colors"
                >
                  <div className={`${step.dot} text-ink w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0`}>
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-text text-sm">{step.title}</h3>
                    <p className="text-muted text-sm mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How today works ── */}
      <section className="bg-ink-2 py-20 border-y border-line">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-black text-text mb-4">How today works</h2>
            <p className="text-text-soft">
              This is a hands-on demonstration, not a sales pitch. We&apos;ve already gathered
              real public FCA data &mdash; the register, warning lists, enforcement notices,
              complaints returns and the news feed &mdash; and verified every source this morning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Choose an idea", desc: "Pick one of the pre-researched options below — or suggest your own. The data is ready to go.", dot: "bg-teal" },
              { step: "2", title: "Watch us build", desc: "We build a working prototype live, talking through every decision as we go.", dot: "bg-blue" },
              { step: "3", title: "Shape the result", desc: "Give feedback as we build. Different chart? Different cut of the data? Just say the word.", dot: "bg-violet" },
            ].map((s) => (
              <div key={s.step} className="bg-panel rounded-xl p-8 border border-line">
                <div className={`${s.dot} text-ink w-12 h-12 rounded-lg flex items-center justify-center text-xl font-black mb-4`}>
                  {s.step}
                </div>
                <h3 className="text-text font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Choose your demo ── */}
      <section id="choose" className="bg-ink py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-teal text-xs font-bold uppercase tracking-[0.2em] mb-3">#choose</p>
            <h2 className="text-3xl md:text-4xl font-black text-text mb-4">What shall we build?</h2>
            <p className="text-text-soft">
              Each option is backed by real, publicly available FCA data we&apos;ve already
              gathered and verified. Every one is buildable live in about two hours. Pick the one
              most useful to your team &mdash; or suggest something different.
            </p>
          </div>

          <div className="grid gap-5">
            {demos.map((demo) => {
              const accent = ACCENTS[(demo.number - 1) % ACCENTS.length];
              return (
                <div
                  key={demo.number}
                  className={`group bg-panel rounded-xl border overflow-hidden transition-all hover:shadow-xl hover:shadow-black/30 ${
                    demo.feature ? "border-teal/40 shadow-lg shadow-teal/5" : "border-line"
                  } ${accent.hoverBorder}`}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className={`md:w-1.5 w-full h-1 md:h-auto flex-shrink-0 ${accent.bar}`} />

                    <div className="flex-1 p-6 md:p-8">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${accent.chip}`}>
                              {demo.number}
                            </span>
                            <h3 className="text-lg font-black text-text">{demo.title}</h3>
                            {demo.feature && (
                              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-teal to-blue text-ink text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                                ★ {demo.feature}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 bg-green/10 text-green text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-green/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-green" style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
                              Public data · verified 21 Jul
                            </span>
                          </div>
                          <p className={`font-semibold text-sm mb-2 ${accent.hook}`}>{demo.hook}</p>
                          <p className="text-muted text-sm leading-relaxed max-w-2xl">{demo.description}</p>
                        </div>

                        <div className="hidden md:flex gap-6 flex-shrink-0">
                          {demo.stats.map((stat, i) => (
                            <div key={i} className="text-center">
                              <div className={`text-2xl font-black whitespace-nowrap ${accent.stat}`}>{stat.value}</div>
                              <div className="text-[11px] text-muted-dark uppercase tracking-wider mt-1 max-w-[110px]">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 md:hidden">
                        {demo.stats.map((stat, i) => (
                          <div key={i}>
                            <span className={`font-black ${accent.stat}`}>{stat.value}</span>
                            <span className="text-muted-dark text-xs ml-1.5">{stat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bring your own idea */}
            <div className="group bg-ink-2 rounded-xl border-2 border-dashed border-line-2 overflow-hidden hover:border-teal/50 transition-all">
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-lg bg-teal/10 flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-teal">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-text mb-2">Got a different idea?</h3>
                <p className="text-muted text-sm max-w-lg mx-auto">
                  These are starting points. If there&apos;s a supervision question you can&apos;t
                  answer quickly, a public dataset you want to make sense of, or a manual task worth
                  automating &mdash; tell us and we&apos;ll build it live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Data principles ── */}
      <section className="bg-ink-2 py-16 border-y border-line">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "Public data only", desc: "Every dataset is publicly available. No internal FCA systems accessed, ever." },
              { title: "Respectful collection", desc: "All data gathered respecting robots.txt, rate limits, and published API terms." },
              { title: "Insight, not surveillance", desc: "Tools built for supervision and consumer protection — not monitoring individuals." },
              { title: "Yours to keep", desc: "Everything we build is standard open-source code. The code, data and deployment are yours." },
            ].map((p, i) => (
              <div key={p.title} className="p-6 rounded-xl bg-panel border border-line">
                <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center font-black text-ink ${["bg-teal", "bg-blue", "bg-violet", "bg-green"][i]}`}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-text text-sm mb-2">{p.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-ink py-20">
        <GlowField intensity="soft" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <h2 className="text-2xl md:text-3xl font-black text-text mb-4">
            Want to understand the technology behind this?
          </h2>
          <p className="text-text-soft mb-8 max-w-2xl mx-auto">
            See the BMAD method, the specialist AI agents, and how a non-technical team can build
            production-grade tools over public data &mdash; in hours, not months.
          </p>
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-2 bg-teal hover:bg-teal-bright text-ink font-bold px-8 py-4 rounded-full transition-all hover:scale-[1.03]"
          >
            How It Works
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
