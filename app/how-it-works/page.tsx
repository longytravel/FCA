import { GlowField, SiteNav, SiteFooter } from "@/src/components/ui";

const agents = [
  { name: "Mary", role: "Business Analyst", desc: "Researches the domain, analyses the public data, and translates a vague idea into precise requirements.", skills: "Domain research, data analysis, requirements elicitation" },
  { name: "John", role: "Product Manager", desc: "Writes the product requirements — the blueprint for what gets built. Ensures every feature has a clear purpose.", skills: "PRDs, user stories, feature prioritisation" },
  { name: "Sally", role: "UX Designer", desc: "Designs how the tool looks, feels and flows. Creates interfaces a supervisor or analyst can use without training.", skills: "UI design, user flows, accessibility, responsive design" },
  { name: "Winston", role: "Solution Architect", desc: "Designs the technical architecture — which technologies to use, how data flows, how everything connects.", skills: "System design, data architecture, API design" },
  { name: "Amelia", role: "Senior Developer", desc: "Writes the actual code. Builds features story by story, following the architecture and design specs.", skills: "Full-stack development, React, APIs, deployment" },
  { name: "Murat", role: "Test Architect", desc: "Ensures quality at every stage. Designs test strategies, validates features, catches issues early.", skills: "Test design, quality assurance, acceptance testing" },
  { name: "Paige", role: "Technical Writer", desc: "Documents everything, from user guides to data-source provenance, so the work is transferable and auditable.", skills: "Documentation, provenance, user guides" },
];

const bmadSteps = [
  { phase: "Discover", title: "Understand the problem", desc: "Mary the analyst researches the domain, gathers the public data, and works with you to define exactly what's needed. No assumptions — just evidence.", duration: "30-60 min", output: "Product brief with clear requirements" },
  { phase: "Design", title: "Plan the solution", desc: "Winston architects the system, Sally designs the experience, John writes the development plan. Everything is documented before code is written.", duration: "30-60 min", output: "Architecture, UX design, development plan" },
  { phase: "Build", title: "Write the code", desc: "Amelia builds the application story by story. Each feature is small, testable and deployable. You see progress in real time.", duration: "1-4 hrs per feature", output: "Working, deployed software" },
  { phase: "Validate", title: "Test and refine", desc: "Murat validates quality, you review the result, and we iterate. Changes that take weeks in traditional delivery happen in minutes.", duration: "Continuous", output: "Tested, production-ready tool" },
];

const twoDigit = (n: number) => n.toString().padStart(2, "0");

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-paper">
      <SiteNav
        activePage="how-it-works"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "How it works" }]}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 md:py-28 border-b border-rule">
        <GlowField />
        <div className="max-w-[1240px] mx-auto px-5 md:px-8 relative">
          <p className="eyebrow text-ink-muted mb-6">Behind the scenes</p>
          <h1 className="font-display text-[clamp(40px,4.5vw,60px)] font-medium text-ink leading-[1.02] mb-6 max-w-[15ch]">
            The method, the tools, the team.
          </h1>
          <p className="text-lg md:text-xl text-ink-secondary max-w-[62ch] leading-relaxed">
            A reference guide to everything powering today&apos;s session &mdash; and how a
            regulator could use these approaches to build its own tools over public data.
          </p>
        </div>
      </section>

      {/* ── What is BMAD ── */}
      <section className="bg-paper py-24 md:py-28">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <p className="eyebrow text-ink-muted mb-4">The method</p>
              <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight mb-6">
                BMAD: AI-native agile
              </h2>
              <p className="text-ink-secondary leading-relaxed mb-4">
                <strong className="text-ink font-semibold">BMAD</strong> is a method designed
                specifically for AI-assisted development. It takes the best of agile software
                delivery and adapts it for a world where AI agents do the heavy lifting.
              </p>
              <p className="text-ink-secondary leading-relaxed mb-4">
                Instead of one developer working alone, BMAD uses a{" "}
                <strong className="text-ink font-semibold">team of specialist AI agents</strong>{" "}
                &mdash; each with deep expertise. An analyst researches. An architect designs.
                A developer builds. A tester validates. Like a real software team, but at AI
                speed.
              </p>
              <p className="text-ink-secondary leading-relaxed mb-8">
                The human stays in control throughout. You make the decisions, set priorities,
                and approve direction. The AI handles execution.
              </p>

              <div className="bg-card border border-rule rounded-[2px] p-6">
                <h3 className="font-semibold text-ink text-sm mb-3">Why not just ask a chatbot?</h3>
                <p className="text-ink-secondary text-sm leading-relaxed">
                  General AI chat can answer questions, but it can&apos;t build and deploy real
                  software. BMAD gives the AI{" "}
                  <strong className="text-ink font-semibold">structure, memory and
                  specialisation</strong>. Each agent has deep expertise, follows a proven
                  process, and produces real, production-grade output &mdash; not just
                  suggestions.
                </p>
              </div>
            </div>

            <div>
              <p className="eyebrow text-ink-muted mb-6">The BMAD process</p>
              <div className="divide-y divide-rule border-y border-rule">
                {bmadSteps.map((step, i) => (
                  <div key={i} className="flex gap-6 py-6">
                    <span className="font-display text-2xl text-accent tnum leading-none flex-shrink-0 w-8">
                      {twoDigit(i + 1)}
                    </span>
                    <div>
                      <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                        <span className="eyebrow text-accent">{step.phase}</span>
                        <span className="text-ink-muted text-xs tnum">~{step.duration}</span>
                      </div>
                      <h4 className="font-semibold text-ink mb-1.5">{step.title}</h4>
                      <p className="text-ink-secondary text-sm leading-relaxed mb-2">{step.desc}</p>
                      <p className="text-success text-xs font-semibold">{step.output}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The AI Team ── */}
      <section className="bg-paper-raised py-24 md:py-28 border-y border-rule">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-16">
            <p className="eyebrow text-ink-muted mb-4">The team</p>
            <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight mb-5">
              Meet your agents
            </h2>
            <p className="text-ink-secondary text-lg leading-relaxed">
              Each agent is a specialist with deep domain expertise. They work together,
              coordinated by the BMAD method, with you as the decision-maker.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.name} className="bg-card border border-rule rounded-[2px] p-6">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-display text-3xl text-accent leading-none">
                    {agent.name[0]}
                  </span>
                  <div>
                    <h3 className="text-ink font-semibold">{agent.name}</h3>
                    <p className="eyebrow text-ink-muted mt-1">{agent.role}</p>
                  </div>
                </div>
                <p className="text-ink-secondary text-sm leading-relaxed mb-4">{agent.desc}</p>
                <p className="text-ink-muted text-xs leading-relaxed border-t border-rule pt-3">
                  <strong className="text-ink-secondary font-semibold">Skills:</strong> {agent.skills}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Claude Code ── */}
      <section className="bg-paper py-24 md:py-28">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <p className="eyebrow text-ink-muted mb-4">The engine</p>
              <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight mb-6">
                Claude Code
              </h2>
              <p className="text-ink-secondary leading-relaxed mb-4">
                <strong className="text-ink font-semibold">Claude Code</strong> is
                Anthropic&apos;s AI coding tool. It powers the BMAD agents &mdash; a
                professional-grade AI that reads codebases, writes production code, runs tests,
                deploys applications, and works with external APIs.
              </p>
              <p className="text-ink-secondary leading-relaxed mb-4">
                Unlike simple chat AI, Claude Code operates directly in the development
                environment. It reads files, writes code, runs commands, and manages
                deployments. It&apos;s the difference between an advisor and a doer.
              </p>
              <p className="text-ink-secondary leading-relaxed">
                Combined with BMAD&apos;s agent skills, Claude Code becomes a full delivery
                team. Each agent runs inside Claude Code with specialist instructions, tools
                and expertise.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-rule rounded-[2px] p-6">
                <h3 className="eyebrow text-ink-muted mb-5">What does it cost?</h3>
                <div>
                  {[
                    { item: "Claude Code subscription", cost: "~$100/month", free: false },
                    { item: "BMAD method", cost: "Free & open source", free: true },
                    { item: "Vercel deployment", cost: "Free tier available", free: true },
                    { item: "Public data APIs (FCA register, RSS)", cost: "Free", free: true },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center gap-4 py-3 border-b border-rule last:border-b-0">
                      <span className="text-ink-secondary text-sm">{row.item}</span>
                      <span className={`font-semibold text-sm tnum ${row.free ? "text-success" : "text-ink"}`}>{row.cost}</span>
                    </div>
                  ))}
                </div>
                <p className="text-ink-muted text-xs mt-4 pt-4 border-t border-rule leading-relaxed">
                  That&apos;s the cost of the tools &mdash; not the expertise. The value is
                  knowing what to ask for and how to shape the output.
                </p>
              </div>

              <div className="bg-card border border-rule rounded-[2px] p-6">
                <h3 className="font-semibold text-ink text-sm mb-2">No vendor lock-in</h3>
                <p className="text-ink-secondary text-sm leading-relaxed">
                  Everything produces standard, open-source code. You own it completely &mdash;
                  modify it, host it anywhere, hand it to any developer. Nothing proprietary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Traditional vs Vibe ── */}
      <section className="bg-paper-raised py-24 md:py-28 border-y border-rule">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-16">
            <p className="eyebrow text-ink-muted mb-4">The comparison</p>
            <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight">
              Traditional delivery vs. vibe coding
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Traditional */}
            <div className="bg-card rounded-[2px] p-8 border border-rule">
              <h3 className="eyebrow text-ink-muted mb-6">Traditional approach</h3>
              <ol className="divide-y divide-rule border-y border-rule">
                {[
                  "Write a brief and go to procurement",
                  "Select a supplier (weeks to months)",
                  "Requirements-gathering workshops",
                  "Design phase (weeks)",
                  "Development sprints (months)",
                  "Testing and UAT (weeks)",
                  "Deployment and training",
                  "Change requests cost time and money",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-4 py-3">
                    <span className="text-ink-muted text-xs font-semibold tnum w-5 flex-shrink-0">{twoDigit(i + 1)}</span>
                    <span className="text-ink-secondary text-sm">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="pt-5 mt-1 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow text-ink-muted">Typical timeline</span>
                  <span className="text-danger font-semibold tnum">3&ndash;12 months</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow text-ink-muted">Typical cost</span>
                  <span className="text-danger font-semibold tnum">&pound;50,000&ndash;&pound;500,000+</span>
                </div>
              </div>
            </div>

            {/* Vibe coding */}
            <div className="bg-card rounded-[2px] p-8 border border-rule-strong">
              <h3 className="eyebrow text-accent mb-6">Vibe coding with BMAD</h3>
              <ol className="divide-y divide-rule border-y border-rule">
                {[
                  { text: "Describe what you need in plain English", time: "5 min" },
                  { text: "AI analyst researches and gathers public data", time: "30 min" },
                  { text: "AI architect designs the solution", time: "15 min" },
                  { text: "AI developer builds a working prototype", time: "1-3 hrs" },
                  { text: "You review, give feedback, iterate", time: "ongoing" },
                  { text: "Live on the web, ready to use", time: "same day" },
                  { text: "Changes are instant — just ask", time: "minutes" },
                  { text: "Scale up when you're ready", time: "your pace" },
                ].map((step, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-ink text-sm font-medium">{step.text}</span>
                    <span className="text-accent text-xs font-semibold tnum flex-shrink-0">{step.time}</span>
                  </li>
                ))}
              </ol>
              <div className="pt-5 mt-1 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow text-ink-muted">Typical timeline</span>
                  <span className="text-success font-semibold">Hours to days</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow text-ink-muted">Typical cost</span>
                  <span className="text-success font-semibold tnum">~$100/month subscription</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What you could do ── */}
      <section className="bg-paper py-24 md:py-28">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-16">
            <p className="eyebrow text-ink-muted mb-4">The potential</p>
            <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight mb-5">
              What could the FCA do with this?
            </h2>
            <p className="text-ink-secondary text-lg leading-relaxed">
              Today&apos;s demo is just the start. With vibe-coding capability in-house, teams
              could build tools whenever a need arises &mdash; no procurement, no waiting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-x-8 gap-y-10">
            {[
              { title: "Supervision tooling", desc: "Turn public firm data, warning lists and complaints returns into dashboards a supervisor can explore in seconds." },
              { title: "Rapid prototyping", desc: "Got a new idea? Build a working prototype in an afternoon to test whether it's worth pursuing at all." },
              { title: "Consumer-facing tools", desc: "Register checkers, scam radars, plain-English explainers — the same public data, made usable for the public." },
              { title: "Internal tools", desc: "The small tools that never justify procurement — trackers, reporting views, evidence packs, triage aids." },
              { title: "Horizon scanning", desc: "AI feeds that read every public communication and surface the themes heating up across the market." },
              { title: "Upskilling teams", desc: "Vibe coding isn't just for developers. Any analyst who can describe a problem clearly can learn to build." },
            ].map((item, i) => (
              <div key={item.title} className="border-t border-rule-strong pt-5">
                <span className="font-display text-xl text-accent tnum leading-none block mb-4">{twoDigit(i + 1)}</span>
                <h3 className="font-semibold text-ink mb-2">{item.title}</h3>
                <p className="text-ink-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-paper-raised py-24 md:py-28 border-t border-rule">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <h2 className="font-display text-[clamp(30px,3vw,42px)] font-medium text-ink leading-tight mb-5">
            Ready to see it in action?
          </h2>
          <p className="text-ink-secondary text-lg mb-9 max-w-2xl mx-auto leading-relaxed">
            Head back to the session page and pick an option to build today.
          </p>
          <a
            href="/#choose"
            className="eyebrow inline-block bg-accent hover:bg-accent-hover text-paper-raised px-6 py-3.5 rounded-[2px] transition-colors"
          >
            Choose what to build
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
