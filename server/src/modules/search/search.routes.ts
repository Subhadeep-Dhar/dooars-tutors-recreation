import { Router } from 'express';
import { search, nearby, getSuggestions } from './search.controller';
import { getAiContext } from './ai-context.controller';

const router = Router();

router.get('/suggestions', getSuggestions);
router.get('/', search);
router.get('/nearby', nearby);
router.get('/ai-context', getAiContext);
export default router;