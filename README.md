# GitHub Repo Explorer

Search GitHub repositories by username and save your favorites. Fullstack TypeScript take-home project.

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | React 18, Vite, TanStack Query v5, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express, Prisma 5, PostgreSQL |
| Auth | JWT + bcrypt |
| Testing | Jest + ts-jest (backend), Vitest + Testing Library (frontend) |
| Structure | npm workspaces monorepo with shared types package |

## Prerequisites

- Node.js 18+
- PostgreSQL running locally

## Setup

**1. Clone and install**
```bash
git clone <repo-url> && cd github-explorer
npm install
```

**2. Create the database**
```bash
psql -U <your-pg-user> -c "CREATE DATABASE github_explorer;"
```

**3. Configure environment**
```bash
cp packages/backend/.env.example packages/backend/.env
# Edit DATABASE_URL and JWT_SECRET
```

**4. Run migrations**
```bash
cd packages/backend && npx prisma migrate dev
```

**5. Start dev servers** (two terminals)
```bash
npm run dev:backend   # http://localhost:3001
npm run dev:frontend  # http://localhost:5173
```

## Tests

```bash
npm run test
```

## API

### Auth (public)
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/register` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |

### Favorites (JWT required)
| Method | Path | Response |
|--------|------|----------|
| GET | `/user/favorites` | `Favorite[]` |
| POST | `/user/favorites` | `Favorite` |
| DELETE | `/user/favorites/:id` | `{ message }` |

## Tradeoffs

- **Shared types package** — `@github-explorer/shared` is imported by both frontend and backend, preventing API contract drift.
- **Favorites store a snapshot** — name, stars, language saved to DB so the Favorites page never needs an extra GitHub API call and survives repo renames/deletions.
- **JWT in localStorage** — simpler for a take-home. Production apps should use httpOnly cookies.
- **GitHub rate limits** — unauthenticated requests capped at 60/hr per IP. Set a `GITHUB_TOKEN` env var on the backend and pass it as a header to raise the limit to 5,000/hr.
