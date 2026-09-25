import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useEffect, useRef, useState } from 'react'
import { useBoard, useCreateList, useDeleteBoard, useMoveCard, useMoveList, useRenameBoard } from '../hooks'
import type { Card, List } from '../types'
import { CardItem } from './CardItem'
import { CardModal } from './CardModal'
import { ListColumn } from './ListColumn'

interface Props {
  boardId: string
  onBoardDeleted: () => void
}

function findListOf(columns: List[], cardId: string): List | undefined {
  return columns.find((l) => l.cards.some((c) => c.id === cardId))
}

export function Board({ boardId, onBoardDeleted }: Props) {
  const { data: board, isLoading } = useBoard(boardId)
  const renameBoard = useRenameBoard(boardId)
  const deleteBoard = useDeleteBoard()
  const createList = useCreateList(boardId)
  const moveCard = useMoveCard(boardId)
  const moveList = useMoveList(boardId)

  const [columns, setColumns] = useState<List[]>([])
  const [title, setTitle] = useState('')
  const [addingList, setAddingList] = useState(false)
  const [listTitle, setListTitle] = useState('')
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeList, setActiveList] = useState<List | null>(null)
  const [openCard, setOpenCard] = useState<Card | null>(null)
  const isDragging = useRef(false)

  useEffect(() => {
    if (board && !isDragging.current) {
      setColumns(board.lists)
      setTitle(board.title)
    }
  }, [board])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  if (isLoading || !board) {
    return <div className="flex-1 p-8 text-sm text-slate-400">Loading board…</div>
  }

  function handleDragStart(event: DragStartEvent) {
    isDragging.current = true
    const { active } = event
    if (active.data.current?.type === 'card') {
      const list = findListOf(columns, active.id as string)
      setActiveCard(list?.cards.find((c) => c.id === active.id) ?? null)
    } else if (active.data.current?.type === 'list') {
      setActiveList(columns.find((l) => l.id === active.id) ?? null)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.data.current?.type !== 'card') return

    const sourceList = findListOf(columns, active.id as string)
    const destListId = (over.data.current?.listId as string | undefined) ?? (over.id as string)
    if (!sourceList || !destListId) return

    const destList = columns.find((l) => l.id === destListId)
    if (!destList || sourceList.id === destList.id) return

    setColumns((prev) => {
      const src = prev.find((l) => l.id === sourceList.id)!
      const dest = prev.find((l) => l.id === destList.id)!
      const card = src.cards.find((c) => c.id === active.id)!

      const destIndex =
        over.data.current?.type === 'card'
          ? dest.cards.findIndex((c) => c.id === over.id)
          : dest.cards.length

      return prev.map((l) => {
        if (l.id === src.id) return { ...l, cards: l.cards.filter((c) => c.id !== active.id) }
        if (l.id === dest.id) {
          const cards = [...l.cards]
          cards.splice(destIndex < 0 ? cards.length : destIndex, 0, { ...card, listId: dest.id })
          return { ...l, cards }
        }
        return l
      })
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    isDragging.current = false
    const { active, over } = event
    setActiveCard(null)
    setActiveList(null)
    if (!over) return

    if (active.data.current?.type === 'list') {
      const overListId = (over.data.current?.listId as string | undefined) ?? (over.id as string)
      const oldIndex = columns.findIndex((l) => l.id === active.id)
      const newIndex = columns.findIndex((l) => l.id === overListId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
      const reordered = arrayMove(columns, oldIndex, newIndex)
      setColumns(reordered)
      moveList.mutate({ id: active.id as string, index: newIndex })
      return
    }

    if (active.data.current?.type === 'card') {
      const destList = findListOf(columns, active.id as string)
      if (!destList) return
      const index = destList.cards.findIndex((c) => c.id === active.id)

      if (over.data.current?.type === 'card' && over.id !== active.id) {
        const overIndex = destList.cards.findIndex((c) => c.id === over.id)
        if (overIndex !== -1 && overIndex !== index) {
          setColumns((prev) =>
            prev.map((l) =>
              l.id === destList.id ? { ...l, cards: arrayMove(l.cards, index, overIndex) } : l,
            ),
          )
          moveCard.mutate({ id: active.id as string, listId: destList.id, index: overIndex })
          return
        }
      }

      moveCard.mutate({ id: active.id as string, listId: destList.id, index })
    }
  }

  function saveBoardTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== board!.title) renameBoard.mutate(trimmed)
    else setTitle(board!.title)
  }

  function submitList() {
    const trimmed = listTitle.trim()
    if (!trimmed) {
      setAddingList(false)
      return
    }
    createList.mutate(trimmed)
    setListTitle('')
    setAddingList(false)
  }

  function handleDeleteBoard() {
    if (!confirm(`Delete board "${board!.title}"? This cannot be undone.`)) return
    deleteBoard.mutate(board!.id, { onSuccess: onBoardDeleted })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveBoardTitle}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="border-none bg-transparent text-xl font-semibold text-slate-800 outline-none dark:text-slate-100"
        />
        <button
          onClick={handleDeleteBoard}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
        >
          Delete board
        </button>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full items-start gap-4">
            <SortableContext
              items={columns.map((l) => l.id)}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((list) => (
                <ListColumn
                  key={list.id}
                  boardId={boardId}
                  list={list}
                  onCardClick={setOpenCard}
                />
              ))}
            </SortableContext>

            <div className="w-72 shrink-0">
              {addingList ? (
                <input
                  autoFocus
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  onBlur={submitList}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitList()
                    if (e.key === 'Escape') {
                      setAddingList(false)
                      setListTitle('')
                    }
                  }}
                  placeholder="List name"
                  className="w-full rounded-xl border border-brand-400 bg-white px-3 py-2.5 text-sm outline-none dark:bg-surface-dark dark:text-slate-100"
                />
              ) : (
                <button
                  onClick={() => setAddingList(true)}
                  className="flex w-full items-center gap-1.5 rounded-xl bg-slate-100/70 px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  Add list
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard && <CardItem card={activeCard} onClick={() => {}} />}
            {activeList && (
              <div className="w-72 rounded-2xl bg-slate-100 p-3 shadow-xl dark:bg-white/10">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {activeList.title}
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {openCard && (
        <CardModal
          boardId={boardId}
          card={
            columns.flatMap((l) => l.cards).find((c) => c.id === openCard.id) ?? openCard
          }
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  )
}
