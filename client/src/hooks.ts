import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { BoardDetail, Tag } from './types'

export function useBoards() {
  return useQuery({ queryKey: ['boards'], queryFn: api.getBoards })
}

export function useBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => api.getBoard(boardId!),
    enabled: !!boardId,
  })
}

export function useCreateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.createBoard(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  })
}

export function useRenameBoard(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.renameBoard(boardId, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boards'] })
      qc.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

export function useDeleteBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (boardId: string) => api.deleteBoard(boardId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  })
}

export function useCreateList(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.createList(boardId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function useRenameList(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.renameList(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function useDeleteList(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteList(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      api.createCard(listId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<{ title: string; description: string; dueDate: string | null; tags: Tag[] }>
    }) => api.updateCard(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function useDeleteCard(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

/** Reorders lists/cards in the local cache immediately, persists in the background,
 *  and reconciles with the server response (or rolls back on failure). */
export function useMoveCard(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, listId, index }: { id: string; listId: string; index: number }) =>
      api.moveCard(id, listId, index),
    onError: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function useMoveList(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, index }: { id: string; index: number }) => api.moveList(id, index),
    onError: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function setBoardCache(
  qc: ReturnType<typeof useQueryClient>,
  boardId: string,
  updater: (board: BoardDetail) => BoardDetail,
) {
  qc.setQueryData<BoardDetail>(['board', boardId], (old) => (old ? updater(old) : old))
}
