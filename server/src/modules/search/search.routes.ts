import { Router } from 'express';
import { search, nearby } from './search.controller';
import { getAiContext } from './ai-context.controller';

const router = Router();

router.get('/', search);
router.get('/nearby', nearby);
router.get('/ai-context', getAiContext);
export default router;