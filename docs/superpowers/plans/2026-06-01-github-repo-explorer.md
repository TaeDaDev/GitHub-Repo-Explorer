# GitHub Repo Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullstack TypeScript monorepo app for searching GitHub repos and saving favorites, with JWT auth and PostgreSQL persistence.

**Architecture:** npm workspaces monorepo with three packages — `shared` (TypeScript interfaces), `backend` (Express + Prisma + JWT), `frontend` (React + Vite + React Query + Tailwind). Shared types are imported by both packages so interfaces are defined once.

**Tech Stack:** React 18, Vite, TanStack Query v5, Tailwind CSS, axios, React Router v6, Express, Prisma 5, PostgreSQL, bcrypt, jsonwebtoken, Jest + ts-jest (backend), Vitest + Testing Library (frontend)

---

## File Map

```
github-explorer/
  package.json                                      ← root workspace config
  tsconfig.base.json                                ← shared TS base config
  .gitignore
  README.md
  packages/
    shared/
      src/types.ts                                  ← all shared interfaces
      package.json
      tsconfig.json
    backend/
      prisma/schema.prisma                          ← User + Favorite models
      src/
        app.ts                                      ← Express app (exported for tests)
        index.ts                                    ← server entry (calls listen)
        lib/prisma.ts                               ← Prisma singleton
        middleware/auth.ts                          ← JWT verify middleware
        routes/auth.ts                              ← POST /auth/register, /auth/login
        routes/favorites.ts                         ← GET/POST/DELETE /user/favorites
        __tests__/
          middleware/auth.test.ts
          routes/auth.test.ts
          routes/favorites.test.ts
      jest.config.ts
      package.json
      tsconfig.json
      .env.example
    frontend/
      index.html
      src/
        main.tsx                                    ← React root mount
        index.css                                   ← Tailwind directives
        App.tsx                                     ← QueryClient + Router
        lib/
          auth.ts                                   ← localStorage token helpers
          api.ts                                    ← axios instance with JWT header
        hooks/
          useAuth.ts                                ← login/register/logout state
          useRepos.ts                               ← React Query: GitHub API
          useFavorites.ts                           ← React Query: favorites CRUD
        components/
          SearchBar.tsx
          RepoCard.tsx
          FavoriteButton.tsx
          AuthModal.tsx
          RepoList.tsx
        pages/
          Home.tsx
          Favorites.tsx
        test-setup.ts                               ← @testing-library/jest-dom import
        __tests__/
          components/SearchBar.test.tsx
          components/RepoCard.test.tsx
          components/RepoList.test.tsx
          pages/Home.test.tsx
      package.json
      tsconfig.json
      tsconfig.node.json
      vite.config.ts
      tailwind.config.ts
      postcss.config.cjs
```

---

## Task 1: Monorepo Root Scaffold

**Files:**
- Create: `github-explorer/package.json`
- Create: `github-explorer/tsconfig.base.json`
- Create: `github-explorer/.gitignore`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "github-explorer",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev:backend": "npm run dev --workspace=packages/backend",
    "dev:frontend": "npm run dev --workspace=packages/frontend",
    "test": "npm run test --workspaces --if-present",
    "build": "npm run build --workspaces --if-present"
  }
}
```

- [ ] **Step 2: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist"
  }
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.env
*.env.local
```

- [ ] **Step 4: Initialize git and make first commit**

```bash
cd /Users/cheftae/Desktop/GIthub
git init
git add package.json tsconfig.base.json .gitignore
git commit -m "feat: monorepo root scaffold"
```

---

## Task 2: Shared Types Package

**Files:**
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`

- [ ] **Step 1: Create packages/shared/package.json**

```json
{
  "name": "@github-explorer/shared",
  "version": "1.0.0",
  "main": "./src/types.ts",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "CommonJS"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create packages/shared/src/types.ts**

```typescript
// Shape returned by GET https://api.github.com/users/{username}/repos
export interface GitHubRepo {
  id: number
  name: string
  description: string | null
  stargazers_count: number
  html_url: string
  language: string | null
  full_name: string
}

// Stored favorite row from our database
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

// Auth request bodies
export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

// Auth success response
export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
  }
}

// Generic success envelope
export interface ApiResponse<T> {
  data: T
  message?: string
}

// Generic error shape - all backend errors use this
export interface ApiError {
  error: string
  statusCode: number
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared
git commit -m "feat: shared TypeScript types package"
```

---

## Task 3: Backend Project Scaffold

**Files:**
- Create: `packages/backend/package.json`
- Create: `packages/backend/tsconfig.json`
- Create: `packages/backend/jest.config.ts`
- Create: `packages/backend/.env.example`
- Create: `packages/backend/src/app.ts`
- Create: `packages/backend/src/index.ts`

- [ ] **Step 1: Create packages/backend/package.json**

```json
{
  "name": "@github-explorer/backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "@github-explorer/shared": "*",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/cors": "^2.8.0",
    "@types/express": "^4.17.0",
    "@types/jest": "^29.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/supertest": "^6.0.0",
    "jest": "^29.0.0",
    "prisma": "^5.0.0",
    "supertest": "^6.0.0",
    "ts-jest": "^29.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create packages/backend/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "CommonJS"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create packages/backend/jest.config.ts**

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // Resolve workspace package to local source during tests
    '^@github-explorer/shared(.*)$': '<rootDir>/../shared/src$1'
  }
}

export default config
```

- [ ] **Step 4: Create packages/backend/.env.example**

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/github_explorer"
JWT_SECRET="change-me-in-production"
PORT=3001
```

- [ ] **Step 5: Create packages/backend/src/app.ts**

The app is exported separately from `index.ts` so supertest can import it without starting the server.

```typescript
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { favoritesRouter } from './routes/favorites'

export const app = express()

// Allow Vite dev server origin in development
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.use('/auth', authRouter)
app.use('/user', favoritesRouter)
```

- [ ] **Step 6: Create packages/backend/src/index.ts**

```typescript
import { app } from './app'

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
```

- [ ] **Step 7: Install backend dependencies**

```bash
cd packages/backend
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/backend
git commit -m "feat: backend project scaffold with Express"
```

---

## Task 4: Prisma Schema and Database Setup

**Files:**
- Create: `packages/backend/prisma/schema.prisma`
- Create: `packages/backend/src/lib/prisma.ts`
- Create: `packages/backend/.env` (not committed)

**Prerequisite:** PostgreSQL must be running locally. Create a database named `github_explorer`:
```bash
psql -U postgres -c "CREATE DATABASE github_explorer;"
```

- [ ] **Step 1: Create packages/backend/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

  // Prevents a user from saving the same GitHub repo twice
  @@unique([userId, githubRepoId])
}
```

- [ ] **Step 2: Create packages/backend/.env**

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/github_explorer"
JWT_SECRET="dev-secret-change-in-prod"
PORT=3001
```

Adjust `USER:PASSWORD` to match your local Postgres credentials.

- [ ] **Step 3: Run Prisma migration**

```bash
cd packages/backend
npx prisma migrate dev --name init
```

Expected output:
```
✔ Generated Prisma Client
The following migration(s) have been created and applied:
migrations/
  └─ 20260601000000_init/
    └─ migration.sql
```

- [ ] **Step 4: Create packages/backend/src/lib/prisma.ts**

The `globalThis` trick prevents creating multiple Prisma connections during hot-reload in development.

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/backend/prisma packages/backend/src/lib/prisma.ts packages/backend/.env.example
git commit -m "feat: Prisma schema and database setup"
```

---

## Task 5: JWT Auth Middleware (TDD)

**Files:**
- Create: `packages/backend/src/middleware/auth.ts`
- Create: `packages/backend/src/__tests__/middleware/auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/backend/src/__tests__/middleware/auth.test.ts`:

```typescript
import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticate, AuthRequest } from '../../middleware/auth'

// Use a fixed secret for all middleware tests
process.env.JWT_SECRET = 'test-secret'

// Helper: create a minimal mock Response
const mockRes = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('authenticate middleware', () => {
  it('calls next() and attaches user when token is valid', () => {
    const token = jwt.sign({ id: 'user1', email: 'a@test.com' }, 'test-secret')
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest
    const res = mockRes()
    const next = jest.fn() as NextFunction

    authenticate(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(req.user).toEqual({ id: 'user1', email: 'a@test.com', iat: expect.any(Number) })
  })

  it('returns 401 when Authorization header is missing', () => {
    const req = { headers: {} } as AuthRequest
    const res = mockRes()
    const next = jest.fn() as NextFunction

    authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token is malformed', () => {
    const req = { headers: { authorization: 'Bearer bad-token' } } as AuthRequest
    const res = mockRes()
    const next = jest.fn() as NextFunction

    authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token is signed with wrong secret', () => {
    const token = jwt.sign({ id: 'user1', email: 'a@test.com' }, 'wrong-secret')
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest
    const res = mockRes()
    const next = jest.fn() as NextFunction

    authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/backend
npx jest src/__tests__/middleware/auth.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../middleware/auth'`

- [ ] **Step 3: Create packages/backend/src/middleware/auth.ts**

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extends Express Request so downstream route handlers can access req.user
export interface AuthRequest extends Request {
  user?: { id: string; email: string }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', statusCode: 401 })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token', statusCode: 401 })
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd packages/backend
npx jest src/__tests__/middleware/auth.test.ts --no-coverage
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add packages/backend/src/middleware/auth.ts packages/backend/src/__tests__/middleware/auth.test.ts
git commit -m "feat: JWT auth middleware with tests"
```

---

## Task 6: Auth Routes (TDD)

**Files:**
- Create: `packages/backend/src/routes/auth.ts`
- Create: `packages/backend/src/__tests__/routes/auth.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/backend/src/__tests__/routes/auth.test.ts`:

```typescript
import request from 'supertest'
import { app } from '../../app'

// Mock Prisma to avoid needing a real DB in unit tests
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}))

// Mock bcrypt so tests don't run slow hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pw'),
  compare: jest.fn()
}))

import { prisma } from '../../lib/prisma'
import bcrypt from 'bcrypt'

process.env.JWT_SECRET = 'test-secret'

const mockFindUnique = prisma.user.findUnique as jest.Mock
const mockCreate = prisma.user.create as jest.Mock
const mockCompare = bcrypt.compare as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe('POST /auth/register', () => {
  it('creates user and returns token + user', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: 'u1', email: 'a@test.com', password: 'hashed-pw', createdAt: new Date() })

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'a@test.com', password: 'secret123' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toEqual({ id: 'u1', email: 'a@test.com' })
  })

  it('returns 409 when email already registered', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing' })

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'a@test.com', password: 'secret123' })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Email already in use')
  })

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'a@test.com' })

    expect(res.status).toBe(400)
  })
})

describe('POST /auth/login', () => {
  it('returns token + user on valid credentials', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1', email: 'a@test.com', password: 'hashed-pw' })
    mockCompare.mockResolvedValue(true)

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'a@test.com', password: 'secret123' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe('a@test.com')
  })

  it('returns 401 when user not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'x' })

    expect(res.status).toBe(401)
  })

  it('returns 401 on wrong password', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1', email: 'a@test.com', password: 'hashed-pw' })
    mockCompare.mockResolvedValue(false)

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'a@test.com', password: 'wrong' })

    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/backend
npx jest src/__tests__/routes/auth.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../routes/auth'`

- [ ] **Step 3: Create packages/backend/src/routes/auth.ts**

```typescript
import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import type { RegisterRequest, LoginRequest, AuthResponse } from '@github-explorer/shared'

export const authRouter = Router()

authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as RegisterRequest

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required', statusCode: 400 })
    return
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'Email already in use', statusCode: 409 })
      return
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { email, password: hashed } })

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' })

    const body: AuthResponse = { token, user: { id: user.id, email: user.email } }
    res.status(201).json(body)
  } catch {
    res.status(500).json({ error: 'Internal server error', statusCode: 500 })
  }
})

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginRequest

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required', statusCode: 400 })
    return
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials', statusCode: 401 })
      return
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials', statusCode: 401 })
      return
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' })

    const body: AuthResponse = { token, user: { id: user.id, email: user.email } }
    res.status(200).json(body)
  } catch {
    res.status(500).json({ error: 'Internal server error', statusCode: 500 })
  }
})
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd packages/backend
npx jest src/__tests__/routes/auth.test.ts --no-coverage
```

Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add packages/backend/src/routes/auth.ts packages/backend/src/__tests__/routes/auth.test.ts
git commit -m "feat: auth routes (register + login) with tests"
```

---

## Task 7: Favorites Routes (TDD)

**Files:**
- Create: `packages/backend/src/routes/favorites.ts`
- Create: `packages/backend/src/__tests__/routes/favorites.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/backend/src/__tests__/routes/favorites.test.ts`:

```typescript
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../../app'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    favorite: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn()
    }
  }
}))

import { prisma } from '../../lib/prisma'

process.env.JWT_SECRET = 'test-secret'

// Generates a valid JWT for a test user
const validToken = jwt.sign({ id: 'user1', email: 'a@test.com' }, 'test-secret')
const authHeader = `Bearer ${validToken}`

const mockFindMany = prisma.favorite.findMany as jest.Mock
const mockCreate = prisma.favorite.create as jest.Mock
const mockFindUnique = prisma.favorite.findUnique as jest.Mock
const mockDelete = prisma.favorite.delete as jest.Mock

const fakeFavorite = {
  id: 'fav1',
  userId: 'user1',
  githubRepoId: 123,
  name: 'cool-repo',
  description: 'A repo',
  stargazersCount: 10,
  htmlUrl: 'https://github.com/u/cool-repo',
  language: 'TypeScript',
  fullName: 'u/cool-repo',
  createdAt: new Date().toISOString()
}

const fakeGitHubRepo = {
  id: 123,
  name: 'cool-repo',
  description: 'A repo',
  stargazers_count: 10,
  html_url: 'https://github.com/u/cool-repo',
  language: 'TypeScript',
  full_name: 'u/cool-repo'
}

beforeEach(() => jest.clearAllMocks())

describe('GET /user/favorites', () => {
  it('returns favorites for authenticated user', async () => {
    mockFindMany.mockResolvedValue([fakeFavorite])

    const res = await request(app)
      .get('/user/favorites')
      .set('Authorization', authHeader)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('cool-repo')
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/user/favorites')
    expect(res.status).toBe(401)
  })
})

describe('POST /user/favorites', () => {
  it('saves a repo and returns the favorite', async () => {
    mockCreate.mockResolvedValue(fakeFavorite)

    const res = await request(app)
      .post('/user/favorites')
      .set('Authorization', authHeader)
      .send(fakeGitHubRepo)

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('cool-repo')
  })

  it('returns 409 when repo already favorited', async () => {
    const err = new Error('Unique constraint failed')
    ;(err as any).code = 'P2002'
    mockCreate.mockRejectedValue(err)

    const res = await request(app)
      .post('/user/favorites')
      .set('Authorization', authHeader)
      .send(fakeGitHubRepo)

    expect(res.status).toBe(409)
  })

  it('returns 400 when body is missing required fields', async () => {
    const res = await request(app)
      .post('/user/favorites')
      .set('Authorization', authHeader)
      .send({ name: 'incomplete' })

    expect(res.status).toBe(400)
  })
})

describe('DELETE /user/favorites/:id', () => {
  it('deletes the favorite and returns message', async () => {
    mockFindUnique.mockResolvedValue(fakeFavorite)
    mockDelete.mockResolvedValue(fakeFavorite)

    const res = await request(app)
      .delete('/user/favorites/fav1')
      .set('Authorization', authHeader)

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Favorite removed')
  })

  it('returns 404 when favorite does not belong to user', async () => {
    mockFindUnique.mockResolvedValue({ ...fakeFavorite, userId: 'other-user' })

    const res = await request(app)
      .delete('/user/favorites/fav1')
      .set('Authorization', authHeader)

    expect(res.status).toBe(404)
  })

  it('returns 404 when favorite not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await request(app)
      .delete('/user/favorites/fav1')
      .set('Authorization', authHeader)

    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/backend
npx jest src/__tests__/routes/favorites.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../routes/favorites'`

- [ ] **Step 3: Create packages/backend/src/routes/favorites.ts**

```typescript
import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import type { GitHubRepo } from '@github-explorer/shared'

export const favoritesRouter = Router()

// All /user routes require a valid JWT
favoritesRouter.use(authenticate)

favoritesRouter.get('/favorites', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(favorites)
  } catch {
    res.status(500).json({ error: 'Internal server error', statusCode: 500 })
  }
})

favoritesRouter.post('/favorites', async (req: AuthRequest, res: Response): Promise<void> => {
  const repo = req.body as GitHubRepo

  if (!repo.id || !repo.name || !repo.html_url) {
    res.status(400).json({ error: 'Invalid repo data', statusCode: 400 })
    return
  }

  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user!.id,
        githubRepoId: repo.id,
        name: repo.name,
        description: repo.description ?? null,
        stargazersCount: repo.stargazers_count,
        htmlUrl: repo.html_url,
        language: repo.language ?? null,
        fullName: repo.full_name
      }
    })
    res.status(201).json(favorite)
  } catch (err: unknown) {
    // Prisma unique constraint violation = repo already in favorites
    if ((err as any).code === 'P2002') {
      res.status(409).json({ error: 'Repo already in favorites', statusCode: 409 })
      return
    }
    res.status(500).json({ error: 'Internal server error', statusCode: 500 })
  }
})

favoritesRouter.delete('/favorites/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params

  try {
    const favorite = await prisma.favorite.findUnique({ where: { id } })

    if (!favorite || favorite.userId !== req.user!.id) {
      res.status(404).json({ error: 'Favorite not found', statusCode: 404 })
      return
    }

    await prisma.favorite.delete({ where: { id } })
    res.json({ message: 'Favorite removed' })
  } catch {
    res.status(500).json({ error: 'Internal server error', statusCode: 500 })
  }
})
```

- [ ] **Step 4: Run all backend tests**

```bash
cd packages/backend
npx jest --no-coverage
```

Expected: PASS — 16 tests passing across 3 suites

- [ ] **Step 5: Commit**

```bash
git add packages/backend/src/routes/favorites.ts packages/backend/src/__tests__/routes/favorites.test.ts
git commit -m "feat: favorites routes (GET/POST/DELETE) with tests"
```

---

## Task 8: Frontend Project Scaffold

**Files:**
- Create: `packages/frontend/package.json`
- Create: `packages/frontend/tsconfig.json`
- Create: `packages/frontend/tsconfig.node.json`
- Create: `packages/frontend/vite.config.ts`
- Create: `packages/frontend/tailwind.config.ts`
- Create: `packages/frontend/postcss.config.cjs`
- Create: `packages/frontend/index.html`
- Create: `packages/frontend/src/main.tsx`
- Create: `packages/frontend/src/index.css`
- Create: `packages/frontend/src/test-setup.ts`
- Create: `packages/frontend/src/App.tsx` (placeholder until Task 17)

- [ ] **Step 1: Create packages/frontend/package.json**

```json
{
  "name": "@github-explorer/frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@github-explorer/shared": "*",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.400.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "jsdom": "^24.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.0",
    "vite": "^5.1.0",
    "vitest": "^1.3.0"
  }
}
```

- [ ] **Step 2: Create packages/frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create packages/frontend/tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "tailwind.config.ts"]
}
```

- [ ] **Step 4: Create packages/frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Proxy API calls to backend during development so the browser never
  // sends requests cross-origin and avoids CORS issues in dev
  server: {
    proxy: {
      '/auth': 'http://localhost:3001',
      '/user': 'http://localhost:3001'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts'
  }
})
```

- [ ] **Step 5: Create packages/frontend/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config
```

- [ ] **Step 6: Create packages/frontend/postcss.config.cjs**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

- [ ] **Step 7: Create packages/frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GitHub Repo Explorer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create packages/frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create packages/frontend/src/test-setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 10: Create packages/frontend/src/App.tsx (placeholder)**

```typescript
import React from 'react'

export const App: React.FC = () => {
  return <div>Loading...</div>
}
```

- [ ] **Step 11: Create packages/frontend/src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 12: Install frontend dependencies**

```bash
cd packages/frontend
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 13: Verify Vite starts**

```bash
cd packages/frontend
npm run dev
```

Expected: `Local: http://localhost:5173/` — visit in browser and see "Loading...". Stop the server with Ctrl+C.

- [ ] **Step 14: Commit**

```bash
git add packages/frontend
git commit -m "feat: frontend scaffold with Vite, Tailwind, React Query"
```

---

## Task 9: Auth Library and useAuth Hook

**Files:**
- Create: `packages/frontend/src/lib/auth.ts`
- Create: `packages/frontend/src/hooks/useAuth.ts`

No tests for `auth.ts` (pure localStorage helpers). `useAuth` is tested via component tests in later tasks.

- [ ] **Step 1: Create packages/frontend/src/lib/auth.ts**

```typescript
// Keys used in localStorage for persisting session
const TOKEN_KEY = 'gh_explorer_token'
const USER_KEY = 'gh_explorer_user'

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)

export const getUser = (): { id: string; email: string } | null => {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as { id: string; email: string }) : null
}

export const setUser = (user: { id: string; email: string }): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
```

- [ ] **Step 2: Create packages/frontend/src/hooks/useAuth.ts**

```typescript
import { useState, useCallback } from 'react'
import axios from 'axios'
import { getToken, setToken, getUser, setUser, clearAuth } from '../lib/auth'
import type { LoginRequest, RegisterRequest, AuthResponse } from '@github-explorer/shared'

export const useAuth = () => {
  const [token, setTokenState] = useState<string | null>(getToken)
  const [user, setUserState] = useState(getUser)

  const login = useCallback(async (data: LoginRequest) => {
    const res = await axios.post<AuthResponse>('/auth/login', data)
    setToken(res.data.token)
    setUser(res.data.user)
    setTokenState(res.data.token)
    setUserState(res.data.user)
    return res.data
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await axios.post<AuthResponse>('/auth/register', data)
    setToken(res.data.token)
    setUser(res.data.user)
    setTokenState(res.data.token)
    setUserState(res.data.user)
    return res.data
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setTokenState(null)
    setUserState(null)
  }, [])

  return { token, user, login, register, logout, isAuthenticated: !!token }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/lib/auth.ts packages/frontend/src/hooks/useAuth.ts
git commit -m "feat: auth token helpers and useAuth hook"
```

---

## Task 10: API Client

**Files:**
- Create: `packages/frontend/src/lib/api.ts`

- [ ] **Step 1: Create packages/frontend/src/lib/api.ts**

```typescript
import axios from 'axios'
import { getToken } from './auth'

// Axios instance for all backend API calls.
// Reads the JWT from localStorage on each request so token updates
// are picked up immediately without recreating the instance.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

- [ ] **Step 2: Commit**

```bash
git add packages/frontend/src/lib/api.ts
git commit -m "feat: axios API client with JWT interceptor"
```

---

## Task 11: useRepos Hook (TDD)

**Files:**
- Create: `packages/frontend/src/hooks/useRepos.ts`
- Create: `packages/frontend/src/__tests__/hooks/useRepos.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/src/__tests__/hooks/useRepos.test.tsx`:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import axios from 'axios'
import { useRepos } from '../../hooks/useRepos'
import type { GitHubRepo } from '@github-explorer/shared'

vi.mock('axios')
const mockAxios = axios as unknown as { get: ReturnType<typeof vi.fn> }

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

const fakeRepos: GitHubRepo[] = [
  { id: 1, name: 'repo1', description: null, stargazers_count: 5, html_url: 'https://github.com/u/repo1', language: 'TS', full_name: 'u/repo1' }
]

describe('useRepos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns repos on success', async () => {
    mockAxios.get = vi.fn().mockResolvedValue({ data: fakeRepos })

    const { result } = renderHook(() => useRepos('testuser'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fakeRepos)
  })

  it('does not fetch when username is empty', () => {
    mockAxios.get = vi.fn()

    renderHook(() => useRepos(''), { wrapper })

    expect(mockAxios.get).not.toHaveBeenCalled()
  })

  it('sets error on failed fetch', async () => {
    mockAxios.get = vi.fn().mockRejectedValue(new Error('Not Found'))

    const { result } = renderHook(() => useRepos('nobody'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/frontend
npx vitest run src/__tests__/hooks/useRepos.test.tsx
```

Expected: FAIL — `Cannot find module '../../hooks/useRepos'`

- [ ] **Step 3: Create packages/frontend/src/hooks/useRepos.ts**

```typescript
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { GitHubRepo } from '@github-explorer/shared'

const fetchRepos = async (username: string): Promise<GitHubRepo[]> => {
  const res = await axios.get<GitHubRepo[]>(
    `https://api.github.com/users/${username}/repos`,
    { params: { sort: 'updated', per_page: 30 } }
  )
  return res.data
}

export const useRepos = (username: string) => {
  return useQuery({
    queryKey: ['repos', username],
    queryFn: () => fetchRepos(username),
    enabled: !!username,
    retry: false,
    staleTime: 5 * 60 * 1000  // cache for 5 minutes
  })
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd packages/frontend
npx vitest run src/__tests__/hooks/useRepos.test.tsx
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/hooks/useRepos.ts packages/frontend/src/__tests__/hooks/useRepos.test.tsx
git commit -m "feat: useRepos hook with tests"
```

---

## Task 12: useFavorites Hook (TDD)

**Files:**
- Create: `packages/frontend/src/hooks/useFavorites.ts`
- Create: `packages/frontend/src/__tests__/hooks/useFavorites.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/src/__tests__/hooks/useFavorites.test.tsx`:

```typescript
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { useFavorites } from '../../hooks/useFavorites'
import type { Favorite } from '@github-explorer/shared'

// Mock the api module so no real HTTP calls are made
vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}))

import { api } from '../../lib/api'
const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

const fakeFav: Favorite = {
  id: 'fav1', userId: 'u1', githubRepoId: 1, name: 'repo1',
  description: null, stargazersCount: 5, htmlUrl: 'https://github.com/u/repo1',
  language: 'TS', fullName: 'u/repo1', createdAt: new Date().toISOString()
}

describe('useFavorites', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches favorites when token provided', async () => {
    mockApi.get = vi.fn().mockResolvedValue({ data: [fakeFav] })

    const { result } = renderHook(() => useFavorites('some-token'), { wrapper })

    await waitFor(() => expect(result.current.favorites).toHaveLength(1))
    expect(result.current.favorites[0].name).toBe('repo1')
  })

  it('does not fetch when token is null', () => {
    mockApi.get = vi.fn()

    renderHook(() => useFavorites(null), { wrapper })

    expect(mockApi.get).not.toHaveBeenCalled()
  })

  it('isFavorited returns the favorite id when repo is saved', async () => {
    mockApi.get = vi.fn().mockResolvedValue({ data: [fakeFav] })

    const { result } = renderHook(() => useFavorites('token'), { wrapper })

    await waitFor(() => expect(result.current.favorites).toHaveLength(1))
    expect(result.current.isFavorited(1)).toBe('fav1')
    expect(result.current.isFavorited(999)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/frontend
npx vitest run src/__tests__/hooks/useFavorites.test.tsx
```

Expected: FAIL — `Cannot find module '../../hooks/useFavorites'`

- [ ] **Step 3: Create packages/frontend/src/hooks/useFavorites.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Favorite, GitHubRepo } from '@github-explorer/shared'

const getFavorites = async (): Promise<Favorite[]> => {
  const res = await api.get<Favorite[]>('/user/favorites')
  return res.data
}

const addFavorite = async (repo: GitHubRepo): Promise<Favorite> => {
  const res = await api.post<Favorite>('/user/favorites', repo)
  return res.data
}

const removeFavorite = async (id: string): Promise<void> => {
  await api.delete(`/user/favorites/${id}`)
}

export const useFavorites = (token: string | null) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: !!token
  })

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] })
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] })
  })

  // Returns the stored favorite id if the GitHub repo is already saved
  const isFavorited = (githubRepoId: number): string | undefined =>
    query.data?.find((f) => f.githubRepoId === githubRepoId)?.id

  return {
    favorites: query.data ?? [],
    isLoading: query.isLoading,
    addFavorite: addMutation.mutate,
    removeFavorite: removeMutation.mutate,
    isFavorited
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd packages/frontend
npx vitest run src/__tests__/hooks/useFavorites.test.tsx
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/hooks/useFavorites.ts packages/frontend/src/__tests__/hooks/useFavorites.test.tsx
git commit -m "feat: useFavorites hook with tests"
```

---

## Task 13: SearchBar Component (TDD)

**Files:**
- Create: `packages/frontend/src/components/SearchBar.tsx`
- Create: `packages/frontend/src/__tests__/components/SearchBar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/src/__tests__/components/SearchBar.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchBar } from '../../components/SearchBar'

describe('SearchBar', () => {
  it('calls onSearch with trimmed username on submit', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} isLoading={false} />)

    fireEvent.change(screen.getByPlaceholderText('Enter GitHub username...'), {
      target: { value: '  torvalds  ' }
    })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(onSearch).toHaveBeenCalledWith('torvalds')
  })

  it('disables submit button while loading', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('disables submit button when input is empty', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onSearch on empty submit', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} isLoading={false} />)

    fireEvent.submit(screen.getByRole('form'))

    expect(onSearch).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/frontend
npx vitest run src/__tests__/components/SearchBar.test.tsx
```

Expected: FAIL — `Cannot find module '../../components/SearchBar'`

- [ ] **Step 3: Create packages/frontend/src/components/SearchBar.tsx**

```typescript
import React, { useState } from 'react'

interface Props {
  onSearch: (username: string) => void
  isLoading: boolean
}

export const SearchBar: React.FC<Props> = ({ onSearch, isLoading }) => {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSearch(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} aria-label="search" className="flex gap-2 w-full max-w-xl mx-auto">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter GitHub username..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd packages/frontend
npx vitest run src/__tests__/components/SearchBar.test.tsx
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/components/SearchBar.tsx packages/frontend/src/__tests__/components/SearchBar.test.tsx
git commit -m "feat: SearchBar component with tests"
```

---

## Task 14: FavoriteButton and RepoCard Components (TDD)

**Files:**
- Create: `packages/frontend/src/components/FavoriteButton.tsx`
- Create: `packages/frontend/src/components/RepoCard.tsx`
- Create: `packages/frontend/src/__tests__/components/RepoCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/src/__tests__/components/RepoCard.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RepoCard } from '../../components/RepoCard'
import type { GitHubRepo } from '@github-explorer/shared'

const mockRepo: GitHubRepo = {
  id: 1,
  name: 'cool-repo',
  description: 'Does cool things',
  stargazers_count: 42,
  html_url: 'https://github.com/user/cool-repo',
  language: 'TypeScript',
  full_name: 'user/cool-repo'
}

describe('RepoCard', () => {
  it('renders repo name, description, stars, and language', () => {
    render(
      <RepoCard repo={mockRepo} onSave={vi.fn()} onRemove={vi.fn()} isAuthenticated={true} onAuthRequired={vi.fn()} />
    )
    expect(screen.getByText('cool-repo')).toBeInTheDocument()
    expect(screen.getByText('Does cool things')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('calls onSave with the repo when authenticated user clicks save', () => {
    const onSave = vi.fn()
    render(
      <RepoCard repo={mockRepo} onSave={onSave} onRemove={vi.fn()} isAuthenticated={true} onAuthRequired={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: /save to favorites/i }))
    expect(onSave).toHaveBeenCalledWith(mockRepo)
  })

  it('calls onAuthRequired instead of onSave when not authenticated', () => {
    const onSave = vi.fn()
    const onAuthRequired = vi.fn()
    render(
      <RepoCard repo={mockRepo} onSave={onSave} onRemove={vi.fn()} isAuthenticated={false} onAuthRequired={onAuthRequired} />
    )
    fireEvent.click(screen.getByRole('button', { name: /save to favorites/i }))
    expect(onAuthRequired).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onRemove with favoriteId when already favorited', () => {
    const onRemove = vi.fn()
    render(
      <RepoCard repo={mockRepo} favoriteId="fav1" onSave={vi.fn()} onRemove={onRemove} isAuthenticated={true} onAuthRequired={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: /remove from favorites/i }))
    expect(onRemove).toHaveBeenCalledWith('fav1')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/frontend
npx vitest run src/__tests__/components/RepoCard.test.tsx
```

Expected: FAIL — `Cannot find module '../../components/RepoCard'`

- [ ] **Step 3: Create packages/frontend/src/components/FavoriteButton.tsx**

```typescript
import React from 'react'
import { Heart } from 'lucide-react'

interface Props {
  isFavorited: boolean
  onSave: () => void
  onRemove: () => void
}

export const FavoriteButton: React.FC<Props> = ({ isFavorited, onSave, onRemove }) => (
  <button
    onClick={isFavorited ? onRemove : onSave}
    aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
    className={`p-1.5 rounded-full transition-colors ${
      isFavorited
        ? 'text-red-500 hover:bg-red-50'
        : 'text-gray-400 hover:text-red-400 hover:bg-gray-50'
    }`}
  >
    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
  </button>
)
```

- [ ] **Step 4: Create packages/frontend/src/components/RepoCard.tsx**

```typescript
import React from 'react'
import { Star, ExternalLink } from 'lucide-react'
import type { GitHubRepo } from '@github-explorer/shared'
import { FavoriteButton } from './FavoriteButton'

interface Props {
  repo: GitHubRepo
  favoriteId?: string
  onSave: (repo: GitHubRepo) => void
  onRemove: (id: string) => void
  isAuthenticated: boolean
  onAuthRequired: () => void
}

export const RepoCard: React.FC<Props> = ({
  repo, favoriteId, onSave, onRemove, isAuthenticated, onAuthRequired
}) => (
  <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
    <div className="flex items-start justify-between gap-2">
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-blue-600 hover:underline flex items-center gap-1 min-w-0"
      >
        <span className="truncate">{repo.name}</span>
        <ExternalLink className="w-3 h-3 shrink-0" />
      </a>
      <FavoriteButton
        isFavorited={!!favoriteId}
        onSave={() => (isAuthenticated ? onSave(repo) : onAuthRequired())}
        onRemove={() => favoriteId && onRemove(favoriteId)}
      />
    </div>
    {repo.description && (
      <p className="text-sm text-gray-600 line-clamp-2">{repo.description}</p>
    )}
    <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
      {repo.language && (
        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{repo.language}</span>
      )}
      <span className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5" />
        {repo.stargazers_count.toLocaleString()}
      </span>
    </div>
  </div>
)
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
cd packages/frontend
npx vitest run src/__tests__/components/RepoCard.test.tsx
```

Expected: PASS — 4 tests passing

- [ ] **Step 6: Commit**

```bash
git add packages/frontend/src/components/FavoriteButton.tsx packages/frontend/src/components/RepoCard.tsx packages/frontend/src/__tests__/components/RepoCard.test.tsx
git commit -m "feat: FavoriteButton and RepoCard components with tests"
```

---

## Task 15: AuthModal Component

**Files:**
- Create: `packages/frontend/src/components/AuthModal.tsx`

No dedicated test file — the modal is exercised in the Home page integration test in Task 17.

- [ ] **Step 1: Create packages/frontend/src/components/AuthModal.tsx**

```typescript
import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { LoginRequest, RegisterRequest } from '@github-explorer/shared'

interface Props {
  isOpen: boolean
  onClose: () => void
  onLogin: (data: LoginRequest) => Promise<void>
  onRegister: (data: RegisterRequest) => Promise<void>
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      if (mode === 'login') {
        await onLogin({ email, password })
      } else {
        await onRegister({ email, password })
      }
      onClose()
    } catch (err: unknown) {
      setError((err as any).response?.data?.error ?? 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Modal — stops click propagation so clicking inside doesn't close */}
      <div
        className="relative bg-white rounded-xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">
          {mode === 'login' ? 'Log In' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-center mt-3 text-gray-600">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            className="text-blue-600 hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/frontend/src/components/AuthModal.tsx
git commit -m "feat: AuthModal component (login + register)"
```

---

## Task 16: RepoList Component (TDD)

**Files:**
- Create: `packages/frontend/src/components/RepoList.tsx`
- Create: `packages/frontend/src/__tests__/components/RepoList.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/src/__tests__/components/RepoList.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RepoList } from '../../components/RepoList'
import type { GitHubRepo } from '@github-explorer/shared'

const fakeRepos: GitHubRepo[] = [
  { id: 1, name: 'repo-a', description: 'Desc A', stargazers_count: 10, html_url: 'https://github.com/u/a', language: 'Go', full_name: 'u/a' },
  { id: 2, name: 'repo-b', description: null, stargazers_count: 0, html_url: 'https://github.com/u/b', language: null, full_name: 'u/b' }
]

const defaultProps = {
  repos: fakeRepos,
  isLoading: false,
  error: null,
  username: 'testuser',
  getFavoriteId: () => undefined,
  onSave: vi.fn(),
  onRemove: vi.fn(),
  isAuthenticated: false,
  onAuthRequired: vi.fn()
}

describe('RepoList', () => {
  it('renders a card for each repo', () => {
    render(<RepoList {...defaultProps} />)
    expect(screen.getByText('repo-a')).toBeInTheDocument()
    expect(screen.getByText('repo-b')).toBeInTheDocument()
  })

  it('shows loading skeletons when isLoading is true', () => {
    render(<RepoList {...defaultProps} repos={[]} isLoading={true} />)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6)
  })

  it('shows not found message on 404 error', () => {
    const err = Object.assign(new Error('Not found'), { response: { status: 404 } })
    render(<RepoList {...defaultProps} repos={[]} error={err} />)
    expect(screen.getByText(/testuser.*not found/i)).toBeInTheDocument()
  })

  it('shows generic error message on non-404 error', () => {
    const err = new Error('Network error')
    render(<RepoList {...defaultProps} repos={[]} error={err} />)
    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument()
  })

  it('shows empty state when user has no repos', () => {
    render(<RepoList {...defaultProps} repos={[]} />)
    expect(screen.getByText(/no public repositories/i)).toBeInTheDocument()
  })

  it('renders nothing when username is empty', () => {
    const { container } = render(<RepoList {...defaultProps} username="" repos={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/frontend
npx vitest run src/__tests__/components/RepoList.test.tsx
```

Expected: FAIL — `Cannot find module '../../components/RepoList'`

- [ ] **Step 3: Create packages/frontend/src/components/RepoList.tsx**

```typescript
import React from 'react'
import type { GitHubRepo } from '@github-explorer/shared'
import { RepoCard } from './RepoCard'

interface Props {
  repos: GitHubRepo[]
  isLoading: boolean
  error: Error | null
  username: string
  getFavoriteId: (repoId: number) => string | undefined
  onSave: (repo: GitHubRepo) => void
  onRemove: (id: string) => void
  isAuthenticated: boolean
  onAuthRequired: () => void
}

export const RepoList: React.FC<Props> = ({
  repos, isLoading, error, username, getFavoriteId, onSave, onRemove, isAuthenticated, onAuthRequired
}) => {
  if (!username) return null

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} data-testid="skeleton" className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    const is404 = (error as any).response?.status === 404
    const message = is404
      ? `User "${username}" not found on GitHub`
      : 'Failed to fetch repositories. Please try again.'
    return <p className="text-center text-red-500 py-8">{message}</p>
  }

  if (repos.length === 0) {
    return <p className="text-center text-gray-500 py-8">{username} has no public repositories.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {repos.map((repo) => (
        <RepoCard
          key={repo.id}
          repo={repo}
          favoriteId={getFavoriteId(repo.id)}
          onSave={onSave}
          onRemove={onRemove}
          isAuthenticated={isAuthenticated}
          onAuthRequired={onAuthRequired}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd packages/frontend
npx vitest run src/__tests__/components/RepoList.test.tsx
```

Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/components/RepoList.tsx packages/frontend/src/__tests__/components/RepoList.test.tsx
git commit -m "feat: RepoList component with tests"
```

---

## Task 17: Home Page

**Files:**
- Create: `packages/frontend/src/pages/Home.tsx`
- Create: `packages/frontend/src/__tests__/pages/Home.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/src/__tests__/pages/Home.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import { Home } from '../../pages/Home'

// Mock all hooks so Home renders in isolation
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    token: null,
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false
  })
}))

vi.mock('../../hooks/useRepos', () => ({
  useRepos: () => ({ data: [], isLoading: false, error: null })
}))

vi.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: [],
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    isFavorited: () => undefined
  })
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

describe('Home page', () => {
  it('renders the page header and search bar', () => {
    render(<Home />, { wrapper })
    expect(screen.getByText('GitHub Repo Explorer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter GitHub username...')).toBeInTheDocument()
  })

  it('shows Log in button when not authenticated', () => {
    render(<Home />, { wrapper })
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('opens auth modal when Log in button is clicked', async () => {
    render(<Home />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/frontend
npx vitest run src/__tests__/pages/Home.test.tsx
```

Expected: FAIL — `Cannot find module '../../pages/Home'`

- [ ] **Step 3: Create packages/frontend/src/pages/Home.tsx**

```typescript
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { RepoList } from '../components/RepoList'
import { AuthModal } from '../components/AuthModal'
import { useRepos } from '../hooks/useRepos'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../hooks/useAuth'

export const Home: React.FC = () => {
  const [username, setUsername] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const { token, user, login, register, logout, isAuthenticated } = useAuth()
  const { data: repos = [], isLoading, error } = useRepos(username)
  const { isFavorited, addFavorite, removeFavorite } = useFavorites(token)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">GitHub Repo Explorer</h1>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/favorites"
                  className="text-sm text-blue-600 hover:underline"
                >
                  My Favorites
                </Link>
                <span className="text-sm text-gray-500">{user?.email}</span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <SearchBar onSearch={setUsername} isLoading={isLoading} />
        <RepoList
          repos={repos}
          isLoading={isLoading}
          error={error as Error | null}
          username={username}
          getFavoriteId={isFavorited}
          onSave={addFavorite}
          onRemove={removeFavorite}
          isAuthenticated={isAuthenticated}
          onAuthRequired={() => setShowAuth(true)}
        />
      </main>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onLogin={login}
        onRegister={register}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd packages/frontend
npx vitest run src/__tests__/pages/Home.test.tsx
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/pages/Home.tsx packages/frontend/src/__tests__/pages/Home.test.tsx
git commit -m "feat: Home page with search and favorites integration"
```

---

## Task 18: Favorites Page

**Files:**
- Create: `packages/frontend/src/pages/Favorites.tsx`

- [ ] **Step 1: Create packages/frontend/src/pages/Favorites.tsx**

```typescript
import React from 'react'
import { Link } from 'react-router-dom'
import { Star, ExternalLink, Trash2 } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../hooks/useAuth'
import type { Favorite } from '@github-explorer/shared'

export const Favorites: React.FC = () => {
  const { token, user, logout } = useAuth()
  const { favorites, isLoading, removeFavorite } = useFavorites(token)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Please{' '}
          <Link to="/" className="text-blue-600 hover:underline">
            log in
          </Link>{' '}
          to view your favorites.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
            GitHub Repo Explorer
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Favorites</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-gray-500">
            No favorites yet.{' '}
            <Link to="/" className="text-blue-600 hover:underline">
              Search for repos
            </Link>{' '}
            to save some.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav: Favorite) => (
              <div key={fav.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={fav.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-1 min-w-0"
                  >
                    <span className="truncate">{fav.name}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <button
                    onClick={() => removeFavorite(fav.id)}
                    aria-label="Remove favorite"
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {fav.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{fav.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
                  {fav.language && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{fav.language}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    {fav.stargazersCount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/frontend/src/pages/Favorites.tsx
git commit -m "feat: Favorites page"
```

---

## Task 19: App Routing — Wire Everything Together

**Files:**
- Modify: `packages/frontend/src/App.tsx`

- [ ] **Step 1: Replace placeholder App.tsx with full app**

```typescript
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Home } from './pages/Home'
import { Favorites } from './pages/Favorites'

// Single QueryClient for the entire app — shared cache between Home and Favorites
const queryClient = new QueryClient()

export const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorites />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
)
```

- [ ] **Step 2: Start both servers and verify the app works end-to-end**

Terminal 1 — backend:
```bash
cd packages/backend
npm run dev
```
Expected: `Backend running on http://localhost:3001`

Terminal 2 — frontend:
```bash
cd packages/frontend
npm run dev
```
Expected: `Local: http://localhost:5173/`

Manual verification checklist:
- [ ] Visit `http://localhost:5173` — search bar and header render
- [ ] Search for `torvalds` — repos load and display
- [ ] Search for `xyznotarealusername99999` — "not found" message shows
- [ ] Click "Log in" — modal opens, can toggle to Sign Up
- [ ] Register a new account — modal closes, email shown in header
- [ ] Click Save on a repo — favorites saved, heart turns red
- [ ] Navigate to `/favorites` — saved repo appears
- [ ] Click trash icon — repo removed
- [ ] Log out — header returns to "Log in" button

- [ ] **Step 3: Run all tests one final time**

```bash
# From repo root
cd packages/backend && npx jest --no-coverage
cd ../frontend && npx vitest run
```

Expected: all tests pass in both packages.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/App.tsx
git commit -m "feat: wire up routing and QueryClient provider"
```

---

## Task 20: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md at repo root**

```markdown
# GitHub Repo Explorer

Search GitHub repositories by username and save your favorites. Built as a fullstack TypeScript take-home project.

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | React 18, Vite, TanStack Query, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express, Prisma 5, PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Testing | Jest + ts-jest (backend), Vitest + Testing Library (frontend) |
| Structure | npm workspaces monorepo with shared types package |

## Prerequisites

- Node.js 18+
- PostgreSQL running locally

## Setup

**1. Clone and install**
```bash
git clone <repo-url>
cd github-explorer
npm install
```

**2. Create the database**
```bash
psql -U postgres -c "CREATE DATABASE github_explorer;"
```

**3. Configure environment**
```bash
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env — set DATABASE_URL and JWT_SECRET
```

**4. Run database migrations**
```bash
cd packages/backend
npx prisma migrate dev
```

**5. Start development servers**

In two separate terminals:
```bash
npm run dev:backend   # http://localhost:3001
npm run dev:frontend  # http://localhost:5173
```

## Running Tests

```bash
npm run test
```

## Architecture Notes

**Monorepo with shared types** — `packages/shared` defines all TypeScript interfaces used by both the frontend and backend. This prevents drift between API contracts and client-side types.

**Favorites store a snapshot** — When a user saves a repo, we store name, description, stars, and language in our database rather than just the GitHub repo ID. This means the Favorites page never needs an extra GitHub API call, and favorites survive if a repo is renamed or deleted on GitHub.

**JWT in localStorage** — Simpler to implement for a take-home. For production, httpOnly cookies are more secure against XSS attacks.

**GitHub API rate limits** — Unauthenticated requests are limited to 60/hour per IP. To raise this to 5,000/hour, add a `GITHUB_TOKEN` to your backend env and pass it as a header when proxying GitHub requests.

## API Reference

### Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/register` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |

### Favorites (requires `Authorization: Bearer <token>`)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/user/favorites` | — | `Favorite[]` |
| POST | `/user/favorites` | GitHub repo fields | `Favorite` |
| DELETE | `/user/favorites/:id` | — | `{ message }` |
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions and architecture notes"
```

---

## Summary

| Task | Deliverable |
|------|------------|
| 1 | Monorepo root (npm workspaces) |
| 2 | Shared TypeScript types package |
| 3 | Backend scaffold (Express + ts-jest) |
| 4 | Prisma schema + PostgreSQL migration |
| 5 | JWT middleware + 4 unit tests |
| 6 | Auth routes (register/login) + 6 tests |
| 7 | Favorites routes (CRUD) + 8 tests |
| 8 | Frontend scaffold (Vite + Tailwind + React Query) |
| 9 | Auth lib (localStorage) + useAuth hook |
| 10 | Axios API client with JWT interceptor |
| 11 | useRepos hook + 3 tests |
| 12 | useFavorites hook + 3 tests |
| 13 | SearchBar + 4 tests |
| 14 | FavoriteButton + RepoCard + 4 tests |
| 15 | AuthModal |
| 16 | RepoList + 6 tests |
| 17 | Home page + 3 tests |
| 18 | Favorites page |
| 19 | App routing + end-to-end smoke test |
| 20 | README |
