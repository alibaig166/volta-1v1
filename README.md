# Volta Showdown · NASCON '26

Live site for the NASCON '26 Volta Showdown, a 1v1 Volta football knockout: random draw, fixtures with tentative times, bracket, live scores, player search, stats, and Excel export.

Anyone with the link can view it. Organizers log in with a password to enter scores, set match times, add or import players, and redo the draw.

## What's in this zip

| File | What it does |
|---|---|
| `index.html` | The whole website, including the current players and draw |
| `state.js` | A small server function that saves the tournament (scores, times, players) so everyone sees the same thing. On GitHub it has to end up at `api/state.js` (step 1.6) |
| `package.json` | Tells Vercel this is a Node project (no packages to install) |
| `README.md` | These steps |

## 1. Put it on GitHub

1. Go to github.com → **New repository**.
2. Name it `volta-showdown`. Choose **Private**, since the page contains players' names. Don't add a README.
3. On the empty repo page, click **uploading an existing file**.
4. Drag in the 4 files: `index.html`, `state.js`, `package.json`, `README.md`.
5. Click **Commit changes**.
6. **Move `state.js` into an `api` folder.** Vercel only runs server code from there.
   - In the repo, click `state.js`, then the **pencil** (Edit) icon.
   - Click in the file name box at the top, put the cursor at the very start, and type `api/`. GitHub turns that into a folder, so the path reads `volta-showdown / api / state.js`.
   - Click **Commit changes**.

## 2. Deploy on Vercel

1. Go to vercel.com and sign in with GitHub.
2. **Add New → Project**, pick `volta-showdown`, then **Import**.
3. Framework preset: **Other**. Leave the build settings empty. Click **Deploy**.

The site is live now, but it can't save yet. Do these two steps next:

### 3. Add storage (free)

1. In the Vercel project, open the **Storage** tab.
2. Create a database with **Upstash for Redis** (free plan) and **connect it to this project**.
   Vercel adds the connection settings for you (`KV_REST_API_URL` and `KV_REST_API_TOKEN`).

### 4. Set the organizer password

1. Go to **Settings → Environment Variables**.
2. Add `ADMIN_PASSWORD` and set it to a password only you and your co-organizer know.
3. Go to **Deployments**, open the menu on the latest deployment, and click **Redeploy**. The new settings only apply after a redeploy.

## 5. Use it

- Open your `.vercel.app` link and tap **Organizer login** (top right). Enter the password.
- Your first save copies the players and draw into storage. After that, every change you or your co-organizer make shows up for everyone within about 10 seconds.
- If you and your co-organizer save at the same moment, the second save is refused and that person sees the latest version, so nothing gets silently overwritten.
- Share the plain link with players. They see everything but can't edit.

## Changing things later

- Edit `index.html` or `api/state.js` on GitHub and commit. Vercel redeploys automatically.
- Tournament data (scores, times, players) lives in Redis, not in the code, so redeploying never wipes results.
- To start completely fresh, delete the `volta-showdown:state` key in the Upstash dashboard.
