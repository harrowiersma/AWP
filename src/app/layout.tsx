import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWP Speaking Number Decoder — Powered by Xappo",
  description:
    "Decode GEA AWP material codes (Erzeugnisnummernschlüssel / ENS) into human-readable specifications. Powered by Xappo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand" aria-label="GEA AWP Decoder home">
              <Image
                src="/awp-logo.png"
                alt="GEA AWP"
                width={500}
                height={173}
                className="awp-logo"
                priority
              />
              <span className="brand-text">
                <span className="brand-name">Speaking Number Decoder</span>
                <span className="brand-sub">GEA AWP / ENS material codes</span>
              </span>
            </Link>
            <nav className="primary-nav">
              <Link href="/">Single</Link>
              <Link href="/batch">Batch</Link>
              <span className="powered-by">
                <span className="muted">Powered by</span>
                <Image
                  src="/xappo-small.png"
                  alt="Xappo"
                  width={64}
                  height={20}
                  className="xappo-logo"
                  priority
                />
              </span>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <div className="footer-left">
              <Image
                src="/gea-logo.png"
                alt="GEA — Engineering for a better world"
                width={490}
                height={91}
                className="gea-logo"
              />
              <div className="footer-copy">
                © 2026 XAPPO Enterprises Ltd. &nbsp;|&nbsp; <strong>V1.2 AWP PoC</strong>
              </div>
            </div>
            <nav className="footer-nav">
              <Link href="/privacy">Privacy</Link>
              <Link href="/eula">EULA</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
