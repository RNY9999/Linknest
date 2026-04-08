import * as z from 'zod';
import { ADMIN_DISPLAY_NAME_MAX_LENGTH, ADMIN_EMAIL_MAX_LENGTH, ADMIN_ID_REGEX, GET_ADMINS_PAGE_DEFAULT, GET_ADMINS_PAGE_MIN, GET_ADMINS_PER_PAGE, GET_ADMINS_SORT_BY_DEFAULT, GET_ADMINS_SORT_BY_ENUM, GET_ADMINS_SORT_ORDER_DEFAULT, GET_ADMINS_SORT_ORDER_ENUM, INVALID_MESSAGE, ADMIN_STATUS_IDS } from '@config/constants';

/**
 * 管理者一覧取得時の QueryParameter のバリデーション
 * 2. クエリパラメータのチェック
 *    ・adminId: string
 *    ・email: string
 *    ・displayName: string
 *    ・statusId: number
 *    ・sortBy: [adminId, email, displayName, statusId, lastLoginAt, createdAt] ※default: adminId
 *    ・sortOrder: [asc, desc] ※default: desc
 *    ・page: number ※default: 1
 *    ・perPage: number ※default: 20
 *    => クエリパラメータがバリデーションに引っかかった場合: 400 / BAD_REQUEST
 */
export const getAdminsQuerySchema = z.strictObject({
  adminId: z
    .string({ error: INVALID_MESSAGE })
    .regex(ADMIN_ID_REGEX, { error: INVALID_MESSAGE })
    .optional(),

  email: z
    .string({ error: INVALID_MESSAGE })
    .max(ADMIN_EMAIL_MAX_LENGTH, { error: INVALID_MESSAGE })
    .optional(),

  displayName: z
    .string({ error: INVALID_MESSAGE })
    .max(ADMIN_DISPLAY_NAME_MAX_LENGTH, { error: INVALID_MESSAGE })
    .optional(),

  statusId: z
    .coerce
    .number({ error: INVALID_MESSAGE })
    .int({ error: INVALID_MESSAGE })
    .refine((v) => ADMIN_STATUS_IDS.includes(v), { error: INVALID_MESSAGE })
    .optional(),

  sortBy: z
    .enum(GET_ADMINS_SORT_BY_ENUM, { error: INVALID_MESSAGE })
    .default(GET_ADMINS_SORT_BY_DEFAULT),

  sortOrder: z
    .enum(GET_ADMINS_SORT_ORDER_ENUM, { error: INVALID_MESSAGE })
    .default(GET_ADMINS_SORT_ORDER_DEFAULT),

  page: z
    .coerce
    .number({ error: INVALID_MESSAGE })
    .int({ error: INVALID_MESSAGE })
    .min(GET_ADMINS_PAGE_MIN, { error: INVALID_MESSAGE })
    .default(GET_ADMINS_PAGE_DEFAULT),

  perPage: z
    .coerce
    .number({ error: INVALID_MESSAGE })
    .int({ error: INVALID_MESSAGE })
    .refine((v) => v === GET_ADMINS_PER_PAGE, { error: INVALID_MESSAGE })
    .default(GET_ADMINS_PER_PAGE)
});

export type GetAdminsQuery = z.infer<typeof getAdminsQuerySchema>;