/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata (pagination, etc)
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data
  };

  // Add metadata if provided (for pagination)
  if (meta) {
    Object.assign(response, meta);
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} errors - Validation errors (optional)
 */
export const errorResponse = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  // Add validation errors if provided
  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors
 */
export const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 'Validation failed', 400, errors);
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {String} resource - Resource name
 */
export const notFoundResponse = (res, resource = 'Resource') => {
  return errorResponse(res, `${resource} not found`, 404);
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message
 */
export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401);
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message
 */
export const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, 403);
};

/**
 * Paginated response formatter
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data
 * @param {Object} pagination - Pagination info { page, limit, total, totalPages }
 * @param {String} message - Success message
 */
export const paginatedResponse = (res, data, pagination, message = 'Data retrieved successfully') => {
  return successResponse(res, data, message, 200, {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    }
  });
};