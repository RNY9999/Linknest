import { Router } from "express";
import * as adminSessionController from "@controllers/admin/session.controller";
import validateBody from "@middleware/validate"

import { adminSessionSchema } from "@schemas/adminSession.schema";

const router = Router();

router.get('/', adminSessionController.getAdminSession);
router.post('/', validateBody(adminSessionSchema), adminSessionController.postAdminSession);

export default router;