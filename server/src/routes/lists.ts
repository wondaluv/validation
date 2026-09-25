import { Router } from 'express'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'
import { db } from '../db.js'
import { mapList } from '../mappers.js'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)
export const listsRouter = Router()

const createListSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().min(1).max(200),
})

listsRouter.post('/', (req, res) => {
  const parsed = createListSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const { boardId, title } = parsed.data
  const board = db.prepare('SELECT id FROM boards WHERE id = ?').get(boardId)
  if (!board) {
    res.status(404).json({ error: 'Board not found' })
    return
  }

  const maxPosition = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS m FROM lists WHERE board_id = ?')
    .get(boardId) as { m: number }

  const id = `list_${nanoid()}`
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO lists (id, board_id, title, position, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, boardId, title, maxPosition.m + 1, now)

  res.status(201).json(
    mapList({ id, board_id: boardId, title, position: maxPosition.m + 1, created_at: now }),
  )
})

const updateListSchema = z.object({ title: z.string().min(1).max(200) })

listsRouter.patch('/:id', (req, res) => {
  const parsed = updateListSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const result = db
    .prepare('UPDATE lists SET title = ? WHERE id = ?')
    .run(parsed.data.title, req.params.id)

  if (result.changes === 0) {
    res.status(404).json({ error: 'List not found' })
    return
  }

  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id)
  res.json(mapList(list as Parameters<typeof mapList>[0]))
})

const moveListSchema = z.object({ index: z.number().int().min(0) })

listsRouter.patch('/:id/move', (req, res) => {
  const parsed = moveListSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id) as
    | { board_id: string }
    | undefined
  if (!list) {
    res.status(404).json({ error: 'List not found' })
    return
  }

  const siblings = db
    .prepare('SELECT id FROM lists WHERE board_id = ? ORDER BY position ASC')
    .all(list.board_id) as { id: string }[]

  const ids = siblings.map((s) => s.id).filter((id) => id !== req.params.id)
  const targetIndex = Math.min(parsed.data.index, ids.length)
  ids.splice(targetIndex, 0, req.params.id)

  const reindex = db.transaction(() => {
    const stmt = db.prepare('UPDATE lists SET position = ? WHERE id = ?')
    ids.forEach((id, i) => stmt.run(i, id))
  })
  reindex()

  res.status(204).send()
})

listsRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM lists WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'List not found' })
    return
  }
  res.status(204).send()
})
