import { Router } from "express";
import { validateBody, validateQuery, validateParams } from "@middleware/validate"
import asyncHandler from "@middleware/asyncHandler";
import { registerAdminSchema } from "@schemas/registerAdmin.schema";
import * as adminController from "@controllers/admin/admins.controller";
import verifySessionMiddleware from "@middleware/requireAdminSession";
import { getAdminsQuerySchema } from "@schemas/getAdminsQuery.schema";
import { adminIdParamSchema } from "@schemas/adminIdParams.schema";
import { patchOtherAdminSchema } from "@schemas/admin/admins/adminId/patch/body.schema";
import verifyCsrfMiddleware from "@middleware/requireAdminCsrf";

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

router.get('/:adminId',
  asyncHandler(verifySessionMiddleware),
  validateParams(adminIdParamSchema),
  asyncHandler(adminController.getAdminDetail)
);

router.patch('/:adminId',
  asyncHandler(verifySessionMiddleware),
  asyncHandler(verifyCsrfMiddleware),
  validateParams(adminIdParamSchema),
  validateBody(patchOtherAdminSchema),
  asyncHandler(adminController.patchAdminDetail)
);

router.delete('/:adminId', 
  asyncHandler(verifySessionMiddleware),
  asyncHandler(verifyCsrfMiddleware),
  validateParams(adminIdParamSchema),
  asyncHandler(adminController.deleteOtherAdmin)
);

export default router;