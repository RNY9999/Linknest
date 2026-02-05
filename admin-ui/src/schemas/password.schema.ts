import z from 'zod';

const PASSWORD_REGEX =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!-/:-@[-`{-~])[a-zA-Z0-9!-/:-@[-`{-~]+$/;

export const passwordSchema = z.strictObject({
  password: z
    .string()
    .min(6, 'パスワードは6文字以上で設定してください。')
    .max(20, 'パスワードは20文字以下で設定してください。')
    .regex(PASSWORD_REGEX, 'パスワードは英大文字・小文字・数字・記号をそれぞれ1文字以上含めてください。')
});