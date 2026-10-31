# Guide

Never change, in any language:

- SQL keywords: `SELECT`, `WHERE`, `GROUP BY`.
- Anything in `backticks`: `dispatch_log`, `'Phone Call'`. The player types these.
- Names of people and places: `Victor Pell`, `rue Ramponeau`.
- `{placeholders}`: keep each one, wherever your sentence needs it.

No em dash (—) or en dash (–), except in Russian.

## Fix a line

1. Find the line: press `t` on the repository page, or search a few words of it.
2. Click the pencil and change `text`. Nothing else.
3. Open a pull request and say why in one sentence.

In a file:

- `source` is the English.
- `"text": null` means not translated yet. The game shows the English.
- `"outdated": true` means the English changed. Read `source` again and fix `text`.

A fix to the English (`en/`) marks that line `outdated` in every other language.

## Add a language

1. Open an issue with the language name.
2. Run `node scripts/new-language.mjs pl` (or ask in the issue).
3. In the issue, say how Detective Reyes addresses the recruit (he is their superior, blunt) and the one word you use for a case, a checkpoint and the board.
4. Translate `ui.json` first, then `lessons/`, `reels/` and `cases/`. Send a pull request after each part.

The language goes into the game once the interface and the first case are done.
