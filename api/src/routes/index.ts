import { Router } from "express";

// Admin
import adminSessionRouter from "./admin/session.route";
import adminAdminsRouter from "./admin/admins.route";

const router = Router();

router.use('/admin/session', adminSessionRouter);
router.use('/admin/admins', adminAdminsRouter);

export default router