import express from 'express';
import * as postController from './post.controller.js';
import auth from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Endpoint utama (nanti akan diisi detail)
router.post('/', auth, postController.createPost);
router.get('/', auth, postController.getFeed);

export default router;