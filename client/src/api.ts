import type { Board, BoardDetail, Card, List, Tag } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  getBoards: () => request<Board[]>('/boards'),
  getBoard: (id: string) => request<BoardDetail>(`/boards/${id}`),
  createBoard: (title: string) =>
    request<Board>('/boards', { method: 'POST', body: JSON.stringify({ title }) }),
  renameBoard: (id: string, title: string) =>
    request<Board>(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  deleteBoard: (id: string) => request<void>(`/boards/${id}`, { method: 'DELETE' }),

  createList: (boardId: string, title: string) =>
    request<List>('/lists', { method: 'POST', body: JSON.stringify({ boardId, title }) }),
  renameList: (id: string, title: string) =>
    request<List>(`/lists/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  moveList: (id: string, index: number) =>
    request<void>(`/lists/${id}/move`, { method: 'PATCH', body: JSON.stringify({ index }) }),
  deleteList: (id: string) => request<void>(`/lists/${id}`, { method: 'DELETE' }),

  createCard: (listId: string, title: string) =>
    request<Card>('/cards', { method: 'POST', body: JSON.stringify({ listId, title }) }),
  updateCard: (
    id: string,
    patch: Partial<{ title: string; description: string; dueDate: string | null; tags: Tag[] }>,
  ) => request<Card>(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  moveCard: (id: string, listId: string, index: number) =>
    request<void>(`/cards/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ listId, index }),
    }),
  deleteCard: (id: string) => request<void>(`/cards/${id}`, { method: 'DELETE' }),
}
