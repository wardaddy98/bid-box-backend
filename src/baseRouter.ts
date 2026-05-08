import UserRouter from '@/routes/user/router';
import express, { Router } from 'express';
const router: Router = express.Router();

router.use('/user', UserRouter);

export default router;
