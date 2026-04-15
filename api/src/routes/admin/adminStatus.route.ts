import asyncHandler from '@middleware/asyncHandler';
import verifySessionMiddleware from '@middleware/requireAdminSession';
import { Router } from 'express';
import * as adminStatusController from '@controllers/admin/adminStatus.controller';

const router = Router();

router.get('/', 
  asyncHandler(verifySessionMiddleware),
  asyncHandler(adminStatusController.getAdminStatus)
)

export default router;