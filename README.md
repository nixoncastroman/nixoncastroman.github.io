# nixoncastroman.github.io

Portfolio site: a business-card landing page plus four case studies. Plain HTML and CSS, no build step.

## Files

| Path | What it is |
|---|---|
| `index.html` | The card, the list of work, About |
| `work/*.html` | One page per case study |
| `assets/css/site.css` | All styles (colors and fonts are at the top) |
| `assets/js/charts.js` | Draws the two charts; their data is in a JSON block inside each chart's `<figure>` |
| `assets/fonts/` | EB Garamond (SIL Open Font License, `OFL.txt`) |
| `assets/img/og.png` | Preview image shown when the link is shared (LinkedIn, WhatsApp…) |
| `resume.pdf` | Public résumé, without the phone number |

## Preview

Open `index.html` in a browser. To check `404.html` too, serve the folder:

```bash
python3 -m http.server -d site 8000   # then open http://localhost:8000
```

## Update the résumé on the site

The résumé source is `../cv/resume.html`. After editing it:

```bash
python3 cv/build_pdf.py                                     # private copy, with phone: cv/Nixon_Castroman_Resume.pdf
python3 cv/build_pdf.py --public cv/resume.html site/resume.pdf   # website copy, no phone
```

## Publish (one time)

1. Create a free GitHub organization named `nixoncastroman`: https://github.com/account/organizations/new?plan=free
2. In it, create a public repository named `nixoncastroman.github.io`.
3. Push the contents of this folder to its `main` branch.
4. Repository Settings → Pages → Deploy from a branch → `main`, `/ (root)`.

The site is then live at https://nixoncastroman.github.io. Later updates: edit, commit, push.

## Rules for the content

- NTT DATA code stays private. The case study describes the approach only, with no code, client names or internal screenshots.
- Capstone: no real monitoring results (NDA). Dashboard screenshots must use demo data.
