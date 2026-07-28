import express from 'express';
import protectUser from '../middlewares/protectUser.js';
import { toggleLike, getHasLiked } from '../controllers/likesController.js';

const router = express.Router();

router.put('/:postId/toggle', protectUser, toggleLike);
router.get('/:postId/has-liked', protectUser, getHasLiked);

export default router;
