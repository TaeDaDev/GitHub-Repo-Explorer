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
