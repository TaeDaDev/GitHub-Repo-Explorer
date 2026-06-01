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
