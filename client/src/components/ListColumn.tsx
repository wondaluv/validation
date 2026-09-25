import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { useCreateCard, useDeleteList, useRenameList } from '../hooks'
import type { Card, List } from '../types'
import { CardItem } from './CardItem'

interface Props {
  boardId: string
  list: List
  onCardClick: (card: Card) => void
}

export function ListColumn({ boardId, list, onCardClick }: Props) {
  const renameList = useRenameList(boardId)
  const deleteList = useDeleteList(boardId)
  const createCard = useCreateCard(boardId)

  const [title, setTitle] = useState(list.title)
  const [addingCard, setAddingCard] = useState(false)
  const [cardTitle, setCardTitle] = useState('')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: 'list', listId: list.id },
  })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `${list.id}::dropzone`,
    data: { type: 'list', listId: list.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function saveTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== list.title) renameList.mutate({ id: list.id, title: trimmed })
    else setTitle(list.title)
  }

  function submitCard() {
    const trimmed = cardTitle.trim()
    if (!trimmed) {
      setAddingCard(false)
      return
    }
    createCard.mutate({ listId: list.id, title: trimmed })
    setCardTitle('')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex w-72 shrink-0 flex-col rounded-2xl bg-slate-100/80 dark:bg-white/5 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center justify-between px-3 pb-1 pt-3 active:cursor-grabbing"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="w-full truncate border-none bg-transparent text-sm font-semibold text-slate-700 outline-none dark:text-slate-200"
        />
        <span className="mr-1 shrink-0 text-xs font-medium text-slate-400">
          {list.cards.length}
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => deleteList.mutate(list.id)}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-white/10"
          aria-label="Delete list"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div ref={setDroppableRef} className="min-h-4 flex-1 space-y-2 px-2 pb-2">
        <SortableContext
          items={list.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <CardItem key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>
      </div>

      <div className="px-2 pb-2">
        {addingCard ? (
          <textarea
            autoFocus
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            onBlur={submitCard}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitCard()
              }
              if (e.key === 'Escape') {
                setAddingCard(false)
                setCardTitle('')
              }
            }}
            placeholder="Card title…"
            rows={2}
            className="w-full resize-none rounded-lg border border-brand-400 bg-white p-2 text-sm outline-none dark:bg-surface-dark dark:text-slate-100"
          />
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm text-slate-500 transition hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Add card
          </button>
        )}
      </div>
    </div>
  )
}
