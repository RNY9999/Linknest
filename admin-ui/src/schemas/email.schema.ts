import z from 'zod';

export const emailSchema = z.strictObject({
  email: z
    .email("メールアドレスの形式が正しくありません。")
    .max(100, "メールアドレスは100文字以内でお願いいたします。")
});