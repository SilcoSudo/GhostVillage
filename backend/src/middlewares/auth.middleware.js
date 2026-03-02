// import jwt from 'jsonwebtoken';
// import { config } from '../config/env.js';

// /**
//  * Auth Middleware
//  * Verifies JWT token and attaches user info to request
//  */

// export const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'No token provided'
//       });
//     }

//     const decoded = jwt.verify(token, config.jwt.secret);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid token',
//       error: error.message
//     });
//   }
// };

// /**
//  * Error Middleware
//  * Global error handler
//  */

// export const errorMiddleware = (err, req, res, next) => {
//   console.error('Error:', err);

//   const status = err.status || 500;
//   const message = err.message || 'Internal Server Error';

//   res.status(status).json({
//     success: false,
//     message,
//     ...(process.env.NODE_ENV === 'development' && { error: err })
//   });
// };
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import User from "../modules/user/userModel.js";

/**
 * Middleware: Kiểm tra Token (Authentication)
 * Dùng để bảo vệ các route cần đăng nhập
 */
export const authMiddleware = async (req, res, next) => {
  let token;

  // 1. Lấy token từ header Authorization: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify Token
      const decoded = jwt.verify(token, config.jwt.secret);

      // 3. Lấy User từ DB và gắn vào req.user để các controller sau dùng
      // .select('-password') để không lấy trường password
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
};

/**
 * Middleware: Phân quyền (Authorization)
 * Ví dụ: authorize('admin')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
/**
 * Socket.IO Middleware: Authenticate Socket Connection
 * Verifies JWT token for WebSocket connection
 */
export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("No token provided"));
    }

    // Verify JWT
    const decoded = jwt.verify(token, config.jwt.secret);

    // Fetch user from database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach userId to socket object
    socket.userId = user._id;
    socket.user = user;

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Socket authentication failed"));
  }
};