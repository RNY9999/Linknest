import { Router } from "express";
import validateBody from "@middleware/validate"
import asyncHandler from "@middleware/asyncHandler";
import { registerAdminSchema } from "@schemas/registerAdmin.schema";
import * as adminController from "@controllers/admin/admins.controller";

const router = Router();

router.post('/', 
  validateBody(registerAdminSchema),
  asyncHandler(adminController.postAdmin)
);

export default router;