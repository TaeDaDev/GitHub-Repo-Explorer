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
