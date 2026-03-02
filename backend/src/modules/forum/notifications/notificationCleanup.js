import cron from 'node-cron';
import Notification from './notificationModel.js';

/**
 * Start cleanup job to delete notifications older than 15 days
 * Runs daily at 2 AM
 */
export const startNotificationCleanup = () => {
  // Schedule to run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      const result = await Notification.deleteMany({
        createdAt: { $lt: fifteenDaysAgo }
      });

      console.log(`✓ Notification Cleanup: Deleted ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('✗ Error in notification cleanup:', error.message);
    }
  });

  console.log('✓ Notification cleanup job started (runs daily at 2 AM)');
};
