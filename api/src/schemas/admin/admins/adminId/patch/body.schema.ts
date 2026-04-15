import * as z from "zod";
import { ADMIN_DISPLAY_NAME_MAX_LENGTH, ADMIN_DISPLAY_NAME_MIN_LENGTH, ADMIN_EMAIL_MAX_LENGTH, ADMIN_STATUS_IDS, INVALID_MESSAGE } from "@config/constants";

export const patchOtherAdminSchema = z.strictObject({
  email: z
    .string({error: INVALID_MESSAGE})
    .trim()
    .max(ADMIN_EMAIL_MAX_LENGTH, { error: INVALID_MESSAGE })
    .pipe(z.email({ error: INVALID_MESSAGE})),
  displayName: z
    .string({ error: INVALID_MESSAGE})
    .trim()
    .min(ADMIN_DISPLAY_NAME_MIN_LENGTH, {error: INVALID_MESSAGE})
    .max(ADMIN_DISPLAY_NAME_MAX_LENGTH, {error: INVALID_MESSAGE}),
  statusId: z
    .coerce
    .number({error: INVALID_MESSAGE})
    .int({error: INVALID_MESSAGE})
    .refine((v) => ADMIN_STATUS_IDS.includes(v), {error: INVALID_MESSAGE})
});

export type PatchOtherAdmin = z.infer<typeof patchOtherAdminSchema>;
