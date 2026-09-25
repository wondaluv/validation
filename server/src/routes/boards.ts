import { Router } from 'express'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'
import { db } from '../db.js'
import { mapBoard, mapCard, mapList } from '../mappers.js'
import type { BoardDetail } from '../types.js'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)
export const boardsRouter = Router()

boardsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM boards ORDER BY position ASC').all() as Parameters<
    typeof mapBoard
  >[0][]
  res.json(rows.map(mapBoard))
})

boardsRouter.get('/:id', (req, res) => {
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id)
  if (!board) {
    res.status(404).json({ error: 'Board not found' })
    return
  }

  const listRows = db
    .prepare('SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC')
    .all(req.params.id)
  const cardRows = db
    .prepare(
      `SELECT cards.* FROM cards
       JOIN lists ON lists.id = cards.list_id
       WHERE lists.board_id = ?
       ORDER BY cards.position ASC`,
    )
    .all(req.params.id)

  const cardsByList = new Map<string, ReturnType<typeof mapCard>[]>()
  for (const row of cardRows as Parameters<typeof mapCard>[0][]) {
    const card = mapCard(row)
    const list = cardsByList.get(card.listId) ?? []
    list.push(card)
    cardsByList.set(card.listId, list)
  }

  const detail: BoardDetail = {
    ...mapBoard(board as Parameters<typeof mapBoard>[0]),
    lists: (listRows as Parameters<typeof mapList>[0][]).map((row) => ({
      ...mapList(row),
      cards: cardsByList.get(row.id) ?? [],
    })),
  }

  res.json(detail)
})

const createBoardSchema = z.object({ title: z.string().min(1).max(200) })

boardsRouter.post('/', (req, res) => {
  const parsed = createBoardSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const { title } = parsed.data
  const maxPosition = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS m FROM boards')
    .get() as { m: number }

  const id = `board_${nanoid()}`
  const now = new Date().toISOString()
  db.prepare('INSERT INTO boards (id, title, position, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    title,
    maxPosition.m + 1,
    now,
  )

  res.status(201).json(mapBoard({ id, title, position: maxPosition.m + 1, created_at: now }))
})

const updateBoardSchema = z.object({ title: z.string().min(1).max(200) })

boardsRouter.patch('/:id', (req, res) => {
  const parsed = updateBoardSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const result = db
    .prepare('UPDATE boards SET title = ? WHERE id = ?')
    .run(parsed.data.title, req.params.id)

  if (result.changes === 0) {
    res.status(404).json({ error: 'Board not found' })
    return
  }

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id)
  res.json(mapBoard(board as Parameters<typeof mapBoard>[0]))
})

boardsRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Board not found' })
    return
  }
  res.status(204).send()
})
