# Pastoral Oversight at RLCC

A mobile-first microlearning path for RLCC pastoral staff: ten short lessons (62 cards), each ending with a practical action. Learners register with name, email, and password, and log in each time. Progress is tracked as a percentage and sent to a Google Sheet that the Learning Hub can read.

No build step. Plain HTML, CSS, and JavaScript, with self-hosted fonts (about 70 KB) and an offline-capable shell.

## Files

| File | What it does |
|---|---|
| `index.html` | Page shell, all styling, social-share (Open Graph) tags |
| `app.js` | Login, card player, quizzes, reflections, actions, progress, sync |
| `content.js` | **All lesson text.** Edit this to change content |
| `config.js` | Holds your Apps Script URL (one line) |
| `og-image.png` | 1200 x 630 share image |
| `sw.js`, `manifest.webmanifest` | Fast repeat loads, offline shell, "Add to Home Screen" |
| `apps-script/Code.gs` | Back end (accounts, progress, Learning Hub feed) |

## 1. Back end (Google Apps Script)

1. Create a new Google Sheet named **RLCC Pastoral Oversight Data**.
2. **Extensions > Apps Script**. Paste `apps-script/Code.gs`, save.
3. Select `setup` in the function list and **Run**. Approve the permissions. This creates the tabs (Users, State, Progress, Responses) and a secret signing key.
4. **Deploy > New deployment > Web app**. Execute as **Me**, access **Anyone**. Copy the URL ending in `/exec`.
5. Paste that URL into `config.js`:
   ```js
   window.RO_CONFIG = { apiUrl: "https://script.google.com/macros/s/XXXX/exec" };
   ```
6. After any change to `Code.gs`, use **Deploy > Manage deployments > Edit > New version**.

Optional **Script properties** (Project Settings):
- `REG_CODE`: if set, new accounts must enter this staff access code (the field appears automatically). Recommended, so only your pastoral staff can register.
- `HUB_KEY`: created by `setup()`. Needed by the Learning Hub to read progress.
- `HUB_WEBHOOK_URL`: if set, every change in a learner's percentage is POSTed there.

Admin menu (in the Sheet): **Oversight admin > Reset a learner's password**.

## 2. Hosting (GitHub Pages)

1. Create a repository, for example `rlccphil/pastoral-oversight`, and upload everything in this folder except `apps-script/` (that folder is harmless to include, but it is not needed on the site).
2. **Settings > Pages > Deploy from branch > main / (root)**.
3. Your link will be `https://rlccphil.github.io/pastoral-oversight/`.
4. If your repository name differs, replace `https://rlccphil.github.io/pastoral-oversight/` in the `og:url`, `og:image`, and `twitter:image` tags in `index.html`.
5. Social networks cache share previews. After changing `og-image.png`, refresh the cache with the Facebook Sharing Debugger.

## 3. Learning Hub

Progress is written to the **Progress** tab, one row per learner:

`Name, Email, Course, Percent, Lessons Completed, Total Lessons, Steps Done, Total Steps, Actions Committed, Actions Done, Started, Last Activity, Completed`

Three ways to connect it:

1. **Same spreadsheet or IMPORTRANGE**: point the Hub at the Progress tab.
2. **Pull (JSON)**: `GET <web app URL>?action=hub&key=<HUB_KEY>` returns every learner's progress.
3. **Push**: set `HUB_WEBHOOK_URL` and the Hub receives `{source, course, courseName, name, email, percent, key}` whenever a percentage changes.

The **Responses** tab holds each learner's written reflections and action commitments (one row per card, updated in place).

## Editing lessons

Open `content.js`. Each lesson is a list of cards (`idea`, `scripture`, `list`, `compare`, `choice`, `sort`, `reflect`, `action`). The header comment explains each type. If you reorder or insert cards after people have started, give the card a fixed `key: "..."` so existing progress stays attached to it. After publishing changes, bump `VERSION` in `sw.js` so phones fetch the new files.

## Notes

- **Preview mode**: if `apiUrl` is empty, the tool runs locally (accounts and progress stay on that device). Useful for testing.
- Sessions last for the open browser tab (and at most 12 hours), so learners log in each time they return.
- Passwords are never stored: only a salted, stretched hash. Anyone with edit access to the Sheet can still read learners' names, emails, progress, and written responses, so restrict the Sheet's sharing.
- Scripture cards are paraphrases with references, so there is no translation licensing to manage.
