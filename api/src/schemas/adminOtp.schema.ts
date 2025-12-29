import { ADMIN_OTP_LENGTH, ADMIN_OTP_REGEX, INVALID_MESSAGE } from '@config/constants';
import * as z from 'zod';

export const adminOtpSchema = z.strictObject({
  otp: z
    .string({ error: INVALID_MESSAGE})
    .min(ADMIN_OTP_LENGTH, {error: INVALID_MESSAGE})
    .max(ADMIN_OTP_LENGTH, {error: INVALID_MESSAGE})
    .regex(ADMIN_OTP_REGEX, {error: INVALID_MESSAGE})
});

export type AdminOtpSchema = z.infer<typeof adminOtpSchema>;