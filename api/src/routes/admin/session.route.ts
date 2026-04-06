import { Router } from "express";
import * as adminSessionController from "@controllers/admin/session.controller";
import { validateBody } from "@middleware/validate"

import { adminSessionSchema } from "@schemas/adminSession.schema";
import asyncHandler from "@middleware/asyncHandler";
import { setAdminLoginLog } from "@middleware/adminLoginLog";

const router = Router();

router.get('/', 
  asyncHandler(adminSessionController.getAdminSession)
);

router.post('/', 
  setAdminLoginLog,
  validateBody(adminSessionSchema),
  asyncHandler(adminSessionController.postAdminSession)
);

router.delete('/', 
  asyncHandler(adminSessionController.deleteAdminSession)
);

router.post('/refresh',
  asyncHandler(adminSessionController.postAdminSessionRefresh)
);

export default router;