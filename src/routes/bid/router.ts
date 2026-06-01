import isAdmin from '@/middlewares/isAdmin';
import isLoggedIn from '@/middlewares/isLoggedIn';
import validateSchema from '@/middlewares/validateSchema';
import { createBidBackSchema, placeBidSchema } from '@/validations/bid.validation';
import express from 'express';
import { handleCreateBidPack, handleGetBidPacks, handlePlaceBid } from './controller';

const router = express.Router();

router.route('/').post(isLoggedIn, validateSchema(placeBidSchema), handlePlaceBid);

router
  .route('/bid-pack')
  .get(isLoggedIn, handleGetBidPacks)
  .post(isLoggedIn, isAdmin, validateSchema(createBidBackSchema), handleCreateBidPack);

export default router;
