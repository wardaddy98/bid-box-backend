import AuctionRouter from '@/routes/auction/router';
import BidRouter from '@/routes/bid/router';
import ProductRouter from '@/routes/product/router';
import UserRouter from '@/routes/user/router';
import express, { Router } from 'express';
const router: Router = express.Router();

router.use('/user', UserRouter);
router.use('/product', ProductRouter);
router.use('/auction', AuctionRouter);
router.use('/bid', BidRouter);

export default router;
