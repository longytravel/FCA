import { Suspense } from "react";
import type { Metadata } from "next";
import PhoenixWatch from "@/src/components/phoenix/PhoenixWatch";
import { SiteNav, SiteFooter } from "@/src/components/ui";

export const metadata: Metadata = {
  title: "Phoenix Watch | FCA",
  description:
    "Trace directors of failed and fined firms into the active companies they rose again behind — live Companies House data, transparent risk scoring, and Claude briefings.",
};

export default function PhoenixWatchPage() {
  return (
    <>
      <SiteNav activePage="phoenix-watch" />
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-4 py-10 text-[14px] text-[#75767a]" style={{ fontFamily: "Arial, sans-serif" }}>
            Loading Phoenix Watch…
          </div>
        }
      >
        <PhoenixWatch />
      </Suspense>
      <SiteFooter />
    </>
  );
}
