import AuctionRouter from '@/routes/auction/router';
import BidRouter from '@/routes/bid/router';
import OrderRouter from '@/routes/order/router';
import ProductRouter from '@/routes/product/router';
import UploadRouter from '@/routes/upload/router';
import UserRouter from '@/routes/user/router';
import express, { Router } from 'express';
const router: Router = express.Router();

router.use('/user', UserRouter);
router.use('/product', ProductRouter);
router.use('/auction', AuctionRouter);
router.use('/bid', BidRouter);
router.use('/upload', UploadRouter);
router.use('/order', OrderRouter);

export default router;
