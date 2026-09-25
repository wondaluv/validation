import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH ?? path.join(__dirname, '..', 'data.sqlite3')

export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    due_date TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_lists_board ON lists(board_id);
  CREATE INDEX IF NOT EXISTS idx_cards_list ON cards(list_id);
`)

const boardCount = (db.prepare('SELECT COUNT(*) AS n FROM boards').get() as { n: number }).n

if (boardCount === 0) {
  seed()
}

function seed() {
  const now = new Date().toISOString()
  const insertBoard = db.prepare(
    'INSERT INTO boards (id, title, position, created_at) VALUES (?, ?, ?, ?)',
  )
  const insertList = db.prepare(
    'INSERT INTO lists (id, board_id, title, position, created_at) VALUES (?, ?, ?, ?, ?)',
  )
  const insertCard = db.prepare(
    `INSERT INTO cards (id, list_id, title, description, due_date, tags, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )

  const boardId = 'board_demo'
  insertBoard.run(boardId, 'Product Launch', 0, now)

  const lists = [
    { id: 'list_backlog', title: 'Backlog' },
    { id: 'list_progress', title: 'In Progress' },
    { id: 'list_review', title: 'Review' },
    { id: 'list_done', title: 'Done' },
  ]
  lists.forEach((l, i) => insertList.run(l.id, boardId, l.title, i, now))

  const tag = (name: string, color: string) => JSON.stringify([{ name, color }])

  const cards: Array<[string, string, string, string | null, string, string]> = [
    ['list_backlog', 'Design onboarding flow', 'Sketch the first-run experience for new users.', null, tag('Design', '#a855f7'), 'c1'],
    ['list_backlog', 'Research competitor pricing', '', null, tag('Research', '#3b82f6'), 'c2'],
    ['list_progress', 'Build authentication API', 'JWT-based auth with refresh tokens.', new Date(Date.now() + 3 * 86400000).toISOString(), tag('Backend', '#f97316'), 'c3'],
    ['list_progress', 'Kanban drag-and-drop', 'Cards should reorder within and across lists.', new Date(Date.now() + 1 * 86400000).toISOString(), tag('Frontend', '#22c55e'), 'c4'],
    ['list_review', 'Landing page copy', 'Needs a pass from marketing before launch.', null, tag('Content', '#eab308'), 'c5'],
    ['list_done', 'Set up CI pipeline', 'GitHub Actions running tests on every PR.', null, tag('DevOps', '#64748b'), 'c6'],
  ]

  const positionByList = new Map<string, number>()
  cards.forEach(([listId, title, description, dueDate, tags, idSuffix]) => {
    const position = positionByList.get(listId) ?? 0
    insertCard.run(`card_${idSuffix}`, listId, title, description, dueDate, tags, position, now, now)
    positionByList.set(listId, position + 1)
  })
}
