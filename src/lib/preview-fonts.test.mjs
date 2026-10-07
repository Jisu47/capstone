import { test } from "node:test";
import assert from "node:assert/strict";
import { createPreviewFontCatalog, previewFontCss } from "./preview-fonts.ts";
const catalog = (...names) => createPreviewFontCatalog(names.map(name => ({ name, version: "123-456" })));

test("empty folder and placeholder produce no candidates", () => {
  assert.deepEqual(catalog(), { fonts: [], warnings: [] });
  assert.deepEqual(catalog(".gitkeep"), { fonts: [], warnings: [] });
});
test("groups exact family names and only registered weights", () => {
  const result = catalog("SUIT--700.woff2", "SUIT--400.woff2", "Other--500.woff");
  assert.equal(result.fonts.length, 2);
  assert.deepEqual(result.fonts.find(f => f.name === "SUIT").faces.map(f => f.weight), [400, 700]);
  assert.equal(result.warnings.length, 0);
});
test("woff2 wins duplicate weights independently of input order", () => {
  for (const names of [["Font--400.woff", "Font--400.woff2"], ["Font--400.woff2", "Font--400.woff"]]) {
    const result = catalog(...names);
    assert.equal(result.fonts[0].faces.length, 1);
    assert.equal(result.fonts[0].faces[0].format, "woff2");
    assert.equal(result.warnings.length, 1);
  }
});
test("malformed names and unsupported files are reported, not thrown", () => {
  const result = catalog("font.woff2", "--400.woff2", "Font--450.woff2", "Font--1000.woff2", "Font--400.ttf", "Font --400.woff2", "Font--Bold--400.woff2", "evil</style>--400.woff2");
  assert.equal(result.fonts.length, 0);
  assert.equal(result.warnings.length, 8);
});
test("Korean and spaces use encoded URLs and safe CSS aliases", () => {
  const result = catalog("한글 글꼴--400.woff2");
  assert.equal(result.fonts[0].name, "한글 글꼴");
  assert.match(result.fonts[0].faces[0].url, /%20/);
  assert.match(result.fonts[0].family, /^preview-font-[a-f0-9-]+$/);
  const css = previewFontCss(result.fonts);
  assert.match(css, /font-weight:400/);
  assert.doesNotMatch(css, /font-weight:600/);
});
test("new files appear on each fresh catalog and file version busts asset cache", () => {
  assert.equal(catalog("Font--400.woff2").fonts.length, 1);
  assert.equal(catalog("Font--400.woff2", "Other--700.woff2").fonts.length, 2);
  const first = createPreviewFontCatalog([{ name: "Font--400.woff2", version: "1" }]);
  const second = createPreviewFontCatalog([{ name: "Font--400.woff2", version: "2" }]);
  assert.notEqual(first.fonts[0].faces[0].url, second.fonts[0].faces[0].url);
});
