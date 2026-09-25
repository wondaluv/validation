import { useEffect, useState } from 'react'
import { Board } from './components/Board'
import { Sidebar } from './components/Sidebar'
import { useBoards } from './hooks'

export default function App() {
  const { data: boards } = useBoards()
  const [boardId, setBoardId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!boardId && boards && boards.length > 0) {
      setBoardId(boards[0].id)
    }
  }, [boards, boardId])

  return (
    <div className="flex h-screen bg-canvas dark:bg-canvas-dark">
      <Sidebar currentBoardId={boardId} onSelect={setBoardId} />

      {boardId ? (
        <Board
          key={boardId}
          boardId={boardId}
          onBoardDeleted={() => setBoardId(undefined)}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          {boards?.length === 0 ? 'Create a board to get started' : 'Select a board'}
        </div>
      )}
    </div>
  )
}
