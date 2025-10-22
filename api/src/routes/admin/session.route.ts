import { Router } from "express";
import * as adminSessionController from "@controllers/admin/session.controller";

const router = Router();

router.get('/', adminSessionController.getAdminSession);
router.post('/', adminSessionController.postAdminSEssion);

export default router;