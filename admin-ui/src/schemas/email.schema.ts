import z from 'zod';

export const emailSchema = z
  .email("メールアドレスの形式が正しくありません。")
  .max(100, "メールアドレスは100文字以内でお願いいたします。");
