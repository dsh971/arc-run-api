import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { env } from './config/env'

const app = express()

// `1` (not `true`) — trusts exactly one hop; `true` would trust all hops and expose spoofable X-Forwarded-For values
app.set('trust proxy', 1)

app.use(helmet())
// Native iOS clients don't enforce CORS, but restricting origins prevents
// the anon key being usable from arbitrary browser origins if ever exposed.
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? ['https://arcrun.app']
    : true, // allow all in dev (localtunnel + simulators)
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json())

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV })
})

app.use('/v1', routes)

app.use(errorHandler)

export default app
