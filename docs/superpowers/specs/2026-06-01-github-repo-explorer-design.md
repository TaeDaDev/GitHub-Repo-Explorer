# GitHub Repo Explorer — Design Spec
**Date:** 2026-06-01

## Overview

A fullstack TypeScript monorepo app that lets users search GitHub repositories by username and save favorites to their account. Auth is JWT-based. Data is persisted in PostgreSQL via Prisma.

**Stack:**
- Frontend: React + TypeScript + Vite + React Query + Tailwind CSS
- Backend: Node.js + Express + TypeScript + Prisma
- Database: PostgreSQL
- Auth: JWT + bcrypt
- Structure: npm workspaces monorepo with a shared types package

---

## Project Structure

```
github-explorer/
  package.json                    ← root workspace config
  packages/
    shared/                       ← shared TypeScript types & interfaces
      src/types.ts
      package.json
      tsconfig.json
    backend/
      src/
        routes/auth.ts            ← POST /auth/register, /auth/login
        routes/favorites.ts       ← GET/POST/DELETE /user/favorites
        middleware/auth.ts        ← JWT verification middleware
        lib/prisma.ts             ← Prisma client singleton
        index.ts                  ← app entry, mounts routes
      prisma/schema.prisma
      package.json
      tsconfig.json
    frontend/
      src/
        components/
          RepoCard.tsx
          RepoList.tsx
          SearchBar.tsx
          FavoriteButton.tsx
          AuthModal.tsx
        pages/
          Home.tsx
          Favorites.tsx
        hooks/
          useRepos.ts
          useFavorites.ts
          useAuth.ts
        lib/
          api.ts                  ← axios instance with JWT header
          auth.ts                 ← token storage helpers
        App.tsx
      package.json
      tsconfig.json
      vite.config.ts
      tailwind.config.ts
```

---

## Shared Types (`packages/shared/src/types.ts`)

Imported by both frontend and backend. Defined once, used everywhere.

```typescript
export interface GitHubRepo {
  id: number
  name: string
  description: string | null
  stargazers_count: number
  html_url: string
  language: string | null
  full_name: string
}

export interface Favorite {
  id: string
  userId: string
  githubRepoId: number
  name: string
  description: string | null
  stargazersCount: number
  htmlUrl: string
  language: string | null
  fullName: string
  createdAt: string
}

export interface RegisterRequest { email: string; password: string }
export interface LoginRequest { email: string; password: string }
export interface AuthResponse { token: string; user: { id: string; email: string } }

export interface ApiResponse<T> { data: T; message?: string }
export interface ApiError { error: string; statusCode: number }
```

---

## Database Schema (`packages/backend/prisma/schema.prisma`)

```prisma
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  password  String
  favorites Favorite[]
  createdAt DateTime   @default(now())
}

model Favorite {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  githubRepoId    Int
  name            String
  description     String?
  stargazersCount Int
  htmlUrl         String
  language        String?
  fullName        String
  createdAt       DateTime @default(now())

  @@unique([userId, githubRepoId])
}
```

`@@unique([userId, githubRepoId])` prevents duplicate favorites at the database level.

---

## Backend API

### Auth Routes (public)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/register` | `{ email, password }` | `AuthResponse` |
| POST | `/auth/login` | `{ email, password }` | `AuthResponse` |

- Passwords hashed with bcrypt at cost factor 12
- JWT signed with `process.env.JWT_SECRET`, 7-day expiry
- Returns `{ token, user: { id, email } }`

### User Routes (JWT protected)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/user/favorites` | — | `Favorite[]` |
| POST | `/user/favorites` | `GitHubRepo` fields | `Favorite` |
| DELETE | `/user/favorites/:id` | — | `{ message: string }` |

### JWT Middleware

- Reads `Authorization: Bearer <token>` header
- Verifies with `jsonwebtoken`
- Attaches `req.user = { id, email }` to request
- Returns `401` if missing or invalid

### Error Shape

All errors return consistent `ApiError`:
```typescript
res.status(statusCode).json({ error: 'Human-readable message', statusCode })
```

Status codes used: `400` validation, `401` unauthorized, `404` not found, `409` conflict (duplicate favorite), `500` server error.

---

## Frontend

### Pages

- **`Home.tsx`** — search bar + repo grid. Unauthenticated users can search; clicking Save opens the auth modal
- **`Favorites.tsx`** — protected route showing all saved repos for the logged-in user with Remove button

### Components

| Component | Responsibility |
|-----------|---------------|
| `SearchBar` | Controlled input + submit, fires username search |
| `RepoCard` | Displays name, description, stars, language, link, Save/Remove button |
| `RepoList` | Responsive grid of `RepoCard`s with loading skeleton and empty state |
| `FavoriteButton` | Save/unsave toggle, opens `AuthModal` if not logged in |
| `AuthModal` | Login + register forms in one modal, toggleable |

### Data Fetching (React Query)

```typescript
// useRepos.ts
useQuery(['repos', username], fetchGitHubRepos, {
  enabled: !!username,
  retry: false,
  staleTime: 5 * 60 * 1000
})

// useFavorites.ts
useQuery(['favorites'], getFavorites, { enabled: !!token })
useMutation(addFavorite, { onSuccess: () => queryClient.invalidateQueries(['favorites']) })
useMutation(removeFavorite, { onSuccess: () => queryClient.invalidateQueries(['favorites']) })
```

### Auth Hook (`useAuth`)

- Stores JWT in `localStorage`
- Exposes `login`, `register`, `logout`, `token`, `user`
- `api.ts` axios instance reads token from storage and sets `Authorization` header on every request

### UI States

- Loading skeleton while fetching repos
- "User not found" on GitHub 404
- "No repos found" empty state
- Error banner on network failure
- Optimistic favorite toggle (reverts on error)

### Responsive Layout

```
Mobile:  grid-cols-1
Tablet:  sm:grid-cols-2
Desktop: lg:grid-cols-3
```

---

## Notes & Tradeoffs

- **JWT in localStorage vs httpOnly cookie**: localStorage is simpler to implement for a take-home and avoids CORS/cookie complexity. For production, httpOnly cookies are more secure against XSS.
- **Storing repo data in DB**: Favorites store a snapshot of repo metadata (name, stars, etc.) rather than just the GitHub repo ID. This avoids an extra GitHub API call when rendering the Favorites page and means favorites survive if a repo is deleted/renamed on GitHub.
- **No refresh tokens**: JWT expiry is 7 days. Refresh token rotation is out of scope for this take-home.
- **GitHub API rate limits**: Unauthenticated requests to the GitHub API are limited to 60/hour per IP. Adding a GitHub token via env var would raise this to 5000/hour — worth noting in the README but not implementing here.
