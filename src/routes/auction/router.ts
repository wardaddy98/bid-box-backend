import isAdmin from '@/middlewares/isAdmin';
import isLoggedIn from '@/middlewares/isLoggedIn';
import validateQueryString from '@/middlewares/validateQueryStrings';
import validateSchema from '@/middlewares/validateSchema';
import {
  createAuctionSchema,
  editAuctionSchema,
  getAllAuctionsQuerySchema,
} from '@/validations/auction.validation';
import express from 'express';
import {
  handleCancelledAuctions,
  handleCreateAuction,
  handleEditAuction,
  handleGetAllAuctions,
  handleGetSingleAuction,
  handleGetWinners,
  handleUpcomingAuctions,
} from './controller';

const router = express.Router();

router
  .route('/')
  .get(isLoggedIn, validateQueryString(getAllAuctionsQuerySchema), handleGetAllAuctions)
  .post(isLoggedIn, isAdmin, validateSchema(createAuctionSchema), handleCreateAuction);

router.route('/winners').get(isLoggedIn, handleGetWinners);

router.route('/upcoming').get(isLoggedIn, handleUpcomingAuctions);
router.route('/cancelled').get(isLoggedIn, handleCancelledAuctions);

router
  .route('/:auctionId')
  .get(isLoggedIn, handleGetSingleAuction)
  .patch(isLoggedIn, isAdmin, validateSchema(editAuctionSchema), handleEditAuction);

export default router;
