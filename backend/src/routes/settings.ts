// Updated: annotate routes (commit group 2)
import { Router } from 'express'
import { getSettings, updateSettings } from '../controllers/settingsController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate)

// Everyone can view settings, only ADMIN can update
router.get('/', getSettings)
router.put('/', authorize(['ADMIN']), updateSettings)

export default router
