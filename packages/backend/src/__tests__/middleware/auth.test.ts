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
