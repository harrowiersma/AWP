import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEA AWP Speaking Number Decoder",
  description:
    "Decode GEA AWP material codes (Erzeugnisnummernschlüssel / ENS) into human-readable specifications.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              <strong>AWP Decoder</strong>
              <span className="brand-sub">Speaking number lookup</span>
            </Link>
            <nav>
              <Link href="/">Single</Link>
              <Link href="/batch">Batch (CSV / XLSX)</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer container">
          <small>
            Phase 1 MVP — decodes positions 1 to 12 of the standard 16-character ENS code. Sources:
            GEA AWP ENS catalogue (18.1.x).
          </small>
        </footer>
      </body>
    </html>
  );
}
