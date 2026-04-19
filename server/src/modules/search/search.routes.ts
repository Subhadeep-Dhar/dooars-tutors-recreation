import { Router } from 'express';
import { search, nearby } from './search.controller';

const router = Router();

router.get('/', search);
router.get('/nearby', nearby);

export default router;