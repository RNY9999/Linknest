import { Router } from "express";

// Admin
import adminSessionRouter from "./admin/session.route";
import adminAdminsRouter from "./admin/admins.route";
import adminAdminsOtpRouter from "./admin/admins/otp.route";

const router = Router();

router.use('/admin/session', adminSessionRouter);
router.use('/admin/admins', adminAdminsRouter);
router.use('/admin/admins/otp', adminAdminsOtpRouter);

export default router