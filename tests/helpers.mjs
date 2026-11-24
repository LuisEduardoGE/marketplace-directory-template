// Shared helpers for the smoke tests: load config.js the way the browser does and parse the CSV.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Run config.js in a sandbox with a fake `window` and return window.MARKETPLACE_CONFIG. */
export function loadConfig() {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(join(ROOT, "config.js"), "utf8"), sandbox, { filename: "config.js" });
  return sandbox.window.MARKETPLACE_CONFIG;
}

/**
 * Minimal RFC 4180 CSV parser (quoted fields, "" escapes, commas and newlines inside quotes,
 * CRLF or LF). Returns an array of rows, each an array of strings. Throws on an unterminated quote.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (inQuotes) throw new Error("Unterminated quoted field");
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  // Same as PapaParse's skipEmptyLines: drop blank lines.
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** Parse a CSV file into { header, rows, records } where records are objects keyed by header. */
export function loadCsv(relPath) {
  const text = readFileSync(join(ROOT, relPath), "utf8").replace(/^﻿/, "");
  const [header, ...rows] = parseCsv(text);
  return { header, rows, records: rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]]))) };
}
