import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// =============================================================================
// CORS Configuration
// =============================================================================
// Configures which origins can access the API
// Set ALLOWED_ORIGINS in .env (comma-separated) or leave empty for development mode

const getAllowedOrigins = (): string[] | '*' => {
  const originsEnv = process.env.ALLOWED_ORIGINS;

  if (!originsEnv || originsEnv === '*') {
    // Development mode - allow all origins
    console.log('⚠️  CORS: Allowing all origins (development mode)');
    return '*';
  }

  const origins = originsEnv.split(',').map(origin => origin.trim());
  console.log('🔒 CORS: Restricting to origins:', origins);
  return origins;
};

export const corsMiddleware = () => {
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins === '*') {
    return cors();
  }

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('❌ CORS: Blocked request from origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
};

// =============================================================================
// Rate Limiting
// =============================================================================
// Protects against brute force attacks on authentication endpoints

// General API rate limit
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: {
    message: 'Too many requests, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.RATE_LIMIT_ENABLED === 'false',
});

// Strict rate limit for authentication endpoints (login, register, password reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes per IP
  message: {
    message: 'Too many authentication attempts, please try again after 15 minutes.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.RATE_LIMIT_ENABLED === 'false',
});

// Rate limit for password reset requests (even stricter)
export const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 reset requests per hour per IP
  message: {
    message: 'Too many password reset requests, please try again after 1 hour.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.RATE_LIMIT_ENABLED === 'false',
});

// =============================================================================
// Helmet Security Headers
// =============================================================================
// Adds various HTTP headers to protect against common vulnerabilities

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disabled for SPA compatibility
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// =============================================================================
// Registration Control
// =============================================================================
// Middleware to control whether new user registration is allowed

export const registrationGuard = (req: any, res: any, next: any) => {
  const registrationEnabled = process.env.REGISTRATION_ENABLED !== 'false';

  if (!registrationEnabled) {
    console.log('🚫 Registration attempt blocked (registration is disabled)');
    return res.status(403).json({
      message: 'Registration is currently disabled. Contact the administrator.'
    });
  }

  next();
};

// =============================================================================
// Security Logger (sanitized - no sensitive data)
// =============================================================================

export const securityLogger = (action: string, details: Record<string, any>) => {
  // Never log sensitive data like passwords, tokens, etc.
  const sanitized = { ...details };
  const sensitiveKeys = ['password', 'token', 'resetToken', 'jwt', 'secret'];

  sensitiveKeys.forEach(key => {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  });

  console.log(`🔐 Security: ${action}`, sanitized);
};
