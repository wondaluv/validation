import cors from 'cors'
import express from 'express'
import './db.js'
import { boardsRouter } from './routes/boards.js'
import { cardsRouter } from './routes/cards.js'
import { listsRouter } from './routes/lists.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors())
app.use(express.json())

app.use('/api/boards', boardsRouter)
app.use('/api/lists', listsRouter)
app.use('/api/cards', cardsRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
