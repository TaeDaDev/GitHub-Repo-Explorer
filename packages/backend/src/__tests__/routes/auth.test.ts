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
