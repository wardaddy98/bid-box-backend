import { ApiError, InternalServerError } from '@/middlewares/handleError';
import mongoose, { ClientSession } from 'mongoose';
import logger from './logger';

const handleTransaction = async <T>(
  callback: (session: ClientSession) => Promise<T>,
  rollbackCallback?: () => Promise<void>,
): Promise<T> => {
  const session = await mongoose.startSession({});

  try {
    session.startTransaction({
      writeConcern: {
        w: 'majority',
      },
      readConcern: {
        level: 'snapshot',
      },
    });

    const result = await callback(session);

    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    if (rollbackCallback) {
      await rollbackCallback();
    }

    if (err instanceof ApiError) {
      throw err;
    } else {
      logger.error('Internal Server Error', err);
      throw new InternalServerError();
    }
  } finally {
    session.endSession();
  }
};

export default handleTransaction;
