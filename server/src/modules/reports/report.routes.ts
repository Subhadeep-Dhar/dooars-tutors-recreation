import { Router } from 'express';
import { createReport } from './report.controller';
import { verifyToken } from '../../middleware/auth';

const router = Router();

router.post('/', verifyToken, createReport);

export default router;
