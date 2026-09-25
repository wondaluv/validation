import { useEffect, useState } from 'react'
import { useDeleteCard, useUpdateCard } from '../hooks'
import type { Card, Tag } from '../types'

const TAG_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#64748b',
]

interface Props {
  boardId: string
  card: Card
  onClose: () => void
}

export function CardModal({ boardId, card, onClose }: Props) {
  const updateCard = useUpdateCard(boardId)
  const deleteCard = useDeleteCard(boardId)

  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [dueDate, setDueDate] = useState(card.dueDate?.slice(0, 10) ?? '')
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState(TAG_COLORS[4])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function saveTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== card.title) updateCard.mutate({ id: card.id, patch: { title: trimmed } })
  }

  function saveDescription() {
    if (description !== card.description)
      updateCard.mutate({ id: card.id, patch: { description } })
  }

  function saveDueDate(value: string) {
    setDueDate(value)
    updateCard.mutate({
      id: card.id,
      patch: { dueDate: value ? new Date(value).toISOString() : null },
    })
  }

  function addTag() {
    const trimmed = tagName.trim()
    if (!trimmed) return
    const next: Tag[] = [...card.tags, { name: trimmed, color: tagColor }]
    updateCard.mutate({ id: card.id, patch: { tags: next } })
    setTagName('')
  }

  function removeTag(index: number) {
    const next = card.tags.filter((_, i) => i !== index)
    updateCard.mutate({ id: card.id, patch: { tags: next } })
  }

  function handleDelete() {
    deleteCard.mutate(card.id, { onSuccess: onClose })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-6 pt-16 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-dark"
      >
        <div className="flex items-start justify-between gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            className="w-full resize-none border-none bg-transparent text-lg font-semibold text-slate-800 outline-none dark:text-slate-100"
          />
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              rows={4}
              placeholder="Add a more detailed description…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => saveDueDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Tags
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {card.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                  <button onClick={() => removeTag(i)} className="opacity-80 hover:opacity-100">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setTagColor(color)}
                    className={`h-5 w-5 rounded-full ${tagColor === color ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-surface-dark' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="New tag…"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              />
              <button
                onClick={addTag}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-white/10">
          <button
            onClick={handleDelete}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            Delete card
          </button>
        </div>
      </div>
    </div>
  )
}
