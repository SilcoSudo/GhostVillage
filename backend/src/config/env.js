import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Backend API port and public URL
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  appUrl: process.env.APP_URL || "http://localhost:5000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Database
  mongodb: {
    // Prefer explicit base URI and DB name from seed script vars if provided
    // MONGO_URI (base, no DB) + DB_NAME => mongodb://host:port/DB_NAME
    // Fallbacks: MONGODB_URI may already include DB path; if so, we keep it.
    uri: (() => {
      const base =
        process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017";
      const dbName =
        process.env.DB_NAME || process.env.MONGODB_DB_NAME || "GhostVillage";
      // If base already contains a database segment after the host (e.g., /something), respect it
      // try {
      //   const hasDbPath = /\/[^/?]+(\?|$)/.test(base);
      //   return hasDbPath ? base : `${base.replace(/\/+$/, "")}/${dbName}`;
      // } catch {
      //   return `${base}/${dbName}`;
      // }

      // 3. Xử lý sạch chuỗi base (bỏ dấu / ở cuối nếu có)
      if (base.endsWith("/")) {
        base = base.slice(0, -1);
      }

      // 4. Kiểm tra xem base đã có tên DB chưa (để tránh nối thành Test_Hung/Test_Hung)
      // Logic đơn giản: Nếu base chứa tên DB rồi thì giữ nguyên, chưa có thì nối thêm
      // Nhưng để chắc ăn cho trường hợp của bạn, ta ÉP CỨNG luôn:

      // Nếu chuỗi base chỉ là server thuần (ví dụ mongodb://localhost:27017), nối tên DB vào
      if (!base.includes(`/${dbName}`)) {
        return `${base}/${dbName}`;
      }

      return base;
    })(),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  // Bcrypt
  bcryptRounds: process.env.BCRYPT_ROUNDS || "12",

  // CORS
  cors: {
    origin: (origin, callback) => {
      // Mặc định cho local dev (Vite/CRA): 5173, 4173, 3000
      const defaultOrigins =
        process.env.NODE_ENV === "production"
          ? "" // Yêu cầu cấu hình CORS_ORIGIN rõ ràng khi production
          : "http://localhost:5173,http://localhost:4173,http://localhost:3000";
      const allowedOrigins = (process.env.CORS_ORIGIN || defaultOrigins)
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);

      // Allow requests with no origin (like mobile apps or server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== "production") {
        // In development, be more permissive
        callback(null, true);
      } else {
        // In production, strict CORS
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    optionsSuccessStatus: 200,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 1000000000 : 100000000000, // Production: 100, Dev: 10k (effectively disabled)
    skip: (req, res) => {
      return process.env.NODE_ENV !== "production"; // Skip rate limiting in development
    },
    trustProxy: process.env.NODE_ENV === "production" ? 1 : false, // Trust first proxy in production
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  },

  // File upload
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif"],
  },

  // Pagination
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true" || false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || "your-email@gmail.com",
      pass: process.env.EMAIL_PASS || "your-app-password",
    },
    from: process.env.EMAIL_FROM || "noreply@ghostvillage.com",
  },

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:5000/api/v1/auth/google/callback",
  },
  // Email (nodemailer)
  email: (() => {
    const service = process.env.EMAIL_SERVICE;
    const isGmail = (service || "").toLowerCase() === "gmail";

    const host =
      process.env.EMAIL_HOST ||
      (isGmail ? "smtp.gmail.com" : "smtp.mailtrap.io");

    const port = process.env.EMAIL_PORT
      ? Number(process.env.EMAIL_PORT)
      : isGmail
      ? 465
      : 587;

    const secure = process.env.EMAIL_SECURE
      ? process.env.EMAIL_SECURE === "true"
      : isGmail
      ? true
      : false;

    return {
      service: service || undefined,
      host,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
      from:
        process.env.EMAIL_FROM ||
        `"Ghost Village" <no-reply@ghostvillage.local>`,
    };
  })(),
};
