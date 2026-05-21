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
import { handleCreateAuction, handleEditAuction, handleGetAllAuctions } from './controller';

const router = express.Router();

router
  .route('/')
  .get(isLoggedIn, validateQueryString(getAllAuctionsQuerySchema), handleGetAllAuctions)
  .post(isLoggedIn, isAdmin, validateSchema(createAuctionSchema), handleCreateAuction);

router
  .route('/:auctionId')
  .patch(isLoggedIn, isAdmin, validateSchema(editAuctionSchema), handleEditAuction);

export default router;
