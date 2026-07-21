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

const agentDot = ["bg-teal", "bg-blue", "bg-violet", "bg-teal", "bg-blue", "bg-violet", "bg-teal"];
const agentText = ["text-teal", "text-blue-bright", "text-violet", "text-teal", "text-blue-bright", "text-violet", "text-teal"];

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-ink">
      <SiteNav activePage="how-it-works" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 border-b border-line">
        <GlowField intensity="medium" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <p className="text-teal text-xs font-bold uppercase tracking-[0.2em] mb-4">Behind the scenes</p>
          <h1 className="text-4xl md:text-6xl font-black text-text leading-tight mb-4">
            The method, the tools,
            <br />
            <span className="text-gradient">the team.</span>
          </h1>
          <p className="text-lg md:text-xl text-text-soft max-w-2xl leading-relaxed">
            A reference guide to everything powering today&apos;s session &mdash; and how a
            regulator could use these approaches to build its own tools over public data.
          </p>
        </div>
      </section>

      {/* ── What is BMAD ── */}
      <section className="bg-ink py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl font-black text-text mb-6">BMAD: AI-native agile</h2>
              <p className="text-text-soft leading-relaxed mb-4">
                <strong className="text-text">BMAD</strong> is a method designed specifically for
                AI-assisted development. It takes the best of agile software delivery and adapts it
                for a world where AI agents do the heavy lifting.
              </p>
              <p className="text-text-soft leading-relaxed mb-4">
                Instead of one developer working alone, BMAD uses a{" "}
                <strong className="text-text">team of specialist AI agents</strong> &mdash; each with
                deep expertise. An analyst researches. An architect designs. A developer builds. A
                tester validates. Like a real software team, but at AI speed.
              </p>
              <p className="text-text-soft leading-relaxed mb-6">
                The human stays in control throughout. You make the decisions, set priorities, and
                approve direction. The AI handles execution.
              </p>

              <div className="bg-panel border border-line rounded-xl p-6">
                <h3 className="font-bold text-text text-sm mb-3">Why not just ask a chatbot?</h3>
                <p className="text-muted text-sm leading-relaxed">
                  General AI chat can answer questions, but it can&apos;t build and deploy real
                  software. BMAD gives the AI{" "}
                  <strong className="text-text-soft">structure, memory and specialisation</strong>.
                  Each agent has deep expertise, follows a proven process, and produces real,
                  production-grade output &mdash; not just suggestions.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-text mb-6">The BMAD process</h3>
              <div className="space-y-6">
                {bmadSteps.map((step, i) => (
                  <div key={i} className="relative pl-8 border-l-2 border-line">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-teal border-2 border-ink" />
                    <div className="bg-panel rounded-xl p-5 border border-line">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-teal font-black text-xs uppercase tracking-widest">{step.phase}</span>
                        <span className="text-muted-dark text-xs">~{step.duration}</span>
                      </div>
                      <h4 className="font-bold text-text mb-1">{step.title}</h4>
                      <p className="text-muted text-sm leading-relaxed mb-2">{step.desc}</p>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green text-xs font-semibold">{step.output}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The AI Team ── */}
      <section className="relative overflow-hidden bg-ink-2 py-20 border-y border-line">
        <GlowField intensity="soft" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-text mb-4">Meet your agents</h2>
            <p className="text-text-soft max-w-2xl mx-auto">
              Each agent is a specialist with deep domain expertise. They work together, coordinated
              by the BMAD method, with you as the decision-maker.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent, idx) => (
              <div key={agent.name} className="bg-panel border border-line rounded-xl p-6 hover:border-line-2 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${agentDot[idx]} flex items-center justify-center`}>
                    <span className="text-ink font-black text-lg">{agent.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-text font-bold">{agent.name}</h3>
                    <p className={`${agentText[idx]} text-xs font-semibold`}>{agent.role}</p>
                  </div>
                </div>
                <p className="text-muted text-sm leading-relaxed mb-3">{agent.desc}</p>
                <p className="text-muted-dark text-xs">
                  <strong className="text-muted">Skills:</strong> {agent.skills}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Claude Code ── */}
      <section className="bg-ink py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black text-text mb-6">Claude Code</h2>
              <p className="text-text-soft leading-relaxed mb-4">
                <strong className="text-text">Claude Code</strong> is Anthropic&apos;s AI coding
                tool. It powers the BMAD agents &mdash; a professional-grade AI that reads codebases,
                writes production code, runs tests, deploys applications, and works with external
                APIs.
              </p>
              <p className="text-text-soft leading-relaxed mb-4">
                Unlike simple chat AI, Claude Code operates directly in the development environment.
                It reads files, writes code, runs commands, and manages deployments. It&apos;s the
                difference between an advisor and a doer.
              </p>
              <p className="text-text-soft leading-relaxed">
                Combined with BMAD&apos;s agent skills, Claude Code becomes a full delivery team. Each
                agent runs inside Claude Code with specialist instructions, tools and expertise.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-panel border border-line rounded-xl p-6">
                <h3 className="text-teal font-bold text-sm mb-4">What does it cost?</h3>
                <div className="space-y-3">
                  {[
                    { item: "Claude Code subscription", cost: "~$100/month", free: false },
                    { item: "BMAD method", cost: "Free & open source", free: true },
                    { item: "Vercel deployment", cost: "Free tier available", free: true },
                    { item: "Public data APIs (FCA register, RSS)", cost: "Free", free: true },
                  ].map((row, i) => (
                    <div key={i} className={`flex justify-between items-center ${i < 3 ? "border-b border-line pb-3" : ""}`}>
                      <span className="text-text-soft text-sm">{row.item}</span>
                      <span className={`font-bold ${row.free ? "text-green" : "text-text"}`}>{row.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-line">
                  <p className="text-muted-dark text-xs">
                    That&apos;s the cost of the tools &mdash; not the expertise. The value is knowing
                    what to ask for and how to shape the output.
                  </p>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-xl p-6">
                <h3 className="font-bold text-text text-sm mb-2">No vendor lock-in</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Everything produces standard, open-source code. You own it completely &mdash;
                  modify it, host it anywhere, hand it to any developer. Nothing proprietary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Traditional vs Vibe ── */}
      <section className="bg-ink-2 py-20 border-y border-line">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-text mb-4">Traditional delivery vs. vibe coding</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional */}
            <div className="bg-panel rounded-xl p-8 border border-line">
              <h3 className="font-black text-muted text-lg mb-6">Traditional approach</h3>
              <div className="space-y-4">
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
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-line-2 flex items-center justify-center flex-shrink-0">
                      <span className="text-muted text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-muted text-sm">{step}</span>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-line">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-dark text-sm font-bold">Typical timeline:</span>
                    <span className="text-red font-black">3&ndash;12 months</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-dark text-sm font-bold">Typical cost:</span>
                    <span className="text-red font-black">&pound;50,000&ndash;&pound;500,000+</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vibe coding */}
            <div className="bg-panel rounded-xl p-8 border-2 border-teal">
              <h3 className="font-black text-teal text-lg mb-6">Vibe coding with BMAD</h3>
              <div className="space-y-4">
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
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-teal/15 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-text text-sm font-medium">{step.text}</span>
                    </div>
                    <span className="text-teal text-xs font-bold flex-shrink-0">{step.time}</span>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-line">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-dark text-sm font-bold">Typical timeline:</span>
                    <span className="text-green font-black">Hours to days</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-dark text-sm font-bold">Typical cost:</span>
                    <span className="text-green font-black">~$100/month subscription</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What you could do ── */}
      <section className="bg-ink py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-text mb-4">What could the FCA do with this?</h2>
            <p className="text-text-soft max-w-2xl mx-auto">
              Today&apos;s demo is just the start. With vibe-coding capability in-house, teams could
              build tools whenever a need arises &mdash; no procurement, no waiting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Supervision tooling", desc: "Turn public firm data, warning lists and complaints returns into dashboards a supervisor can explore in seconds." },
              { title: "Rapid prototyping", desc: "Got a new idea? Build a working prototype in an afternoon to test whether it's worth pursuing at all." },
              { title: "Consumer-facing tools", desc: "Register checkers, scam radars, plain-English explainers — the same public data, made usable for the public." },
              { title: "Internal tools", desc: "The small tools that never justify procurement — trackers, reporting views, evidence packs, triage aids." },
              { title: "Horizon scanning", desc: "AI feeds that read every public communication and surface the themes heating up across the market." },
              { title: "Upskilling teams", desc: "Vibe coding isn't just for developers. Any analyst who can describe a problem clearly can learn to build." },
            ].map((item) => (
              <div key={item.title} className="bg-panel rounded-xl p-6 border border-line hover:border-line-2 transition-all">
                <h3 className="font-bold text-text mb-2">{item.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-ink-2 py-20 border-t border-line">
        <GlowField intensity="soft" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <h2 className="text-2xl md:text-3xl font-black text-text mb-4">Ready to see it in action?</h2>
          <p className="text-text-soft mb-8 max-w-2xl mx-auto">
            Head back to the session page and pick an option to build today.
          </p>
          <a
            href="/#choose"
            className="inline-flex items-center gap-2 bg-teal hover:bg-teal-bright text-ink font-bold px-8 py-4 rounded-full transition-all hover:scale-[1.03]"
          >
            Choose what to build
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
