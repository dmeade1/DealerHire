import { describe, expect, it } from "vitest";
import { sanitizeJobBodyHtml } from "./safe-html";

describe("sanitizeJobBodyHtml", () => {
  it("escapes plain text into a paragraph", () => {
    expect(sanitizeJobBodyHtml("Hello world & co")).toBe("<p>Hello world &amp; co</p>");
    // Angle brackets that are not real tags are escaped.
    expect(sanitizeJobBodyHtml("a < 3 & b > 1")).toBe("<p>a &lt; 3 &amp; b &gt; 1</p>");
  });

  it("keeps allowlisted tags and strips attributes/scripts", () => {
    const dirty =
      '<p onclick="alert(1)">Safe</p><script>alert(2)</script><strong class="x">Bold</strong>';
    const clean = sanitizeJobBodyHtml(dirty);
    expect(clean).toContain("<p>Safe</p>");
    expect(clean).toContain("<strong>Bold</strong>");
    expect(clean).not.toMatch(/script|onclick|class=/i);
  });

  it("drops unknown tags but keeps text", () => {
    const clean = sanitizeJobBodyHtml("<div>Inside</div>");
    expect(clean).toBe("<p>Inside</p>");
  });
});
