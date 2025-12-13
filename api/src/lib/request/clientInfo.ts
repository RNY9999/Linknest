/**
 * Request 内の クライアント情報を取得するライブラリ
 */
import { Request } from "express";
import { ClientInfo } from "@types";

/**
 * TODO: この関数の説明文を記載
 * ※現在処理内容をあまり理解していないので、後でもうちょっと詳しくなったら記載します。
 * @param req 
 * @returns 
 */
export const getClientInfo = (req: Request): ClientInfo => {
  const ua = req.get("user-agent") ?? "";
  const ip = (req.ip ?? "").replace(/^::ffff:/, "");
  const ips = (req.ips ?? []).map(x => x.replace(/^::ffff:/, ""));
  return { ip, ipChain: ips, userAgent: ua };
}
