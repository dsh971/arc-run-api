import { Router } from 'express'
import { ModesController } from '../controllers/modes.controller'

const router = Router()
const modesController = new ModesController()

router.get('/', modesController.getModes)
router.get('/version', modesController.getVersion)

export default router
