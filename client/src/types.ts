export interface Tag {
  name: string
  color: string
}

export interface Board {
  id: string
  title: string
  position: number
  createdAt: string
}

export interface Card {
  id: string
  listId: string
  title: string
  description: string
  dueDate: string | null
  tags: Tag[]
  position: number
  createdAt: string
  updatedAt: string
}

export interface List {
  id: string
  boardId: string
  title: string
  position: number
  createdAt: string
  cards: Card[]
}

export interface BoardDetail extends Board {
  lists: List[]
}
