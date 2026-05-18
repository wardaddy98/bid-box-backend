import ProductRouter from '@/routes/product/router';
import UserRouter from '@/routes/user/router';
import express, { Router } from 'express';
const router: Router = express.Router();

router.use('/user', UserRouter);
router.use('/product', ProductRouter);

export default router;
