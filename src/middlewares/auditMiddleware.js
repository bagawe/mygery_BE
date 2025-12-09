import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Audit logging middleware
export const auditLogger = (action, options = {}) => {
  return async (req, res, next) => {
    const { 
      logBefore = false, 
      logAfter = true, 
      includeBody = false,
      includeQuery = false,
      skipSuccessfulRequests = false
    } = options;

    const getClientInfo = () => ({
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    });

    const createLogData = (success = true, details = {}) => ({
      userId: req.user?.id || null,
      action,
      details: {
        endpoint: `${req.method} ${req.path}`,
        ...details,
        ...(includeBody && req.body ? { requestBody: req.body } : {}),
        ...(includeQuery && req.query ? { queryParams: req.query } : {}),
      },
      success,
      ...getClientInfo()
    });

    // Log before request processing
    if (logBefore) {
      try {
        await prisma.logActivity.create({
          data: createLogData(true, { phase: 'before' })
        });
      } catch (error) {
        console.error('Audit logging error (before):', error);
      }
    }

    // Capture original res.json to log after response
    if (logAfter) {
      const originalJson = res.json;
      let responseData = null;
      let responseStatus = res.statusCode;

      res.json = function(data) {
        responseData = data;
        responseStatus = res.statusCode;
        return originalJson.call(this, data);
      };

      // Log after response
      res.on('finish', async () => {
        try {
          const isSuccess = responseStatus >= 200 && responseStatus < 400;
          
          // Skip logging successful requests if specified
          if (skipSuccessfulRequests && isSuccess) {
            return;
          }

          await prisma.logActivity.create({
            data: createLogData(isSuccess, {
              phase: 'after',
              statusCode: responseStatus,
              ...(responseData ? { response: responseData } : {})
            })
          });
        } catch (error) {
          console.error('Audit logging error (after):', error);
        }
      });
    }

    next();
  };
};

// Specific audit loggers for different actions
export const loginAttemptLogger = auditLogger('login_attempt', {
  logBefore: true,
  includeBody: false // Don't log passwords
});

export const dataAccessLogger = auditLogger('data_access', {
  logAfter: true,
  includeQuery: true,
  skipSuccessfulRequests: true // Only log failed attempts
});

export const dataModificationLogger = auditLogger('data_modification', {
  logBefore: true,
  logAfter: true,
  includeBody: true
});

export const adminActionLogger = auditLogger('admin_action', {
  logBefore: true,
  logAfter: true,
  includeBody: true,
  includeQuery: true
});

// Security event logger
export const securityEventLogger = {
  async logSuspiciousActivity(req, eventType, details = {}) {
    try {
      await prisma.logActivity.create({
        data: {
          userId: req.user?.id || null,
          action: `security_event_${eventType}`,
          details: {
            endpoint: `${req.method} ${req.path}`,
            eventType,
            ...details
          },
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
          success: false
        }
      });
    } catch (error) {
      console.error('Security event logging error:', error);
    }
  },

  async logFailedAuthentication(req, reason, details = {}) {
    await this.logSuspiciousActivity(req, 'failed_authentication', {
      reason,
      ...details
    });
  },

  async logUnauthorizedAccess(req, resource, details = {}) {
    await this.logSuspiciousActivity(req, 'unauthorized_access', {
      resource,
      ...details
    });
  },

  async logSuspiciousRequest(req, reason, details = {}) {
    await this.logSuspiciousActivity(req, 'suspicious_request', {
      reason,
      ...details
    });
  }
};

// Activity logger for automatic logging of user actions
export const activityLogger = async (req, res, next) => {
  // Skip logging for certain endpoints
  const skipPaths = ['/health', '/metrics', '/favicon.ico'];
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Skip logging for GET requests to reduce noise
  if (req.method === 'GET') {
    return next();
  }

  const originalJson = res.json;
  res.json = function(data) {
    // Log the activity after response
    setImmediate(async () => {
      try {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
        const action = getActionFromRequest(req);
        
        if (action) {
          await prisma.logActivity.create({
            data: {
              userId: req.user?.id || null,
              action,
              details: {
                endpoint: `${req.method} ${req.path}`,
                statusCode: res.statusCode,
                success: isSuccess
              },
              ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
              userAgent: req.headers['user-agent'],
              success: isSuccess
            }
          });
        }
      } catch (error) {
        console.error('Activity logging error:', error);
      }
    });

    return originalJson.call(this, data);
  };

  next();
};

// Helper function to determine action from request
function getActionFromRequest(req) {
  const { method, path } = req;
  const pathSegments = path.split('/').filter(Boolean);

  // Define action mapping
  const actionMap = {
    'POST': {
      'auth/register': 'user_register',
      'auth/login': 'user_login',
      'auth/logout': 'user_logout',
      'auth/refresh-token': 'token_refresh'
    },
    'PUT': {
      'users': 'user_update',
      'profile': 'profile_update'
    },
    'DELETE': {
      'users': 'user_delete'
    },
    'PATCH': {
      'users': 'user_partial_update'
    }
  };

  const methodActions = actionMap[method];
  if (!methodActions) return null;

  // Find matching action
  for (const [pattern, action] of Object.entries(methodActions)) {
    if (path.includes(pattern)) {
      return action;
    }
  }

  return `${method.toLowerCase()}_${pathSegments[0] || 'unknown'}`;
}