import { Router } from "express";
import * as adminSessionController from "@controllers/admin/session.controller";
import validateBody from "@middleware/validate"

import { adminSessionSchema } from "@schemas/adminSession.schema";
import asyncHandler from "@middleware/asyncHandler";

const router = Router();

router.get('/', 
  asyncHandler(adminSessionController.getAdminSession)
);

router.post('/', 
  validateBody(adminSessionSchema),
  asyncHandler(adminSessionController.postAdminSession)
);

export default router;