import verifySessionMiddleware from "@middleware/requireAdminSession";
import { Router } from "express";
import * as adminsOtpController from '@controllers/admin/admins/otp.controller';
import asyncHandler from "@middleware/asyncHandler";
import verifyCsrfMiddleware from "@middleware/requireAdminCsrf";

const router = Router();

router.post('/', 
  asyncHandler(verifySessionMiddleware),
  asyncHandler(verifyCsrfMiddleware),
  asyncHandler(adminsOtpController.postOtp)
);

export default router;