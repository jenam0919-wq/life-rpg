# Life RPG

Life RPG is a React/Vite frontend with an Express + SQLite backend. Users can
create quests, complete them for XP and gold, improve character attributes, and
spend gold on rewards. All quest, progression, inventory, and history queries
are scoped to the authenticated user.

## Requirements

- Node.js 18 or newer
- npm

## Local setup

From the project root:

```powershell
Copy-Item .env.example .env
npm install
Set-Location backend
npm install
Set-Location ..
```

Set a unique `JWT_SECRET` in `.env`. For production, use a randomly generated
secret of at least 32 characters and set `FRONTEND_URL` to the exact frontend
origin. Never commit `.env` or real credentials. A backend-only environment
template is available at `backend/.env.example`.

## Run

Start the API in one terminal:

```powershell
Set-Location backend
npm start
```

Start the Vite frontend in another terminal:

```powershell
npm run dev
```

The frontend runs on `http://localhost:5175` and proxies `/api` to the backend
on `http://localhost:5000`. The API health check is available at
`http://localhost:5000/api/health`.

## Production build

```powershell
npm run build
```

The generated `dist/` directory is a deployable static frontend bundle. Set
`VITE_API_URL` to the public API origin when the frontend and API are hosted on
different origins. Vercel uses `vercel.json` to fall back to `index.html` for
the protected client-side routes.

## Vercel and Render deployment

1. Create a Vercel project from this repository with the root directory set to
   the project root. The build command is `npm run build`, the output directory
   is `dist`, and define `VITE_API_URL` as the deployed Render API origin
   (for example, `https://life-rpg-api.onrender.com`, without `/api`).
2. Create a Render Web Service with its root directory set to `backend`.
   Render's build command is `npm install` and its start command is `npm start`.
   Define `JWT_SECRET` and `FRONTEND_URL` (the exact Vercel origin, including
   any custom domain). Render supplies `PORT`; the server listens on it.
3. Use `https://<render-service>/api/health` as the Render health-check path.

The backend currently uses SQLite at `backend/database/life-rpg.db`. Render's
default filesystem is ephemeral, so data can be lost on redeploys/restarts.
Attach a persistent Render disk for a single-instance deployment, or migrate
to a managed database before relying on production persistence.

## GitHub setup

The repository should include source files, package manifests, environment
examples, and documentation. Do not commit `.env` files, database files,
`node_modules`, build output, or runtime logs.

```powershell
git init
git add .
git status
git commit -m "Prepare Life RPG for deployment"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repository>.git
git push -u origin main
```

Review `git status` before committing and confirm that no credentials or
database files are staged.

## Production testing checklist

- Confirm `GET /api/health` returns a healthy response.
- Create an account and sign in from the deployed Vercel app.
- Create and complete a quest.
- Confirm XP, gold, level, streak, attributes, and quest history update.
- Refresh the browser and confirm data remains in SQLite storage.
- Purchase a reward and confirm inventory updates.
- Verify logout and sign-in again.
- Test protected routes and mobile layout.

## Routes

Frontend routes:

- Public: `/login`, `/signup`
- Protected: `/dashboard`, `/quests`, `/history`, `/character`, `/rewards`,
  `/profile`

Backend routes:

- `POST /api/auth/signup`, `POST /api/auth/login`
- Authenticated quest, character, and reward routes under
  `/api/quests`, `/api/character`, and `/api/rewards`
- `GET /api/health`

## Persistence and security

SQLite data is stored locally in `backend/database/life-rpg.db` and is created
and migrated automatically on backend startup. The database file is ignored by
Git because it contains local user data. Passwords are bcrypt-hashed and API
access uses expiring JWTs. Protected database reads and writes use the user ID
from the verified token rather than a client-supplied owner ID.
