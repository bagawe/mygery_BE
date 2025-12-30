import express from 'express';
import postController from './post.controller.js';
import { authenticateToken } from '../../middlewares/authMiddleware.js';
import upload from '../../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/hashtags/trending', (req, res) => postController.getTrendingHashtags(req, res));
router.use(authenticateToken);
router.post('/', upload.array('images', 5), (req, res) => postController.createPost(req, res));
router.get('/', (req, res) => postController.getFeed(req, res));
router.get('/search', (req, res) => postController.searchPosts(req, res));
router.get('/trending', (req, res) => postController.getTrendingPosts(req, res));
router.get('/mentions', (req, res) => postController.getMentionedPosts(req, res));
router.get('/hashtag/:hashtag', (req, res) => postController.getPostsByHashtag(req, res));
router.get('/:id', (req, res) => postController.getPost(req, res));
router.delete('/:id', (req, res) => postController.deletePost(req, res));
router.post('/:id/like', (req, res) => postController.toggleLike(req, res));
router.post('/:id/view', (req, res) => postController.trackView(req, res));
router.post('/:id/comment', (req, res) => postController.addComment(req, res));
router.get('/:id/comments', (req, res) => postController.getComments(req, res));
router.delete('/:id/comments/:commentId', (req, res) => postController.deleteComment(req, res));

export default router;