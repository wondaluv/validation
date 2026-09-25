import { useState } from 'react'
import { useBoards, useCreateBoard } from '../hooks'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  currentBoardId: string | undefined
  onSelect: (id: string) => void
}

export function Sidebar({ currentBoardId, onSelect }: Props) {
  const { data: boards, isLoading } = useBoards()
  const createBoard = useCreateBoard()
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')

  function submit() {
    const trimmed = title.trim()
    if (!trimmed) {
      setCreating(false)
      return
    }
    createBoard.mutate(trimmed, {
      onSuccess: (board) => {
        onSelect(board.id)
        setTitle('')
        setCreating(false)
      },
    })
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-white/10 dark:bg-canvas-dark">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
            K
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Kanban</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Boards
        </span>
        <button
          onClick={() => setCreating(true)}
          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
          aria-label="New board"
          title="New board"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {isLoading && <p className="px-2 py-1 text-sm text-slate-400">Loading…</p>}

        {boards?.map((board) => (
          <button
            key={board.id}
            onClick={() => onSelect(board.id)}
            className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm transition ${
              board.id === currentBoardId
                ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            {board.title}
          </button>
        ))}

        {creating && (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') {
                setCreating(false)
                setTitle('')
              }
            }}
            placeholder="Board name"
            className="w-full rounded-lg border border-brand-400 bg-white px-3 py-2 text-sm outline-none dark:bg-canvas-dark dark:text-slate-100"
          />
        )}
      </nav>
    </aside>
  )
}
