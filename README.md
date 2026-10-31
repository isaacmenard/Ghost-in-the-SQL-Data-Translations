# Ghost in the SQL Data: translations

Every line of [Ghost in the SQL Data](https://store.steampowered.com/app/5072550), the detective game you solve by writing real SQL, in the ten languages it ships in. A fix merged here goes into the next update of the game.

**Spoilers.** These files hold every case, every answer Detective Reyes gives after a stamp, and the ending. Play first.

## What is here

```
en/  fr/  it/  de/  es/  pt/  ja/  ko/  ru/  zh/
  ui.json              menus, buttons, the desk
  reference.json       the SQL card
  lessons/<name>.json  the tutorials
  reels/<name>.json    the cinematics
  cases/<name>.json    the case files
```

Each line looks like this:

```json
{
  "id": "desk.title",
  "field": "desk",
  "source": "Query Desk",
  "text": "Poste de requêtes",
  "note": "group desk: the full-screen query window",
  "rev": "3f9a1c0be2d4"
}
```

You change `text`. Nothing else.

## How to help

- **Fix a line**, in any language including English: [GUIDE.md](GUIDE.md#fix-a-line).
- **Translate a language that is not here yet**: [GUIDE.md](GUIDE.md#add-a-language).

Read [CONTRIBUTING.md](CONTRIBUTING.md) before your first pull request: it says what you agree to by opening one.
