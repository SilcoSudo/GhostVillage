import mongoose from 'mongoose';
import { config } from './env.js';
import logger from './logger.js';

export const connectDB = async () => {
  try {
    const start = Date.now();
    console.log("🔗 Connecting to MongoDB...");
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000, // Timeout sau 5s thay vì 30s default
      socketTimeoutMS: 45000,
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host} in ${Date.now() - start}ms`);
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};
