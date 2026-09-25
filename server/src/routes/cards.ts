import { Router } from 'express'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'
import { db } from '../db.js'
import { mapCard } from '../mappers.js'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)
export const cardsRouter = Router()

const tagSchema = z.object({ name: z.string().min(1).max(40), color: z.string().min(1).max(20) })

const createCardSchema = z.object({
  listId: z.string().min(1),
  title: z.string().min(1).max(300),
})

cardsRouter.post('/', (req, res) => {
  const parsed = createCardSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const { listId, title } = parsed.data
  const list = db.prepare('SELECT id FROM lists WHERE id = ?').get(listId)
  if (!list) {
    res.status(404).json({ error: 'List not found' })
    return
  }

  const maxPosition = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS m FROM cards WHERE list_id = ?')
    .get(listId) as { m: number }

  const id = `card_${nanoid()}`
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO cards (id, list_id, title, description, due_date, tags, position, created_at, updated_at)
     VALUES (?, ?, ?, '', NULL, '[]', ?, ?, ?)`,
  ).run(id, listId, title, maxPosition.m + 1, now, now)

  res.status(201).json(
    mapCard({
      id,
      list_id: listId,
      title,
      description: '',
      due_date: null,
      tags: '[]',
      position: maxPosition.m + 1,
      created_at: now,
      updated_at: now,
    }),
  )
})

const updateCardSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional(),
  dueDate: z.string().nullable().optional(),
  tags: z.array(tagSchema).optional(),
})

cardsRouter.patch('/:id', (req, res) => {
  const parsed = updateCardSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id) as
    | Parameters<typeof mapCard>[0]
    | undefined
  if (!existing) {
    res.status(404).json({ error: 'Card not found' })
    return
  }

  const { title, description, dueDate, tags } = parsed.data
  const now = new Date().toISOString()

  db.prepare(
    `UPDATE cards SET
       title = ?,
       description = ?,
       due_date = ?,
       tags = ?,
       updated_at = ?
     WHERE id = ?`,
  ).run(
    title ?? existing.title,
    description ?? existing.description,
    dueDate === undefined ? existing.due_date : dueDate,
    tags ? JSON.stringify(tags) : existing.tags,
    now,
    req.params.id,
  )

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id)
  res.json(mapCard(updated as Parameters<typeof mapCard>[0]))
})

const moveCardSchema = z.object({
  listId: z.string().min(1),
  index: z.number().int().min(0),
})

cardsRouter.patch('/:id/move', (req, res) => {
  const parsed = moveCardSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id) as
    | { list_id: string }
    | undefined
  if (!card) {
    res.status(404).json({ error: 'Card not found' })
    return
  }

  const targetList = db.prepare('SELECT id FROM lists WHERE id = ?').get(parsed.data.listId)
  if (!targetList) {
    res.status(404).json({ error: 'Target list not found' })
    return
  }

  const { listId: newListId, index } = parsed.data
  const sourceListId = card.list_id

  const reorder = db.transaction(() => {
    if (sourceListId === newListId) {
      const siblings = db
        .prepare('SELECT id FROM cards WHERE list_id = ? ORDER BY position ASC')
        .all(sourceListId) as { id: string }[]
      const ids = siblings.map((s) => s.id).filter((id) => id !== req.params.id)
      const targetIndex = Math.min(index, ids.length)
      ids.splice(targetIndex, 0, req.params.id)

      const stmt = db.prepare('UPDATE cards SET position = ? WHERE id = ?')
      ids.forEach((id, i) => stmt.run(i, id))
    } else {
      const sourceSiblings = db
        .prepare('SELECT id FROM cards WHERE list_id = ? AND id != ? ORDER BY position ASC')
        .all(sourceListId, req.params.id) as { id: string }[]
      const sourceStmt = db.prepare('UPDATE cards SET position = ? WHERE id = ?')
      sourceSiblings.forEach((s, i) => sourceStmt.run(i, s.id))

      const destSiblings = db
        .prepare('SELECT id FROM cards WHERE list_id = ? ORDER BY position ASC')
        .all(newListId) as { id: string }[]
      const destIds = destSiblings.map((s) => s.id)
      const targetIndex = Math.min(index, destIds.length)
      destIds.splice(targetIndex, 0, req.params.id)

      const now = new Date().toISOString()
      db.prepare('UPDATE cards SET list_id = ?, updated_at = ? WHERE id = ?').run(
        newListId,
        now,
        req.params.id,
      )
      const destStmt = db.prepare('UPDATE cards SET position = ? WHERE id = ?')
      destIds.forEach((id, i) => destStmt.run(i, id))
    }
  })
  reorder()

  res.status(204).send()
})

cardsRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Card not found' })
    return
  }
  res.status(204).send()
})
