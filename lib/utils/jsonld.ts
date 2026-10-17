/**
 * Serialize a value for injection into `<script type="application/ld+json">`.
 *
 * `JSON.stringify` alone is NOT safe inside a <script> element: a string
 * containing `</script>` closes the element early, so an upstream-controlled
 * field (anime title / description from the scraper) could break out and run
 * arbitrary JavaScript (stored XSS via hostile or compromised upstream data).
 *
 * Escaping `<`, `>`, `&` and the JS line separators as \uXXXX keeps the output
 * byte-for-byte valid JSON (parsers decode the escapes back to the original
 * characters) while making script-tag breakout impossible.
 */
export function jsonLdHtml(value: unknown): string {
  const json = JSON.stringify(value ?? null);
  if (typeof json !== "string") return "null";
  return json
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}