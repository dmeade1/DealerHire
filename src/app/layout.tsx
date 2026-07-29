import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DealerHire",
  description: "Automotive labor intelligence — compliant hiring operations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          lineHeight: 1.5,
          color: "#111",
          background: "#fff",
        }}
      >
        <style>{`
          .skip-link {
            position: absolute;
            left: -9999px;
            top: 0;
            z-index: 1000;
            padding: 8px 12px;
            background: #111;
            color: #fff;
            text-decoration: underline;
          }
          .skip-link:focus {
            left: 12px;
            top: 12px;
            outline: 3px solid #046;
            outline-offset: 2px;
          }
        `}</style>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <header
          style={{
            borderBottom: "1px solid #ddd",
            padding: "12px 20px",
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <strong>DealerHire</strong>
          <nav aria-label="Primary" style={{ display: "flex", gap: 12 }}>
            <Link href="/">Home</Link>
            <Link href="/dealer/listings">Listings</Link>
            <Link href="/dealer/applicants">Applicants</Link>
            <Link href="/dealer/campaigns">Campaigns</Link>
            <Link href="/dealer/analytics">Analytics</Link>
            <Link href="/ops">Ops</Link>
          </nav>
        </header>
        <main id="main" style={{ padding: 20, maxWidth: 960, margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
