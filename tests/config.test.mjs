import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { loadConfig, ROOT } from "./helpers.mjs";

const cfg = loadConfig();
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

test("config.js defines window.MARKETPLACE_CONFIG", () => {
  assert.equal(typeof cfg, "object");
  assert.ok(cfg);
});

test("branding keys are set and the logo and data files exist", () => {
  for (const key of ["name", "lang", "dataUrl"]) {
    assert.equal(typeof cfg[key], "string", `${key} must be a string`);
    assert.ok(cfg[key].trim(), `${key} must not be empty`);
  }
  assert.ok(existsSync(join(ROOT, cfg.dataUrl)), `dataUrl ${cfg.dataUrl} not found`);
  if (cfg.logo) assert.ok(existsSync(join(ROOT, cfg.logo)), `logo ${cfg.logo} not found`);
});

test("floors is a non-empty list of unique strings and includes defaultFloor", () => {
  assert.ok(Array.isArray(cfg.floors) && cfg.floors.length > 0);
  for (const f of cfg.floors) assert.equal(typeof f, "string", "floors must be strings (CSV values are strings)");
  assert.equal(new Set(cfg.floors).size, cfg.floors.length, "floors must be unique");
  if (cfg.defaultFloor !== undefined) {
    assert.ok(cfg.floors.includes(cfg.defaultFloor), "defaultFloor must be one of floors");
  }
});

test("theme colours are valid hex colours", () => {
  for (const [key, value] of Object.entries(cfg.theme ?? {})) {
    assert.match(value, /^#([0-9a-f]{3}|[0-9a-f]{6})$/i, `theme.${key}`);
  }
});

test("orderButton is null or has a label and a fallbackUrl string", () => {
  if (cfg.orderButton === null || cfg.orderButton === undefined) return;
  assert.equal(typeof cfg.orderButton.label, "string");
  assert.equal(typeof cfg.orderButton.fallbackUrl, "string");
});

test("contact has an email and a phone", () => {
  assert.equal(typeof cfg.contact?.email, "string");
  assert.equal(typeof cfg.contact?.phone, "string");
});

test("every label used by index.html and scripts/app.js is defined", () => {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  const js = readFileSync(join(ROOT, "scripts/app.js"), "utf8");
  const used = new Set([
    ...[...html.matchAll(/data-label(?:-title)?="([^"]+)"/g)].map((m) => m[1]),
    ...[...js.matchAll(/\bt\("([^"]+)"\)/g)].map((m) => m[1]),
  ]);
  assert.ok(used.size > 10, "expected to find the label keys in the source");
  const missing = [...used].filter((k) => typeof cfg.labels?.[k] !== "string");
  assert.deepEqual(missing, [], `labels missing from config.labels: ${missing.join(", ")}`);
});

test("labels.days translates all seven weekdays", () => {
  for (const d of DAYS) assert.equal(typeof cfg.labels?.days?.[d], "string", `labels.days.${d}`);
});
