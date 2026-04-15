# AI Image Analyzer (VisionLab)

Full‑stack app that analyzes an uploaded image using one or more AI providers (Gemini / OpenAI / DeepSeek via OpenRouter).  
Frontend: Vite + React. Backend: Node + Express.

## Requirements

- Node.js 18+ (recommended: latest LTS)
- API keys for any providers you want to use:
  - **Gemini**: `GEMINI_API_KEY`
  - **OpenAI**: `OPENAI_API_KEY`
  - **OpenRouter** (DeepSeek): `OPENROUTER_API_KEY`

## Repo structure

- `frontend/` – UI
- `backend/` – API server (`/api/*`)

## Local development (Windows / PowerShell)

### 1) Backend

```powershell
cd backend
npm install
Copy-Item ..\.env.example .\.env
notepad .\.env
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2) Frontend

```powershell
cd ..\frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` and proxies `/api` → `http://localhost:5000` in dev.

## Environment variables

### Backend (`backend/.env`)

Copy from `.env.example` (at repo root) and set any keys you need:

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `PORT` (default `5000`)
- `NODE_ENV` (`development` / `production`)

Note: the backend is resilient to missing keys; if a key is missing, that provider returns an error for that model instead of crashing the server.

### Frontend (hosted frontend only)

If you host the frontend separately from the backend, set:

- `VITE_API_BASE` = `https://YOUR_BACKEND_URL/api`

See `frontend/.env.example`.

## Deployment (Option B: host frontend + backend separately)

This is the recommended setup for GitHub users because it’s simple and works well with managed hosting.

### 1) Deploy the backend (Render / Railway / Fly / etc.)

- **Build command**:

```bash
npm install && npm run build
```

- **Start command**:

```bash
npm start
```

- **Set environment variables** on the hosting platform:
  - `GEMINI_API_KEY` / `OPENAI_API_KEY` / `OPENROUTER_API_KEY` (as needed)
  - `FRONTEND_ORIGIN` = your deployed frontend origin (example: `https://your-app.vercel.app`)
  - `NODE_ENV=production`
  - `PORT` is usually set automatically by the platform

### 2) Deploy the frontend (Vercel / Netlify)

- **Build command**:

```bash
npm install && npm run build
```

- **Output directory**: `dist`
- **Environment variable**:
  - `VITE_API_BASE` = `https://YOUR_BACKEND_URL/api`

## Security

- Never commit `.env`. It is already ignored in `.gitignore`.
- If an API key is ever pasted into chat or committed, **rotate/revoke it immediately** in the provider dashboard and replace it in your hosting environment.

