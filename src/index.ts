import app from './app'
import { env } from './config/env'

const PORT = parseInt(env.PORT, 10)

app.listen(PORT, () => {
  console.log(`[arc-run-api] Running on port ${PORT} in ${env.NODE_ENV} mode`)
})
