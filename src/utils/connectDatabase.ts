import constants from '@/constants';
import { initializeAuctionStatusCron } from '@/cron/auction.cron';
import { mongoose } from '@typegoose/typegoose';
import logger from './logger';

const { DB_URI } = constants;

export default async function () {
  try {
    await mongoose.connect(DB_URI);
    logger.info('Database connected successfully');
    initializeAuctionStatusCron();
  } catch (err) {
    logger.error('Database connection failed', err);
  }
}
