import * as z from "zod";
import { PASSWORD_REGEX, INVALID_MESSAGE } from "@config/constants";

export const adminSessionSchema = z.strictObject({
  email: z
    .email({ error: INVALID_MESSAGE })
    .transform(v => v.trim()) // 大文字/小文字の区別はするため、小文字に変換はしない
    .pipe(z.string(INVALID_MESSAGE).max(254, { error: INVALID_MESSAGE })),
  password: z
    .string({ error: INVALID_MESSAGE })
    .regex(PASSWORD_REGEX, { error: INVALID_MESSAGE })
});

export type AdminSessionInput = z.infer<typeof adminSessionSchema>;
