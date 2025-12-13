import { Router } from "express";
import adminSessionRouter from "./admin/session.route";

const router = Router();

router.use('/admin/session', adminSessionRouter);

export default router