## WakeyTasky

A small AI-powered desktop task manager for ADHD, built with **Electron + Express + Prisma (SQLite)**.

### What’s in this repo

- **Desktop app**: Electron main process at `src/main/main.js` loading UI from `public/`
- **Local API server**: Express server at `src/server.js` (started automatically by the Electron app)
- **Database**: Prisma schema at `prisma/schema.prisma` using SQLite
- **AI task generation**: `POST /api/generate-task` backed by the OpenAI Node SDK

### Prerequisites

- Node.js + npm
- An OpenAI API key

### Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root (it’s already in `.gitignore`):

```bash
OPENAI_API_KEY="your_openai_api_key"
DATABASE_URL="file:./dev.db"
# Optional (defaults to 3000)
PORT=3000
```

Initialize the database schema:

```bash
npx prisma migrate deploy
```

### Run

- **Run the desktop app (starts Electron + the local API server)**:

```bash
npm start
```

- **Dev mode (Electron with auto-reload via nodemon)**:

```bash
npm run dev
```

- **Run only the API server (no Electron)**:

```bash
npm run server
```

### Database tools

- **Open Prisma Studio**:

```bash
npx prisma studio
```

### API (local)

The Express server serves on `http://localhost:3000` by default.

- `GET /api/ping`: health check
- `POST /api/generate-task`: generate and persist tasks from text
  - body: `{ "text": "..." , "userId": "optional" }`
- `GET /api/tasks`: list all tasks (includes subtasks)
- `GET /api/tasks/:id`: fetch one task (includes subtasks)
- `PATCH /api/tasks/:id/status`: update main task status (`PENDING|IN_PROGRESS|COMPLETED|CANCELLED`)
- `PATCH /api/subtasks/:id/status`: update subtask status
- `PATCH /api/subtasks/:id`: edit subtask title, description, or duration
- `DELETE /api/tasks/:id`: delete a task and its subtasks

### Repo layout

- `public/`: HTML/CSS/assets for the Electron renderer windows
- `src/main/`: Electron main process (window creation, IPC)
- `src/preload/`: Electron preload (`contextBridge`) exposing `window.api`
- `src/renderer/`: renderer-side JS for the UI
- `src/server.js`: Express API + static file server
- `services/`: API route handlers + AI prompt/model code
- `prisma/`: schema + migrations

### Troubleshooting

- **AI task generation reports “Missing OPENAI_API_KEY”**: add `OPENAI_API_KEY` to your `.env`.
- **Server exits after “Database connection failed”**: check `DATABASE_URL` points to a writable path (recommended `file:./prisma/dev.db`).
- **Port already in use**: set `PORT` in `.env` (and update any hard-coded clients if needed).

### License

GPL-3.0 (see `LICENSE`).
