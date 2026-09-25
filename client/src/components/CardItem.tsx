import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, isPast, isToday } from 'date-fns'
import type { Card } from '../types'

interface Props {
  card: Card
  onClick: () => void
}

function dueBadgeClasses(dueDate: string) {
  const date = new Date(dueDate)
  if (isPast(date) && !isToday(date)) {
    return 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
  }
  if (isToday(date)) {
    return 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
  }
  return 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
}

export function CardItem({ card, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', listId: card.listId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-surface-dark dark:hover:border-white/20 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {card.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.tags.map((tag, i) => (
            <span
              key={i}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">
        {card.title}
      </p>

      {(card.dueDate || card.description) && (
        <div className="mt-2 flex items-center gap-2">
          {card.dueDate && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${dueBadgeClasses(card.dueDate)}`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                <path
                  d="M8 2v3M16 2v3M3.5 9h17M4 5h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              {format(new Date(card.dueDate), 'MMM d')}
            </span>
          )}
          {card.description && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600"
            >
              <path
                d="M4 6h16M4 12h16M4 18h10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      )}
    </div>
  )
}
