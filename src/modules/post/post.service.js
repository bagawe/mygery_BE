import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PostService {
  /**
   * Create new post
   */
  async createPost(userId, content, imageUrls = []) {
    try {
      const post = await prisma.post.create({
        data: {
          userId,
          content,
          imageUrls: imageUrls.length > 0 ? imageUrls : [],
          imageUrl: imageUrls.length > 0 ? imageUrls[0] : null
        },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              name: true,
              username: true,
              fotoProfil: true
            }
          }
        }
      });

      return post;
    } catch (error) {
      console.error('Create post service error:', error);
      throw error;
    }
  }

  /**
   * Get feed posts
   */
  async getFeed(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                name: true,
                username: true,
                fotoProfil: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true
              }
            },
            likes: {
              where: {
                userId
              },
              select: {
                id: true
              }
            }
          }
        }),
        prisma.post.count()
      ]);

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        likedByMe: post.likes.length > 0,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        likes: undefined,
        _count: undefined
      }));

      return {
        data: postsWithLikeStatus,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get feed service error:', error);
      throw error;
    }
  }

  /**
   * Search posts by content
   */
  async searchPosts(query, userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            content: {
              contains: query,
              mode: 'insensitive'
            }
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                name: true,
                username: true,
                fotoProfil: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true
              }
            },
            likes: {
              where: {
                userId
              },
              select: {
                id: true
              }
            }
          }
        }),
        prisma.post.count({
          where: {
            content: {
              contains: query,
              mode: 'insensitive'
            }
          }
        })
      ]);

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        likedByMe: post.likes.length > 0,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        likes: undefined,
        _count: undefined
      }));

      return {
        data: postsWithLikeStatus,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Search posts service error:', error);
      throw error;
    }
  }

  /**
   * Get post by ID
   */
  async getPostById(postId, userId = null) {
    try {
      const includeConfig = {
        user: {
          select: {
            id: true,
            uuid: true,
            name: true,
            username: true,
            fotoProfil: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      };

      // Only include likes if userId is provided
      if (userId) {
        includeConfig.likes = {
          where: {
            userId
          },
          select: {
            id: true
          }
        };
      }

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: includeConfig
      });

      if (!post) {
        return null;
      }

      // Add computed fields
      const result = {
        ...post,
        likeCount: post._count.likes,
        commentCount: post._count.comments
      };

      if (userId && post.likes) {
        result.likedByMe = post.likes.length > 0;
        delete result.likes;
      }

      delete result._count;

      return result;
    } catch (error) {
      console.error('Get post by ID service error:', error);
      throw error;
    }
  }

  /**
   * Toggle like on post
   */
  async toggleLike(postId, userId) {
    try {
      const existingLike = await prisma.postLike.findFirst({
        where: {
          postId,
          userId
        }
      });

      if (existingLike) {
        await prisma.postLike.delete({
          where: {
            id: existingLike.id
          }
        });
        return { liked: false };
      } else {
        await prisma.postLike.create({
          data: {
            postId,
            userId
          }
        });
        return { liked: true };
      }
    } catch (error) {
      console.error('Toggle like service error:', error);
      throw error;
    }
  }

  /**
   * Add comment to post
   */
  async addComment(postId, userId, content) {
    try {
      const comment = await prisma.postComment.create({
        data: {
          postId,
          userId,
          content
        },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              name: true,
              username: true,
              fotoProfil: true
            }
          }
        }
      });

      return comment;
    } catch (error) {
      console.error('Add comment service error:', error);
      throw error;
    }
  }

  /**
   * Get comments for post
   */
  async getComments(postId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        prisma.postComment.findMany({
          where: { postId },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                name: true,
                username: true,
                fotoProfil: true
              }
            }
          }
        }),
        prisma.postComment.count({
          where: { postId }
        })
      ]);

      return {
        data: comments,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get comments service error:', error);
      throw error;
    }
  }

  /**
   * Delete post
   */
  async deletePost(postId) {
    try {
      await prisma.post.delete({
        where: { id: postId }
      });
    } catch (error) {
      console.error('Delete post service error:', error);
      throw error;
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId) {
    try {
      await prisma.postComment.delete({
        where: { id: commentId }
      });
    } catch (error) {
      console.error('Delete comment service error:', error);
      throw error;
    }
  }

  /**
   * Get comment by ID
   */
  async getCommentById(commentId) {
    try {
      return await prisma.postComment.findUnique({
        where: { id: commentId }
      });
    } catch (error) {
      console.error('Get comment by ID service error:', error);
      throw error;
    }
  }

  /**
   * Check block status between users
   */
  async checkBlockStatus(userId, targetUserId) {
    try {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: userId }
          ]
        }
      });

      return !!block;
    } catch (error) {
      console.error('Check block status service error:', error);
      throw error;
    }
  }

  /**
   * Get posts by hashtag
   */
  async getPostsByHashtag(hashtag, userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const searchTag = `#${hashtag}`;

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            content: {
              contains: searchTag,
              mode: 'insensitive'
            }
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                name: true,
                username: true,
                fotoProfil: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true
              }
            },
            likes: {
              where: {
                userId
              },
              select: {
                id: true
              }
            }
          }
        }),
        prisma.post.count({
          where: {
            content: {
              contains: searchTag,
              mode: 'insensitive'
            }
          }
        })
      ]);

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        likedByMe: post.likes.length > 0,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        likes: undefined,
        _count: undefined
      }));

      return {
        data: postsWithLikeStatus,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get posts by hashtag service error:', error);
      throw error;
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit = 10) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const posts = await prisma.post.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          },
          content: {
            not: null
          }
        },
        select: {
          content: true
        }
      });

      const hashtagCount = {};
      const hashtagRegex = /#[\w\u0080-\uFFFF]+/g;

      posts.forEach(post => {
        if (post.content) {
          const hashtags = post.content.match(hashtagRegex);
          if (hashtags) {
            hashtags.forEach(tag => {
              const cleanTag = tag.substring(1).toLowerCase();
              hashtagCount[cleanTag] = (hashtagCount[cleanTag] || 0) + 1;
            });
          }
        }
      });

      const trendingHashtags = Object.entries(hashtagCount)
        .map(([tag, count]) => ({
          hashtag: tag,
          count: count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return trendingHashtags;
    } catch (error) {
      console.error('Get trending hashtags service error:', error);
      throw error;
    }
  }

  /**
   * Get mentioned posts
   */
  async getMentionedPosts(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      if (!user || !user.username) {
        return {
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        };
      }

      const mentionTag = `@${user.username}`;

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            content: {
              contains: mentionTag,
              mode: 'insensitive'
            },
            userId: {
              not: userId
            }
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                name: true,
                username: true,
                fotoProfil: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true
              }
            },
            likes: {
              where: {
                userId
              },
              select: {
                id: true
              }
            }
          }
        }),
        prisma.post.count({
          where: {
            content: {
              contains: mentionTag,
              mode: 'insensitive'
            },
            userId: {
              not: userId
            }
          }
        })
      ]);

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        likedByMe: post.likes.length > 0,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        likes: undefined,
        _count: undefined
      }));

      return {
        data: postsWithLikeStatus,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get mentioned posts service error:', error);
      throw error;
    }
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            createdAt: {
              gte: sevenDaysAgo
            }
          },
          skip,
          take: limit,
          orderBy: [
            {
              likes: {
                _count: 'desc'
              }
            },
            {
              comments: {
                _count: 'desc'
              }
            },
            {
              createdAt: 'desc'
            }
          ],
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                name: true,
                username: true,
                fotoProfil: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true
              }
            },
            likes: {
              where: {
                userId
              },
              select: {
                id: true
              }
            }
          }
        }),
        prisma.post.count({
          where: {
            createdAt: {
              gte: sevenDaysAgo
            }
          }
        })
      ]);

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        likedByMe: post.likes.length > 0,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        likes: undefined,
        _count: undefined
      }));

      return {
        data: postsWithLikeStatus,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get trending posts service error:', error);
      throw error;
    }
  }

  /**
   * Track post view
   */
  async trackView(postId, userId) {
    try {
      const existingView = await prisma.postView.findFirst({
        where: {
          postId,
          userId
        }
      });

      if (!existingView) {
        await prisma.postView.create({
          data: {
            postId,
            userId
          }
        });
      }
    } catch (error) {
      console.error('Track view service error:', error);
      throw error;
    }
  }
}

export default new PostService();