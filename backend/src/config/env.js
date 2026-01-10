import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  
  // Database
  mongodb: {
    // Prefer explicit base URI and DB name from seed script vars if provided
    // MONGO_URI (base, no DB) + DB_NAME => mongodb://host:port/DB_NAME
    // Fallbacks: MONGODB_URI may already include DB path; if so, we keep it.
    uri: (() => {
      const base = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const dbName = process.env.DB_NAME || process.env.MONGODB_DB_NAME || 'GhostVillage';
      // If base already contains a database segment after the host (e.g., /something), respect it
      try {
        const hasDbPath = /\/[^/?]+(\?|$)/.test(base);
        return hasDbPath ? base : `${base.replace(/\/+$/, '')}/${dbName}`;
      } catch {
        return `${base}/${dbName}`;
      }
    })()
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  // Bcrypt
  bcryptRounds: process.env.BCRYPT_ROUNDS || '12',
  
  // CORS
  cors: {
    origin: (origin, callback) => {
      // Mặc định cho local dev (Vite/CRA): 5173, 4173, 3000
      const defaultOrigins = process.env.NODE_ENV === 'production'
        ? '' // Yêu cầu cấu hình CORS_ORIGIN rõ ràng khi production
        : 'http://localhost:5173,http://localhost:4173,http://localhost:3000';
      const allowedOrigins = (process.env.CORS_ORIGIN || defaultOrigins)
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

      // Allow requests with no origin (like mobile apps or server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== 'production') {
        // In development, be more permissive
        callback(null, true);
      } else {
        // In production, strict CORS
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    optionsSuccessStatus: 200
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000000000 : 100000000000, // Production: 100, Dev: 10k (effectively disabled)
    skip: (req, res) => {
      return process.env.NODE_ENV !== 'production'; // Skip rate limiting in development
    },
    trustProxy: process.env.NODE_ENV === 'production' ? 1 : false, // Trust first proxy in production
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  },
  
  // File upload
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
  },
  
  // Pagination
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },
  
  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback'
  }
};
