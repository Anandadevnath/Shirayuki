import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonLdHtml } from "./jsonld.ts";

test("escapes a </script> breakout inside a field value", () => {
  const evil = '</script><script>alert(document.cookie)</script>';
  const html = jsonLdHtml({ name: evil, description: "ok & <b>" });

  // The raw terminator must not survive — otherwise the parser closes the
  // JSON-LD element early and the remainder executes as markup/script.
  assert.ok(!/</i.test(html), "output must not contain a raw '<'");
  assert.ok(!html.includes("</script"));

  // …while remaining valid JSON that round-trips to the original value.
  assert.deepEqual(JSON.parse(html), { name: evil, description: "ok & <b>" });
});

test("escapes HTML comment / ampersand injection vectors", () => {
  const html = jsonLdHtml({ name: "<!-- --> & &#39;" });
  assert.ok(!html.includes("<") && !html.includes(">") && !html.includes("&"));
  assert.deepEqual(JSON.parse(html), { name: "<!-- --> & &#39;" });
});

test("handles line separators and falsy values safely", () => {
  // U+2028 / U+2029 are legal in JSON strings but terminate JS string
  // literals; keep them escaped.
  const html = jsonLdHtml({ name: "a\u2028b\u2029c" });
  assert.ok(!html.includes("\u2028") && !html.includes("\u2029"));
  assert.deepEqual(JSON.parse(html), { name: "a\u2028b\u2029c" });

  assert.equal(jsonLdHtml(undefined), "null");
  assert.equal(jsonLdHtml(null), "null");
});

test("a hostile upstream title cannot escape the JSON-LD script tag", () => {
  // Mirrors the exact shape the anime detail page injects.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: "</script><img src=x onerror=alert(1)>",
  };
  const html = jsonLdHtml(jsonLd);
  const nearScript = html.toLowerCase().indexOf("</script");
  assert.equal(nearScript, -1, "no closing script sequence may exist");
  assert.equal(JSON.parse(html).name, "</script><img src=x onerror=alert(1)>");
});