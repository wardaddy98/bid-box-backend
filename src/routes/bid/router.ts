import isLoggedIn from '@/middlewares/isLoggedIn';
import validateSchema from '@/middlewares/validateSchema';
import { placeBidSchema } from '@/validations/bid.validation';
import express from 'express';
import { handlePlaceBid } from './controller';

const router = express.Router();

router.post('/', isLoggedIn, validateSchema(placeBidSchema), handlePlaceBid);

export default router;
