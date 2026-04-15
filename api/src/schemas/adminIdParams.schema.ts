import * as z from 'zod';
import { INVALID_MESSAGE, ADMIN_ID_REGEX } from '@config/constants';

/**
 * 管理者詳細取得時の PathParameters のバリデーション
 * - adminId: string
 */
export const adminIdParamSchema = z.strictObject({
  adminId: z
    .string({ error: INVALID_MESSAGE })
    .regex(ADMIN_ID_REGEX, { error: INVALID_MESSAGE })
    .optional(),
});

export type AdminIdParams = z.infer<typeof adminIdParamSchema>;