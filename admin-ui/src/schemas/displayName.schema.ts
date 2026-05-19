import z from "zod";

export const displayNameSchema = z
  .string("不正な入力値です。")
  .trim()
  .min(1, "管理者表示名は1文字以上で設定してください。")
  .max(255, "管理者表示名は50文字以下で設定してください。");