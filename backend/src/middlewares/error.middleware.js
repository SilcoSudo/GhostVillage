import { config } from "../config/env.js";

export const errorMiddleware = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Chỉ hiện stack trace khi ở môi trường development
    stack: config.nodeEnv === "production" ? null : err.stack,
  });
};
