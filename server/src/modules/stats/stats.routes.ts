import { Router } from 'express';
import { incrementVisits, getVisits } from './stats.controller';

const router = Router();

router.post('/visits/increment', incrementVisits);
router.get('/visits', getVisits);

export default router;
