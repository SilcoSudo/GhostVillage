import app from './app.js';
import { connectDB } from './config/db.js';
import logger from './config/logger.js';
import { config } from './config/env.js';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      console.log(`✓ Server started at http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('Server shutting down...');
  process.exit(0);
});
