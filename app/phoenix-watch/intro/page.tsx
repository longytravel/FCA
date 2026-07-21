import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Phoenix Watch — Introduction | FCA",
  description:
    "Paul Speight introduces Phoenix Watch: you can dissolve the company. You can't dissolve the data.",
};

/* Standalone intro screen for the demo — deliberately no site nav/footer so it
   can sit on the projector before the live build. */
export default function PhoenixIntroPage() {
  return (
    <main
      className="min-h-screen bg-[#6c1d45] text-white flex flex-col"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="mx-auto w-full max-w-4xl px-6 py-10 flex-1 flex flex-col justify-center">
        <p className="text-[13px] tracking-[0.14em] uppercase text-white/70 mb-2">
          A live vibe-coding demonstration · with the FCA
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Phoenix Watch</h1>
        <p className="text-lg text-white/85 mb-8 max-w-2xl">
          The FCA fines a firm. The firm quietly dissolves. Its directors rise
          again. A word from our sponsor — Paul Speight, already wearing the
          merchandise.
        </p>

        <div className="relative w-full bg-black border border-white/20" style={{ paddingTop: "56.25%" }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src="https://app.heygen.com/embeds/062db9e82a744c43b8c9cf748a8fb408"
            title="Paul Speight introduces Phoenix Watch"
            frameBorder="0"
            allow="encrypted-media; fullscreen;"
            allowFullScreen
          />
        </div>

        <p className="mt-8 text-2xl md:text-3xl font-bold leading-snug">
          You can dissolve the company.
          <br />
          You can&apos;t dissolve the data.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/phoenix-watch"
            className="inline-block bg-white text-[#6c1d45] font-bold px-6 py-3 text-[15px] hover:bg-[#f0f0f1]"
          >
            Open the live demo →
          </Link>
          <p className="text-white/70 text-sm">
            300 real FCA fines · live Companies House data · built in hours by
            talking to a computer.
          </p>
        </div>
      </div>

      <footer className="text-center text-white/50 text-xs pb-6">
        Not the official fca.org.uk — but yes, the t-shirt is real.
      </footer>
    </main>
  );
}
