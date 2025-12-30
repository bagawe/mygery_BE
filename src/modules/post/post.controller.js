import postService from './post.service.js';
import { successResponse, errorResponse } from '../../utils/responseFormatter.js';
import path from 'path';
import fs from 'fs';

class PostController {
  /**
   * Create new post
   */
  async createPost(req, res) {
    try {
      const userId = req.user.userId;
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return errorResponse(res, 'Content is required', 400);
      }

      // Handle image uploads if any
      const imageUrls = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          imageUrls.push(`/uploads/posts/${file.filename}`);
        });
      }

      const post = await postService.createPost(userId, content, imageUrls);

      return successResponse(res, post, 'Post created successfully', 201);
    } catch (error) {
      console.error('Create post controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get feed posts
   */
  async getFeed(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await postService.getFeed(userId, page, limit);

      return successResponse(res, result.data, 'Posts retrieved successfully', 200, {
        pagination: result.meta
      });
    } catch (error) {
      console.error('Get feed controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get post by ID
   */
  async getPost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const post = await postService.getPostById(parseInt(id), userId);

      if (!post) {
        return errorResponse(res, 'Post not found', 404);
      }

      return successResponse(res, post);
    } catch (error) {
      console.error('Get post controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Toggle like on post
   */
  async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const result = await postService.toggleLike(parseInt(id), userId);

      const message = result.liked ? 'Post liked successfully' : 'Post unliked successfully';
      return successResponse(res, result, message);
    } catch (error) {
      console.error('Toggle like controller error:', error);
      
      // Handle Prisma foreign key constraint error
      if (error.code === 'P2003') {
        return errorResponse(res, 'Post not found', 404);
      }
      
      return errorResponse(res, error.message);
    }
  }

  /**
   * Add comment to post
   */
  async addComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return errorResponse(res, 'Content is required', 400);
      }

      const comment = await postService.addComment(parseInt(id), userId, content);

      return successResponse(res, comment, 'Comment added successfully', 201);
    } catch (error) {
      console.error('Add comment controller error:', error);
      
      // Handle Prisma foreign key constraint error
      if (error.code === 'P2003') {
        return errorResponse(res, 'Post not found', 404);
      }
      
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get comments for post
   */
  async getComments(req, res) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await postService.getComments(parseInt(id), page, limit);

      return successResponse(res, result.data, 'Comments retrieved successfully', 200, {
        pagination: result.meta
      });
    } catch (error) {
      console.error('Get comments controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Delete post
   */
  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const post = await postService.getPostById(parseInt(id));

      if (!post) {
        return errorResponse(res, 'Post not found', 404);
      }

      if (post.userId !== userId) {
        return errorResponse(res, 'Unauthorized to delete this post', 403);
      }

      // Delete associated images
      if (post.imageUrls && post.imageUrls.length > 0) {
        post.imageUrls.forEach(imageUrl => {
          const imagePath = path.join(process.cwd(), 'public', imageUrl);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }

      await postService.deletePost(parseInt(id));

      return successResponse(res, null, 'Post deleted successfully');
    } catch (error) {
      console.error('Delete post controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(req, res) {
    try {
      const { id, commentId } = req.params;
      const userId = req.user.userId;

      const comment = await postService.getCommentById(parseInt(commentId));

      if (!comment) {
        return errorResponse(res, 'Comment not found', 404);
      }

      if (comment.userId !== userId) {
        return errorResponse(res, 'Unauthorized to delete this comment', 403);
      }

      await postService.deleteComment(parseInt(commentId));

      return successResponse(res, null, 'Comment deleted successfully');
    } catch (error) {
      console.error('Delete comment controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Search posts
   */
  async searchPosts(req, res) {
    try {
      const { q } = req.query;
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!q || q.trim() === '') {
        return errorResponse(res, 'Search query is required', 400);
      }

      const result = await postService.searchPosts(q, userId, page, limit);

      return successResponse(res, result.data, 'Search completed successfully', 200, {
        pagination: result.meta
      });
    } catch (error) {
      console.error('Search posts controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get posts by hashtag
   */
  async getPostsByHashtag(req, res) {
    try {
      const { hashtag } = req.params;
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await postService.getPostsByHashtag(hashtag, userId, page, limit);

      return successResponse(res, result.data, 'Posts retrieved successfully', 200, {
        pagination: result.meta
      });
    } catch (error) {
      console.error('Get posts by hashtag controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const hashtags = await postService.getTrendingHashtags(limit);

      return successResponse(res, hashtags, 'Trending hashtags retrieved successfully');
    } catch (error) {
      console.error('Get trending hashtags controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get mentioned posts
   */
  async getMentionedPosts(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await postService.getMentionedPosts(userId, page, limit);

      return successResponse(res, result.data, 'Mentioned posts retrieved successfully', 200, {
        pagination: result.meta
      });
    } catch (error) {
      console.error('Get mentioned posts controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await postService.getTrendingPosts(userId, page, limit);

      return successResponse(res, result.data, 'Trending posts retrieved successfully', 200, {
        pagination: result.meta
      });
    } catch (error) {
      console.error('Get trending posts controller error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * Track post view
   */
  async trackView(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await postService.trackView(parseInt(id), userId);

      return successResponse(res, null, 'View tracked successfully');
    } catch (error) {
      console.error('Track view controller error:', error);
      
      // Handle Prisma foreign key constraint error
      if (error.code === 'P2003') {
        return errorResponse(res, 'Post not found', 404);
      }
      
      return errorResponse(res, error.message);
    }
  }
}

export default new PostController();