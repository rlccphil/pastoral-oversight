# Pastoral Oversight at RLCC

A mobile-first microlearning path for RLCC pastoral staff: ten short lessons (62 cards), each ending with a practical action. Learners register with name, email, and password, and log in each time. Progress is tracked as a percentage and sent to a Google Sheet that the Learning Hub can read.

**How it works for learners**
- **Actions unlock lessons.** Lesson 2 opens only after the learner marks the Lesson 1 action done (and so on). They can mark it done at the end of the lesson or later from the home screen, with an optional note about what happened.
- **Progress** counts every card plus every action (72 steps). 100% means all ten actions are done.
- **Reminder emails** go out daily at about 8am (see section 1).
- **Certificate of completion** appears on the home screen once all ten lessons and actions are done. Learners can print or save it as a PDF, or download it as an image.

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

Admin menu (in the Sheet): **Oversight admin > Reset a learner's password**, **Turn on daily reminder emails**, **Send reminders now (test)**.

### Reminder emails
1. In Apps Script, open **Project Settings** and set the **Time zone** to `Asia/Manila`.
2. Run `setupReminders` once (or use the menu item) and approve the email permission. This installs a daily trigger.
3. Who gets emails: learners who have not finished and have reminders on (their home screen has an on/off link; admins can edit the **Reminders** column in Users, Yes/No).
   - **Action reminders**: the day before the due date, on the due date, then every 3 days while past due (up to 15 days).
   - **Gentle nudge**: if there is no activity for 7 days, once a week (maximum 6).
   - At most one email per learner per day. Each email carries a short Scripture and a link to the tool (`SITE_URL` script property).
4. Gmail sends up to 100 emails a day on a free account, and about 1,500 on Google Workspace.

## 2. Hosting (GitHub Pages)

1. Create a repository, for example `rlccphil/pastoral-oversight`, and upload everything in this folder except `apps-script/` (that folder is harmless to include, but it is not needed on the site).
2. **Settings > Pages > Deploy from branch > main / (root)**.
3. Your link will be `https://rlccphil.github.io/pastoral-oversight/`.
4. If your repository name differs, replace `https://rlccphil.github.io/pastoral-oversight/` in the `og:url`, `og:image`, and `twitter:image` tags in `index.html`.
5. Social networks cache share previews. After changing `og-image.png`, refresh the cache with the Facebook Sharing Debugger.

## 3. Learning Hub

Progress is written to the **Progress** tab, one row per learner:

`Name, Email, Course, Percent, Lessons Completed, Total Lessons, Steps Done, Total Steps, Actions Committed, Actions Done, Started, Last Activity, Completed`

"Completed" is filled in when a learner reaches 100% (all cards and all ten actions done), which is also when the certificate becomes available.

Three ways to connect it:

1. **Same spreadsheet or IMPORTRANGE**: point the Hub at the Progress tab.
2. **Pull (JSON)**: `GET <web app URL>?action=hub&key=<HUB_KEY>` returns every learner's progress.
3. **Push**: set `HUB_WEBHOOK_URL` and the Hub receives `{source, course, courseName, name, email, percent, key}` whenever a percentage changes.

The **Responses** tab holds each learner's written reflections and action commitments (one row per card, updated in place).

## Editing lessons

Open `content.js`. Each lesson is a list of cards (`idea`, `scripture`, `list`, `compare`, `choice`, `sort`, `reflect`, `action`). The header comment explains each type. If you reorder or insert cards after people have started, give the card a fixed `key: "..."` so existing progress stays attached to it. The certificate shows Bong Baylon as signer; to change that, edit the two places marked `Bong Baylon` in `app.js`. After publishing changes, bump `VERSION` in `sw.js` so phones fetch the new files.

## Notes

- **Preview mode**: if `apiUrl` is empty, the tool runs locally (accounts and progress stay on that device). Useful for testing.
- Sessions last for the open browser tab (and at most 12 hours), so learners log in each time they return.
- Passwords are never stored: only a salted, stretched hash. Anyone with edit access to the Sheet can still read learners' names, emails, progress, and written responses, so restrict the Sheet's sharing.
- Scripture cards are paraphrases with references, so there is no translation licensing to manage.
