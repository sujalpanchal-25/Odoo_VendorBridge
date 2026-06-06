import { Router } from 'express';
import { listActivityLogs, getMyActivityLogs } from '../controllers/activityController.js';
import { verifyJWT, allowRoles } from '../middleware/auth.js';

const router = Router();

router.use(verifyJWT);

// Full audit log — Admin & Manager only (sensitive company-wide data)
router.get('/', allowRoles('admin', 'manager'), listActivityLogs);

// My own activity — every logged-in user can see their own actions
router.get('/mine', getMyActivityLogs);

export default router;
