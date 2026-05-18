import { Router } from 'express'
import authRoutes    from './auth.routes'
import modesRoutes   from './modes.routes'
import runsRoutes    from './runs.routes'
import accountRoutes from './account.routes'

const router = Router()

router.use('/auth',    authRoutes)
router.use('/modes',   modesRoutes)
router.use('/runs',    runsRoutes)
router.use('/account', accountRoutes)

export default router
