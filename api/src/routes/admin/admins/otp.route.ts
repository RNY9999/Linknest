import verifySessionMiddleware from "@middleware/requireAdminSession";
import { Router } from "express";
import * as adminsOtpController from '@controllers/admin/admins/otp.controller';
import asyncHandler from "@middleware/asyncHandler";
import verifyCsrfMiddleware from "@middleware/requireAdminCsrf";
import { validateBody } from "@middleware/validate";
import { adminOtpSchema } from "@schemas/adminOtp.schema";

const router = Router();

router.get('/',
  asyncHandler(verifySessionMiddleware),
  asyncHandler(adminsOtpController.getOtp)
);

router.post('/', 
  asyncHandler(verifySessionMiddleware),
  asyncHandler(verifyCsrfMiddleware),
  asyncHandler(adminsOtpController.postOtp)
);

router.patch('/',
  asyncHandler(verifySessionMiddleware),
  asyncHandler(verifyCsrfMiddleware),
  validateBody(adminOtpSchema),
  asyncHandler(adminsOtpController.patchOtp)
);

export default router;