import type { Metadata } from "next";
import type { ReactNode } from "react";

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
        <a href="#main" style={{ position: "absolute", left: -9999 }}>
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
            <a href="/">Home</a>
            <a href="/dealer/listings">Listings</a>
            <a href="/dealer/applicants">Applicants</a>
            <a href="/dealer/campaigns">Campaigns</a>
            <a href="/dealer/analytics">Analytics</a>
            <a href="/ops">Ops</a>
          </nav>
        </header>
        <main id="main" style={{ padding: 20, maxWidth: 960, margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
