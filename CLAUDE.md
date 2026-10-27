# Facit — web

Landing page and in-browser deck builder for the Facit iOS app, served at
https://facit.study by GitHub Pages (`CNAME`, `.nojekyll`). Plain HTML, CSS
and JS. There is no build step, no npm and no tests.

## Two languages, always together

Every page has a Swedish copy under `sv/`, and both copies change in the same commit:

| English              | Swedish                 |
|----------------------|-------------------------|
| `index.html`         | `sv/index.html`         |
| `privacy/index.html` | `sv/privacy/index.html` |
| `join/index.html`    | `sv/join/index.html`    |

- Keep the structure the same in both: section ids, element order, classes.
  Only the text differs.
- UI strings in JS are picked from `<html lang>`. In `app.js` they are in
  `STRINGS.en` / `STRINGS.sv`, in `try.js` in the `sv ? {...} : {...}` block.
  Update both languages.
- The inline `<script>` in each English page's `<head>` redirects Swedish
  browsers to `/sv/`. `assets/lang.js` remembers the visitor's choice of language.

## Files

- `assets/app.js`: the deck builder. Builds cards, encodes a deck, compresses
  it with pako and shows it as an animated QR code. The encoding must match
  `QrPayloadParser.cs` in the iOS app (tokens such as `__PIPE__`), so check
  with the app before changing it.
- `assets/try.js`: the "Try it" demo (Flashcard / Quiz / Game). Runs only in the
  page and saves nothing.
- `assets/guide.js`: opens a `details.topic` when the URL hash links to it.
- `assets/site.css`: all styles, shared by every page.
- `.well-known/apple-app-site-association`: universal links for `/join`
  (group invite codes). Keep the path and the JSON format exactly as they are.
  The app ID is `6QS9YFCB52.se.int32consulting.facit`.

## Conventions

- Third-party libraries come only from cdnjs, each pinned to an exact version
  (pako, qrcodejs, marked, KaTeX). No other script hosts.
- Privacy promises (no account, no upload, games over Wi-Fi only) are product
  claims. Don't write copy that contradicts them, and update
  `privacy/` (both languages) whenever a feature changes what data goes where.
- Product wording: "Paste from AI", "quiz cards".
- Commits: one short sentence that says what changed for the visitor.

## Preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

The `/sv/` redirect runs only over http(s), so open the files through the
server, not from `file://`.
