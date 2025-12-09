import { z } from 'zod';

// Generic validation middleware factory
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated/transformed data
      req[source] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.received
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errorMessages
        });
      }
      
      // Handle other types of errors
      return res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // ID validations
  id: z.coerce.number().int().positive('ID must be a positive integer'),
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // Text fields
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email cannot exceed 255 characters')
    .toLowerCase(),
  
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Optional password for updates
  passwordOptional: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .optional(),
  
  // URL validation
  url: z.string().url('Invalid URL format').optional(),
  
  // Phone number
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional(),
  
  // Date validations
  dateString: z.string().datetime('Invalid date format'),
  
  // File upload
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    size: z.number().max(5 * 1024 * 1024, 'File size cannot exceed 5MB'), // 5MB limit
    buffer: z.any()
  })
};

// Auth validation schemas
export const authSchemas = {
  register: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    username: commonSchemas.username,
    password: commonSchemas.password
  }),
  
  login: z.object({
    identifier: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required')
  }),
  
  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.password,
    confirmPassword: z.string().min(1, 'Password confirmation is required')
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  
  forgotPassword: z.object({
    email: commonSchemas.email
  }),
  
  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: commonSchemas.password,
    confirmPassword: z.string().min(1, 'Password confirmation is required')
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
};

// User validation schemas
export const userSchemas = {
  create: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    username: commonSchemas.username,
    password: commonSchemas.password,
    role: z.enum(['jobseeker', 'company', 'admin']).default('jobseeker')
  }),
  
  update: z.object({
    name: commonSchemas.name.optional(),
    email: commonSchemas.email.optional(),
    username: commonSchemas.username.optional(),
    password: commonSchemas.passwordOptional,
    isActive: z.boolean().optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
  }),
  
  profileUpdate: z.object({
    name: commonSchemas.name.optional(),
    phone: commonSchemas.phone,
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
    website: commonSchemas.url,
    location: z.string().max(100, 'Location cannot exceed 100 characters').optional(),
    skills: z.array(z.string().max(50, 'Skill cannot exceed 50 characters')).max(20, 'Cannot have more than 20 skills').optional(),
    experience: z.array(z.object({
      company: z.string().max(100, 'Company name cannot exceed 100 characters'),
      position: z.string().max(100, 'Position cannot exceed 100 characters'),
      startDate: commonSchemas.dateString,
      endDate: commonSchemas.dateString.optional(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional()
    })).optional()
  }),
  
  getUserById: z.object({
    id: commonSchemas.id
  }),
  
  getUserByUuid: z.object({
    uuid: commonSchemas.uuid
  }),
  
  listUsers: commonSchemas.pagination.extend({
    search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
    role: z.enum(['jobseeker', 'company', 'admin']).optional(),
    isActive: z.coerce.boolean().optional()
  })
};

// Specific validation middleware functions
export const validateAuth = {
  register: validateRequest(authSchemas.register),
  login: validateRequest(authSchemas.login),
  refreshToken: validateRequest(authSchemas.refreshToken),
  changePassword: validateRequest(authSchemas.changePassword),
  forgotPassword: validateRequest(authSchemas.forgotPassword),
  resetPassword: validateRequest(authSchemas.resetPassword)
};

export const validateUser = {
  create: validateRequest(userSchemas.create),
  update: validateRequest(userSchemas.update),
  profileUpdate: validateRequest(userSchemas.profileUpdate),
  getUserById: validateRequest(userSchemas.getUserById, 'params'),
  getUserByUuid: validateRequest(userSchemas.getUserByUuid, 'params'),
  listUsers: validateRequest(userSchemas.listUsers, 'query')
};

// File upload validation
export const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files ? Object.values(req.files).flat() : [req.file];
    
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds maximum size of ${maxSize / (1024 * 1024)}MB`
        });
      }
      
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} has invalid type. Allowed types: ${allowedTypes.join(', ')}`
        });
      }
    }
    
    next();
  };
};

// Image upload validation
export const validateImageUpload = validateFileUpload(
  ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  2 * 1024 * 1024 // 2MB
);

// Document upload validation
export const validateDocumentUpload = validateFileUpload(
  ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  10 * 1024 * 1024 // 10MB
);

// Custom validation helpers
export const validateOptionalFields = (schema) => {
  return (req, res, next) => {
    // Remove undefined and empty string values
    const cleanData = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined && value !== '' && value !== null) {
        cleanData[key] = value;
      }
    }
    
    req.body = cleanData;
    
    // If no fields provided, skip validation
    if (Object.keys(cleanData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided'
      });
    }
    
    return validateRequest(schema)(req, res, next);
  };
};

// Sanitize and validate query parameters
export const validateAndSanitizeQuery = (schema) => {
  return (req, res, next) => {
    try {
      // Convert string values to appropriate types
      const query = { ...req.query };
      
      // Handle common query parameter conversions
      for (const [key, value] of Object.entries(query)) {
        if (value === 'true') query[key] = true;
        else if (value === 'false') query[key] = false;
        else if (!isNaN(value) && !isNaN(parseFloat(value))) {
          query[key] = parseFloat(value);
        }
      }
      
      const validatedQuery = schema.parse(query);
      req.query = validatedQuery;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: errorMessages
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };
};