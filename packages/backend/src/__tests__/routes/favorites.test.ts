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
