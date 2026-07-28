import express from 'express';
import optionalProtectUser from '../middlewares/optionalProtectUser.js';
import protectUser from '../middlewares/protectUser.js';
import { getComments, createComment, deleteComment } from '../controllers/commentsController.js';

const router = express.Router();

router.get('/', getComments);
router.post('/', optionalProtectUser, createComment);
router.delete('/:id', protectUser, deleteComment);

export default router;
