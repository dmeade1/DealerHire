/**
 * Minimal allowlist sanitizer for PageRelease body content (G1 public jobs).
 * Prefer storing plain paragraphs; never trust arbitrary publisher HTML.
 */

const ALLOWED_TAGS = new Set(["p", "br", "strong", "em", "ul", "ol", "li"]);
const SKIP_INNER_TAGS = new Set(["script", "style", "iframe", "object", "embed", "noscript"]);

function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitize fragment to a tiny HTML subset. Strips scripts, attrs, and unknown tags.
 * If input has no tags, wraps escaped text in <p>.
 */
export function sanitizeJobBodyHtml(input: string): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";

  // Fast path: no tag-like tokens → single escaped paragraph.
  if (!/<[a-zA-Z/!]/.test(raw)) {
    return `<p>${escapeText(raw)}</p>`;
  }

  const parts: string[] = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|[^<]+|</g;
  let match: RegExpExecArray | null;
  let skipDepth = 0;
  while ((match = re.exec(raw)) !== null) {
    const token = match[0];
    if (token.startsWith("<") && match[1]) {
      const tag = match[1].toLowerCase();
      const closing = token.startsWith("</");
      if (SKIP_INNER_TAGS.has(tag)) {
        if (!closing) skipDepth += 1;
        else if (skipDepth > 0) skipDepth -= 1;
        continue;
      }
      if (skipDepth > 0) continue;
      if (!ALLOWED_TAGS.has(tag)) {
        // Unknown tag: drop the tag token; keep following text.
        continue;
      }
      if (tag === "br") {
        parts.push("<br />");
        continue;
      }
      parts.push(closing ? `</${tag}>` : `<${tag}>`);
    } else if (skipDepth === 0) {
      // Lone "<" or text
      parts.push(escapeText(token));
    }
  }

  const out = parts.join("").trim();
  if (!out) return "";
  if (!/^<(p|ul|ol)\b/i.test(out)) {
    return `<p>${out}</p>`;
  }
  return out;
}
