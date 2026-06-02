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
