import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConfig, loadCsv, parseCsv } from "./helpers.mjs";

const cfg = loadConfig();
const { header, rows, records } = loadCsv(cfg.dataUrl);
const DAYS = Object.keys(cfg.labels.days);
const COLUMNS = [
  "floor", "shop_name", "rating", "reviews", "status", "price", "categories",
  "hours", "logo_url", "phone", "social", "external_url", "description",
];
const REQUIRED = ["floor", "shop_name", "status"];

test("CSV parser handles quotes, escaped quotes, embedded commas and CRLF", () => {
  assert.deepEqual(parseCsv('a,b\r\n"x,y","say ""hi"""\r\n\r\n'), [["a", "b"], ["x,y", 'say "hi"']]);
  assert.throws(() => parseCsv('a\n"open'));
});

test("CSV has the required columns and no unknown (misspelled) ones", () => {
  for (const col of REQUIRED) assert.ok(header.includes(col), `missing required column ${col}`);
  const unknown = header.filter((h) => !COLUMNS.includes(h));
  assert.deepEqual(unknown, [], `unknown columns: ${unknown.join(", ")}`);
});

test("CSV has rows and every row has one value per column", () => {
  assert.ok(records.length > 0);
  rows.forEach((r, i) => assert.equal(r.length, header.length, `row ${i + 2}`));
});

test("required fields are present and status is Open or Closed", () => {
  records.forEach((s, i) => {
    assert.ok(s.shop_name?.trim(), `row ${i + 2}: shop_name`);
    assert.match(s.status, /^(open|closed)$/i, `row ${i + 2}: status`);
  });
});

test("every shop is on a floor listed in config.floors", () => {
  records.forEach((s, i) => assert.ok(cfg.floors.includes(s.floor), `row ${i + 2}: floor ${s.floor}`));
});

test("optional numeric fields are in range", () => {
  records.forEach((s, i) => {
    if (s.price) assert.match(s.price, /^[123]$/, `row ${i + 2}: price`);
    if (s.rating) {
      const r = Number(s.rating);
      assert.ok(r >= 0 && r <= 5, `row ${i + 2}: rating`);
    }
    if (s.reviews) assert.match(s.reviews, /^\d+$/, `row ${i + 2}: reviews`);
  });
});

test("hours are JSON objects keyed by weekday", () => {
  records.forEach((s, i) => {
    if (!s.hours) return;
    const hours = JSON.parse(s.hours);
    assert.equal(typeof hours, "object", `row ${i + 2}: hours`);
    for (const day of Object.keys(hours)) assert.ok(DAYS.includes(day), `row ${i + 2}: unknown day ${day}`);
  });
});

test("external links use http(s) when set", () => {
  records.forEach((s, i) => {
    if (s.external_url) assert.match(s.external_url, /^https?:\/\//, `row ${i + 2}: external_url`);
  });
});
