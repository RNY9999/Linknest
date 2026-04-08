import { Router } from "express";
import { validateBody, validateQuery } from "@middleware/validate"
import asyncHandler from "@middleware/asyncHandler";
import { registerAdminSchema } from "@schemas/registerAdmin.schema";
import * as adminController from "@controllers/admin/admins.controller";
import verifySessionMiddleware from "@middleware/requireAdminSession";
import { getAdminsQuerySchema } from "@schemas/getAdminsQuery.schema";
import { getAdminDetailQuerySchema } from "@schemas/getAdminDetail.schema";

const router = Router();

router.get('/',
  asyncHandler(verifySessionMiddleware),
  validateQuery(getAdminsQuerySchema),
  asyncHandler(adminController.getAdmins)
);

router.post('/', 
  validateBody(registerAdminSchema),
  asyncHandler(adminController.postAdmin)
);

router.get(':adminId',
  asyncHandler(verifySessionMiddleware),
  validateQuery(getAdminDetailQuerySchema),
  asyncHandler(adminController.getAdminDetail)
);

export default router;