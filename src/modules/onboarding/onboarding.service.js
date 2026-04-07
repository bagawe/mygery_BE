import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class OnboardingService {
  /**
   * Get all active onboarding slides ordered by order ASC
   */
  async getSlides() {
    try {
      const slides = await prisma.onboardingSlide.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          uuid: true,
          order: true,
          title: true,
          description: true,
          imageUrl: true,
          backgroundColor: true,
          type: true,
          skipAllowed: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        data: slides,
        meta: {
          total: slides.length,
          activeCount: slides.length,
        },
      };
    } catch (error) {
      console.error('Get slides error:', error);
      throw error;
    }
  }

  /**
   * Get all onboarding slides including inactive (admin)
   */
  async getAllSlides(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [slides, total] = await Promise.all([
        prisma.onboardingSlide.findMany({
          skip,
          take: limit,
          orderBy: { order: 'asc' },
        }),
        prisma.onboardingSlide.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: slides,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
        },
      };
    } catch (error) {
      console.error('Get all slides error:', error);
      throw error;
    }
  }

  /**
   * Get single slide by ID or UUID
   */
  async getSlideById(id) {
    try {
      const slide = await prisma.onboardingSlide.findFirst({
        where: {
          OR: [{ id: parseInt(id) }, { uuid: id }],
        },
      });

      if (!slide) return null;
      return slide;
    } catch (error) {
      console.error('Get slide by ID error:', error);
      throw error;
    }
  }

  /**
   * Create new onboarding slide
   */
  async createSlide(data) {
    try {
      // Validate required fields
      if (!data.type) throw new Error('Type is required');
      if (!data.order && data.order !== 0) throw new Error('Order is required');

      // Validate at least one content field
      if (!data.title && !data.description && !data.imageUrl) {
        throw new Error('At least one of title, description, or imageUrl is required');
      }

      const slide = await prisma.onboardingSlide.create({
        data: {
          order: data.order,
          title: data.title || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          backgroundColor: data.backgroundColor || null,
          type: data.type,
          skipAllowed: data.skipAllowed !== undefined ? data.skipAllowed : true,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdBy: data.createdBy || null,
        },
      });

      return slide;
    } catch (error) {
      console.error('Create slide error:', error);
      throw error;
    }
  }

  /**
   * Update onboarding slide
   */
  async updateSlide(id, data) {
    try {
      const slide = await this.getSlideById(id);
      if (!slide) throw new Error('Slide not found');

      // Validate at least one content field if updating
      if (data.title === null && data.description === null && data.imageUrl === null) {
        if (!slide.title && !slide.description && !slide.imageUrl) {
          throw new Error('At least one of title, description, or imageUrl is required');
        }
      }

      const updated = await prisma.onboardingSlide.update({
        where: { id: slide.id },
        data: {
          ...(data.order !== undefined && { order: data.order }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.backgroundColor !== undefined && { backgroundColor: data.backgroundColor }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.skipAllowed !== undefined && { skipAllowed: data.skipAllowed }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      return updated;
    } catch (error) {
      console.error('Update slide error:', error);
      throw error;
    }
  }

  /**
   * Delete onboarding slide (hard delete)
   */
  async deleteSlide(id) {
    try {
      const slide = await this.getSlideById(id);
      if (!slide) throw new Error('Slide not found');

      await prisma.onboardingSlide.delete({
        where: { id: slide.id },
      });

      return true;
    } catch (error) {
      console.error('Delete slide error:', error);
      throw error;
    }
  }

  /**
   * Soft delete (deactivate) onboarding slide
   */
  async deactivateSlide(id) {
    try {
      const slide = await this.getSlideById(id);
      if (!slide) throw new Error('Slide not found');

      const updated = await prisma.onboardingSlide.update({
        where: { id: slide.id },
        data: { isActive: false },
      });

      return updated;
    } catch (error) {
      console.error('Deactivate slide error:', error);
      throw error;
    }
  }

  /**
   * Activate onboarding slide
   */
  async activateSlide(id) {
    try {
      const slide = await this.getSlideById(id);
      if (!slide) throw new Error('Slide not found');

      const updated = await prisma.onboardingSlide.update({
        where: { id: slide.id },
        data: { isActive: true },
      });

      return updated;
    } catch (error) {
      console.error('Activate slide error:', error);
      throw error;
    }
  }

  /**
   * Reorder slides
   */
  async reorderSlides(slides) {
    try {
      // slides format: [{ id, order }, ...]
      const updates = slides.map((slide) =>
        prisma.onboardingSlide.update({
          where: { id: slide.id },
          data: { order: slide.order },
        })
      );

      await prisma.$transaction(updates);
      return true;
    } catch (error) {
      console.error('Reorder slides error:', error);
      throw error;
    }
  }
}

export default new OnboardingService();
