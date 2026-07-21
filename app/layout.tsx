import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe Coding at the FCA | Live-Built Regtech Demos",
  description:
    "A hands-on demonstration: working tools built live in hours from the UK's public data — joined to create insight nobody has. You choose what we build.",
};

export const viewport: Viewport = {
  themeColor: "#6c1d45",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-paper text-ink-secondary overflow-x-clip">
        {children}
      </body>
    </html>
  );
}
