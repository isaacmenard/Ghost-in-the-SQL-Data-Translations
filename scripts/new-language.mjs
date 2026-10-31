/**
 * Start a language the game does not have yet.
 *
 *   node scripts/new-language.mjs pl
 *
 * Copies every file of `en/` into `<code>/` with the English as `source` and
 * `text` set to null. Run it again later to pick up files the game has added
 * since: a file that already exists is left alone.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const [code] = process.argv.slice(2);

if (!code || !/^[a-z]{2,3}(-[A-Za-z0-9]+)?$/.test(code)) {
  console.error('Usage: node scripts/new-language.mjs <code>   e.g. pl');
  process.exit(1);
}
if (code === "en") {
  console.error("English is the source. Edit en/ directly.");
  process.exit(1);
}

const walk = (dir, rel = "") =>
  fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((d) => {
    const r = rel ? `${rel}/${d.name}` : d.name;
    return d.isDirectory() ? walk(dir, r) : [r];
  });

let made = 0;
for (const rel of walk(path.join(ROOT, "en"))) {
  const target = path.join(ROOT, code, rel);
  if (fs.existsSync(target)) continue;
  const rows = JSON.parse(fs.readFileSync(path.join(ROOT, "en", rel), "utf8")).map((r) => ({
    id: r.id,
    field: r.field,
    source: r.text,
    text: null,
    note: r.note,
    rev: r.rev
  }));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(rows, null, 2) + "\n");
  made++;
}

console.log(`${made} file(s) created in ${code}/.`);
