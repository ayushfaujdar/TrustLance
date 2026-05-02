import cron from 'node-cron';
import { checkAutoRelease } from '../services/escrow.service';

/**
 * Auto-release cron job — runs every hour.
 * Sends 48h and 24h warnings, then auto-releases expired escrows.
 */
export const startAutoReleaseCron = (): void => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log(`⏰ [${new Date().toISOString()}] Running auto-release check...`);
    try {
      await checkAutoRelease();
      console.log(`✅ [${new Date().toISOString()}] Auto-release check completed`);
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Auto-release check failed:`, error);
    }
  });

  console.log('⏰ Auto-release cron job scheduled (every hour)');
};

export default { startAutoReleaseCron };
