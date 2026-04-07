import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class VotingService {
  /**
   * ADMIN: Create new voting
   */
  async createVoting(data, adminId) {
    const { title, question, questionImageUrl, votingType, deadline, options } = data;

    // Validate options
    if (!options || options.length < 2) {
      throw new Error('Voting must have at least 2 options');
    }

    // Create voting with options
    const voting = await prisma.voting.create({
      data: {
        title,
        question,
        questionImageUrl,
        votingType: votingType || 'single',
        deadline: new Date(deadline),
        createdBy: adminId,
        options: {
          create: options.map((opt, index) => ({
            optionText: opt.optionText,
            optionImageUrl: opt.optionImageUrl || null,
            orderIndex: index
          }))
        }
      },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    return voting;
  }

  /**
   * ADMIN: Get all votings with statistics
   */
  async getAllVotings(filters = {}) {
    const { page = 1, limit = 20, isActive, search } = filters;
    const skip = (page - 1) * limit;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { question: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [votings, total] = await Promise.all([
      prisma.voting.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          options: {
            orderBy: { orderIndex: 'asc' }
          },
          _count: {
            select: { responses: true }
          }
        }
      }),
      prisma.voting.count({ where })
    ]);

    // Add response count and status to each voting
    const votingsWithStats = votings.map(voting => ({
      ...voting,
      totalResponses: voting._count.responses,
      isExpired: new Date() > new Date(voting.deadline),
      _count: undefined
    }));

    return {
      data: votingsWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: skip + votings.length < total
      }
    };
  }

  /**
   * ADMIN: Get voting by ID with full details and results
   */
  async getVotingById(id) {
    const voting = await prisma.voting.findUnique({
      where: { id: parseInt(id) },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' }
        },
        responses: {
          include: {
            voting: false
          }
        }
      }
    });

    if (!voting) {
      throw new Error('Voting not found');
    }

    // Calculate statistics
    const totalResponses = voting.responses.length;
    const optionStats = voting.options.map(option => {
      const count = voting.responses.filter(response => {
        const selected = Array.isArray(response.selectedOptions) 
          ? response.selectedOptions 
          : JSON.parse(response.selectedOptions);
        return selected.includes(option.id);
      }).length;

      return {
        ...option,
        voteCount: count,
        percentage: totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(2) : 0
      };
    });

    return {
      ...voting,
      options: optionStats,
      totalResponses,
      isExpired: new Date() > new Date(voting.deadline),
      responses: undefined // Don't send raw responses to admin list
    };
  }

  /**
   * ADMIN: Update voting
   */
  async updateVoting(id, data, adminId) {
    const { title, question, questionImageUrl, votingType, deadline, isActive, options } = data;

    // Check if voting exists
    const existing = await prisma.voting.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      throw new Error('Voting not found');
    }

    // Update voting
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (question !== undefined) updateData.question = question;
    if (questionImageUrl !== undefined) updateData.questionImageUrl = questionImageUrl;
    if (votingType !== undefined) updateData.votingType = votingType;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (isActive !== undefined) updateData.isActive = isActive;

    const voting = await prisma.voting.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        options: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Delete existing options
      await prisma.votingOption.deleteMany({
        where: { votingId: parseInt(id) }
      });

      // Create new options
      await prisma.votingOption.createMany({
        data: options.map((opt, index) => ({
          votingId: parseInt(id),
          optionText: opt.optionText,
          optionImageUrl: opt.optionImageUrl || null,
          orderIndex: index
        }))
      });
    }

    return this.getVotingById(id);
  }

  /**
   * ADMIN: Extend voting deadline
   */
  async extendDeadline(id, newDeadline, adminId) {
    const voting = await prisma.voting.findUnique({
      where: { id: parseInt(id) }
    });

    if (!voting) {
      throw new Error('Voting not found');
    }

    const updated = await prisma.voting.update({
      where: { id: parseInt(id) },
      data: {
        deadline: new Date(newDeadline),
        updatedAt: new Date()
      },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    return updated;
  }

  /**
   * ADMIN: Delete voting
   */
  async deleteVoting(id) {
    const voting = await prisma.voting.findUnique({
      where: { id: parseInt(id) }
    });

    if (!voting) {
      throw new Error('Voting not found');
    }

    await prisma.voting.delete({
      where: { id: parseInt(id) }
    });

    return true;
  }

  /**
   * ADMIN: Get voting results/statistics
   */
  async getVotingResults(id) {
    const voting = await this.getVotingById(id);

    // Get detailed responses
    const responses = await prisma.votingResponse.findMany({
      where: { votingId: parseInt(id) },
      select: {
        userId: true,
        selectedOptions: true,
        answeredAt: true
      }
    });

    return {
      voting: {
        id: voting.id,
        uuid: voting.uuid,
        title: voting.title,
        question: voting.question,
        votingType: voting.votingType,
        deadline: voting.deadline,
        isExpired: voting.isExpired,
        totalResponses: voting.totalResponses
      },
      options: voting.options,
      responseDetails: responses
    };
  }

  /**
   * MOBILE: Get active votings for kader
   */
  async getActiveVotings(userId) {
    const now = new Date();

    // Get all active votings that haven't expired
    const votings = await prisma.voting.findMany({
      where: {
        isActive: true,
        deadline: {
          gte: now
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            optionText: true,
            optionImageUrl: true,
            orderIndex: true
          }
        },
        _count: {
          select: { responses: true }
        }
      }
    });

    // Check which votings user has already answered
    const votingsWithStatus = await Promise.all(
      votings.map(async (voting) => {
        const hasVoted = await prisma.votingResponse.findUnique({
          where: {
            votingId_userId: {
              votingId: voting.id,
              userId: userId
            }
          }
        });

        return {
          ...voting,
          totalResponses: voting._count.responses,
          hasVoted: !!hasVoted,
          _count: undefined
        };
      })
    );

    return votingsWithStatus;
  }

  /**
   * MOBILE: Get voting detail for kader
   */
  async getVotingDetail(id, userId) {
    const voting = await prisma.voting.findUnique({
      where: { id: parseInt(id) },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { responses: true }
        }
      }
    });

    if (!voting) {
      throw new Error('Voting not found');
    }

    // Check if user has voted
    const userResponse = await prisma.votingResponse.findUnique({
      where: {
        votingId_userId: {
          votingId: parseInt(id),
          userId: userId
        }
      }
    });

    return {
      ...voting,
      totalResponses: voting._count.responses,
      hasVoted: !!userResponse,
      userSelectedOptions: userResponse ? userResponse.selectedOptions : null,
      isExpired: new Date() > new Date(voting.deadline),
      _count: undefined
    };
  }

  /**
   * MOBILE: Submit vote (kader only)
   */
  async submitVote(votingId, userId, selectedOptions) {
    // Check if voting exists and is active
    const voting = await prisma.voting.findUnique({
      where: { id: parseInt(votingId) },
      include: { options: true }
    });

    if (!voting) {
      throw new Error('Voting not found');
    }

    if (!voting.isActive) {
      throw new Error('Voting is not active');
    }

    // Check if deadline has passed
    if (new Date() > new Date(voting.deadline)) {
      throw new Error('Voting deadline has passed');
    }

    // Check if user already voted
    const existing = await prisma.votingResponse.findUnique({
      where: {
        votingId_userId: {
          votingId: parseInt(votingId),
          userId: userId
        }
      }
    });

    if (existing) {
      throw new Error('You have already voted on this voting');
    }

    // Validate selected options
    if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      throw new Error('Please select at least one option');
    }

    // Validate based on voting type
    if (voting.votingType === 'single' && selectedOptions.length > 1) {
      throw new Error('You can only select one option for this voting');
    }

    // Validate that all selected options belong to this voting
    const validOptionIds = voting.options.map(opt => opt.id);
    const invalidOptions = selectedOptions.filter(optId => !validOptionIds.includes(optId));
    
    if (invalidOptions.length > 0) {
      throw new Error('Invalid option selected');
    }

    // Create response
    const response = await prisma.votingResponse.create({
      data: {
        votingId: parseInt(votingId),
        userId: userId,
        selectedOptions: selectedOptions
      }
    });

    return response;
  }

  /**
   * MOBILE: Get user's voting history
   */
  async getUserVotingHistory(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [responses, total] = await Promise.all([
      prisma.votingResponse.findMany({
        where: { userId: userId },
        skip,
        take: parseInt(limit),
        orderBy: { answeredAt: 'desc' },
        include: {
          voting: {
            include: {
              options: {
                orderBy: { orderIndex: 'asc' }
              }
            }
          }
        }
      }),
      prisma.votingResponse.count({ where: { userId: userId } })
    ]);

    const history = responses.map(response => ({
      id: response.id,
      votingId: response.votingId,
      voting: {
        id: response.voting.id,
        uuid: response.voting.uuid,
        title: response.voting.title,
        question: response.voting.question,
        questionImageUrl: response.voting.questionImageUrl,
        votingType: response.voting.votingType,
        deadline: response.voting.deadline,
        isExpired: new Date() > new Date(response.voting.deadline)
      },
      selectedOptions: response.selectedOptions,
      selectedOptionsDetail: response.voting.options.filter(opt => 
        response.selectedOptions.includes(opt.id)
      ),
      answeredAt: response.answeredAt
    }));

    return {
      data: history,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: skip + responses.length < total
      }
    };
  }

  /**
   * Get voting statistics for dashboard
   */
  async getVotingStats() {
    const now = new Date();

    const [total, active, expired, totalResponses] = await Promise.all([
      prisma.voting.count(),
      prisma.voting.count({
        where: {
          isActive: true,
          deadline: { gte: now }
        }
      }),
      prisma.voting.count({
        where: {
          deadline: { lt: now }
        }
      }),
      prisma.votingResponse.count()
    ]);

    return {
      total,
      active,
      expired,
      totalResponses
    };
  }

  /**
   * Get active votings for public (users can vote)
   * Used by kader/simpatisan to view and vote on active votings
   */
  async getActiveVotings(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const [votings, total] = await Promise.all([
      prisma.voting.findMany({
        where: {
          isActive: true,
          deadline: { gte: now }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          options: {
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              optionText: true,
              optionImageUrl: true,
              orderIndex: true
            }
          },
          _count: {
            select: { responses: true }
          }
        }
      }),
      prisma.voting.count({
        where: {
          isActive: true,
          deadline: { gte: now }
        }
      })
    ]);

    // Get user's votes for each voting
    const userVotesMap = {};
    if (userId) {
      const userVotes = await prisma.votingResponse.findMany({
        where: { userId },
        select: { votingId: true, selectedOptions: true }
      });
      userVotes.forEach(vote => {
        userVotesMap[vote.votingId] = vote.selectedOptions;
      });
    }

    // Get vote counts for each option
    const votingsWithOptions = await Promise.all(
      votings.map(async (voting) => {
        const optionVoteCounts = await prisma.votingOption.findMany({
          where: { votingId: voting.id },
          select: {
            id: true,
            _count: { select: { votes: true } }
          }
        });

        const optionsWithVotes = voting.options.map(opt => {
          const voteCount = optionVoteCounts.find(vc => vc.id === opt.id)?._count?.votes || 0;
          return {
            id: opt.id,
            text: opt.optionText,
            imageUrl: opt.optionImageUrl,
            voteCount
          };
        });

        return {
          id: voting.id,
          uuid: voting.uuid,
          title: voting.title,
          question: voting.question,
          questionImageUrl: voting.questionImageUrl,
          votingType: voting.votingType,
          startDate: voting.createdAt,
          endDate: voting.deadline,
          status: 'active',
          createdBy: {
            id: voting.createdBy,
            name: 'Admin',
            username: 'admin'
          },
          totalVotes: voting._count.responses,
          userHasVoted: !!userVotesMap[voting.id],
          userSelectedOptions: userVotesMap[voting.id] || [],
          options: optionsWithVotes,
          createdAt: voting.createdAt,
          updatedAt: voting.updatedAt
        };
      })
    );

    return {
      data: votingsWithOptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: skip + votings.length < total
      }
    };
  }
}

export default new VotingService();
