import onboardingService from './onboarding.service.js';
import { successResponse, errorResponse } from '../../utils/responseFormatter.js';

class OnboardingController {
  /**
   * GET /api/onboarding/slides
   * Public endpoint - get active slides for mobile app
   */
  async getSlides(req, res) {
    try {
      const result = await onboardingService.getSlides();
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get slides error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * GET /api/onboarding/all (Admin only)
   * Get all slides including inactive
   */
  async getAllSlides(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await onboardingService.getAllSlides(page, limit);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get all slides error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * POST /api/onboarding/slides (Admin only)
   * Create new slide
   */
  async createSlide(req, res) {
    try {
      const { order, title, description, imageUrl, backgroundColor, type, skipAllowed, isActive } = req.body;

      const slide = await onboardingService.createSlide({
        order,
        title,
        description,
        imageUrl,
        backgroundColor,
        type,
        skipAllowed,
        isActive,
        createdBy: req.user?.userId,
      });

      return successResponse(res, slide, 'Slide created successfully', 201);
    } catch (error) {
      console.error('Create slide error:', error);
      return errorResponse(res, error.message);
    }
  }

  /**
   * PUT /api/onboarding/slides/:id (Admin only)
   * Update slide
   */
  async updateSlide(req, res) {
    try {
      const { id } = req.params;
      const { order, title, description, imageUrl, backgroundColor, type, skipAllowed, isActive } = req.body;

      if (!id) {
        return errorResponse(res, 'Slide ID is required', 400);
      }

      const slide = await onboardingService.updateSlide(id, {
        order,
        title,
        description,
        imageUrl,
        backgroundColor,
        type,
        skipAllowed,
        isActive,
      });

      return successResponse(res, slide, 'Slide updated successfully');
    } catch (error) {
      console.error('Update slide error:', error);
      if (error.message === 'Slide not found') {
        return errorResponse(res, error.message, 404);
      }
      return errorResponse(res, error.message);
    }
  }

  /**
   * DELETE /api/onboarding/slides/:id (Admin only)
   * Hard delete slide
   */
  async deleteSlide(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return errorResponse(res, 'Slide ID is required', 400);
      }

      await onboardingService.deleteSlide(id);
      return successResponse(res, null, 'Slide deleted successfully');
    } catch (error) {
      console.error('Delete slide error:', error);
      if (error.message === 'Slide not found') {
        return errorResponse(res, error.message, 404);
      }
      return errorResponse(res, error.message);
    }
  }

  /**
   * PUT /api/onboarding/slides/:id/deactivate (Admin only)
   * Soft delete (deactivate) slide
   */
  async deactivateSlide(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return errorResponse(res, 'Slide ID is required', 400);
      }

      const slide = await onboardingService.deactivateSlide(id);
      return successResponse(res, slide, 'Slide deactivated successfully');
    } catch (error) {
      console.error('Deactivate slide error:', error);
      if (error.message === 'Slide not found') {
        return errorResponse(res, error.message, 404);
      }
      return errorResponse(res, error.message);
    }
  }

  /**
   * PUT /api/onboarding/slides/:id/activate (Admin only)
   * Activate slide
   */
  async activateSlide(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return errorResponse(res, 'Slide ID is required', 400);
      }

      const slide = await onboardingService.activateSlide(id);
      return successResponse(res, slide, 'Slide activated successfully');
    } catch (error) {
      console.error('Activate slide error:', error);
      if (error.message === 'Slide not found') {
        return errorResponse(res, error.message, 404);
      }
      return errorResponse(res, error.message);
    }
  }

  /**
   * POST /api/onboarding/reorder (Admin only)
   * Reorder slides
   */
  async reorderSlides(req, res) {
    try {
      const { slides } = req.body;

      if (!Array.isArray(slides)) {
        return errorResponse(res, 'Slides array is required', 400);
      }

      await onboardingService.reorderSlides(slides);
      return successResponse(res, null, 'Slides reordered successfully');
    } catch (error) {
      console.error('Reorder slides error:', error);
      return errorResponse(res, error.message);
    }
  }
}

export default new OnboardingController();
