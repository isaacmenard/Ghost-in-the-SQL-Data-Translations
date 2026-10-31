/**
 * The check every pull request runs.
 *
 *   node scripts/check.mjs                  the shape of every language folder
 *   node scripts/check.mjs --base=../base   …and the changed lines, against the base branch
 *
 * It refuses what would break the game or lose a line, and only on lines the
 * pull request changed: a fault already in the files is not the contributor's.
 * Tone, words and register are read by a person after this passes.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const baseArg = process.argv.find((a) => a.startsWith("--base="));
const BASE = baseArg ? path.resolve(baseArg.slice(7)) : null;

const LANGUAGE = /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/;
const FIELDS = ["id", "field", "source", "text", "note", "rev", "outdated"];

let errors = 0;
let warnings = 0;
const say = (level, file, message) => {
  if (level === "error") errors++;
  else warnings++;
  /* GitHub turns these into notes on the pull request, beside the file. */
  console.log(process.env.GITHUB_ACTIONS ? `::${level} file=${file}::${message}` : `${level.padEnd(7)} ${file}  ${message}`);
};

const languagesIn = (root) =>
  fs.existsSync(root)
    ? fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && LANGUAGE.test(d.name)).map((d) => d.name)
    : [];

const filesIn = (dir) => {
  const out = [];
  const walk = (rel) => {
    for (const d of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${d.name}` : d.name;
      if (d.isDirectory()) walk(r);
      else out.push(r);
    }
  };
  if (fs.existsSync(dir)) walk("");
  return out.sort();
};

const read = (file) => {
  try {
    const rows = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(rows)) throw new Error("the file must be a list of lines");
    return rows;
  } catch (err) {
    say("error", path.relative(ROOT, file), `not valid JSON: ${err.message}`);
    return null;
  }
};

const placeholders = (s) => (String(s).match(/\{[A-Za-z0-9_]+\}/g) ?? []).sort().join(" ");
const spans = (s) => {
  const out = [];
  let fenced = false;
  for (const line of String(s).split("\n")) {
    if (line.trimStart().startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    if (!fenced) for (const m of line.matchAll(/`([^`\n]+)`/g)) out.push(m[1]);
  }
  return out;
};
const dashes = (s, language) => (String(s).match(language === "ru" ? /–/g : /[—–]/g) ?? []).length;

/** The checks on a line whose text changed. `was` is the text before. */
const checkText = (file, row, was, language) => {
  const where = `${row.id}|${row.field}`;
  const text = row.text;
  if (text === null || text === "") return;
  if (typeof text !== "string") return say("error", file, `${where}: "text" must be a string or null`);
  const source = language === "en" ? was : row.source;
  if (typeof source !== "string") return;

  if (placeholders(text) !== placeholders(source)) {
    say("error", file, `${where}: the {placeholders} differ from the English (${placeholders(source) || "none"})`);
  }
  const missing = spans(source).filter((s) => !text.includes("`" + s + "`") && !text.includes(s));
  if (missing.length) {
    say(language === "en" ? "error" : "warning", file, `${where}: the English has ${missing.map((s) => "`" + s + "`").join(", ")} and this does not. The player types those words.`);
  }
  if (dashes(text, language) > dashes(was ?? "", language)) {
    say("error", file, `${where}: a new dash. Use a colon, a full stop or a comma.`);
  }
  if (/!/.test(text) && !/!/.test(source)) say("warning", file, `${where}: an exclamation mark the English does not have`);
};

/** A language the base already has: only `text` may change. */
const compareWithBase = (language) => {
  const here = path.join(ROOT, language);
  const there = path.join(BASE, language);
  const before = new Set(filesIn(there));
  const after = filesIn(here);
  for (const rel of after) {
    const file = `${language}/${rel}`;
    if (!before.has(rel)) {
      say("error", file, "a new file. Files come from the game; only the lines inside them change.");
      continue;
    }
    const a = read(path.join(there, rel));
    const b = read(path.join(here, rel));
    if (!a || !b) continue;
    if (a.length !== b.length) {
      say("error", file, `${b.length} lines where there were ${a.length}. Lines are never added, removed or moved.`);
      continue;
    }
    b.forEach((row, i) => {
      const old = a[i];
      for (const k of FIELDS) {
        if (k === "text") continue;
        if (JSON.stringify(row[k]) !== JSON.stringify(old[k])) {
          say("error", file, `${old.id}|${old.field}: "${k}" changed. Only "text" may change.`);
          return;
        }
      }
      const extra = Object.keys(row).filter((k) => !FIELDS.includes(k));
      if (extra.length) say("error", file, `${old.id}|${old.field}: unknown field ${extra.join(", ")}`);
      if (row.text !== old.text) checkText(file, row, old.text, language);
    });
    before.delete(rel);
  }
  for (const rel of before) say("error", `${language}/${rel}`, "a file was deleted.");
};

/** A language the base does not have: it mirrors the English, line for line. */
const compareWithEnglish = (language) => {
  const en = new Map(filesIn(path.join(ROOT, "en")).map((rel) => [rel, read(path.join(ROOT, "en", rel))]));
  for (const rel of filesIn(path.join(ROOT, language))) {
    const file = `${language}/${rel}`;
    const source = en.get(rel);
    if (!source) {
      say("error", file, "the English has no such file.");
      continue;
    }
    const rows = read(path.join(ROOT, language, rel));
    if (!rows) continue;
    if (rows.length !== source.length) {
      say("error", file, `${rows.length} lines where the English has ${source.length}. Run scripts/new-language.mjs again for this file.`);
      continue;
    }
    rows.forEach((row, i) => {
      const s = source[i];
      if (row.id !== s.id || row.field !== s.field || row.source !== s.text || row.rev !== s.rev) {
        say("error", file, `${s.id}|${s.field}: does not match the English line in the same place.`);
        return;
      }
      checkText(file, row, row.source, language);
    });
  }
};

if (!fs.existsSync(path.join(ROOT, "en"))) {
  say("error", "en", "the English folder is missing.");
} else if (BASE) {
  const known = new Set(languagesIn(BASE));
  for (const language of languagesIn(ROOT)) {
    if (known.has(language)) compareWithBase(language);
    else compareWithEnglish(language);
  }
  for (const language of known) if (!fs.existsSync(path.join(ROOT, language))) say("error", language, "a language folder was deleted.");
} else {
  for (const language of languagesIn(ROOT)) if (language !== "en") compareWithEnglish(language);
}

console.log(`\n${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
