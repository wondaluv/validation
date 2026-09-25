import type { Board, Card, List, Tag } from './types.js'

interface BoardRow {
  id: string
  title: string
  position: number
  created_at: string
}

interface ListRow {
  id: string
  board_id: string
  title: string
  position: number
  created_at: string
}

interface CardRow {
  id: string
  list_id: string
  title: string
  description: string
  due_date: string | null
  tags: string
  position: number
  created_at: string
  updated_at: string
}

export function mapBoard(row: BoardRow): Board {
  return {
    id: row.id,
    title: row.title,
    position: row.position,
    createdAt: row.created_at,
  }
}

export function mapList(row: ListRow): List {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    position: row.position,
    createdAt: row.created_at,
  }
}

export function mapCard(row: CardRow): Card {
  let tags: Tag[] = []
  try {
    tags = JSON.parse(row.tags)
  } catch {
    tags = []
  }
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    tags,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
