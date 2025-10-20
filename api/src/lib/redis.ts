import { createClient } from "redis";

/**
 * 1) REDIS_URL の取得（未設定は即エラー）
 */
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  throw new Error("REDIS_URLが取得できませんでした。環境変数をご確認ください。");
}

/**
 * 2) シングルトンクライアントの生成
 *    - 直接操作したい場合は redis を import
 *    - 外部に隠したい場合は export を外す
 */
const client = createClient({
  url: REDIS_URL,
  socket: {
    // 再接続の指数バックオフ（最大 2 秒）
    reconnectStrategy: (retries: number) => Math.min(retries * 100, 2000),
  },
});

// 接続系エラーを必ずログ
client.on("error", (err) => {
  console.error("[Redis] error:", err);
});

// 状態ログ（任意）
client.on("connect", () => console.log("[Redis] connecting..."));
client.on("ready", () => console.log("[Redis] ready"));
client.on("reconnecting", () => console.log("[Redis] reconnecting..."));

/**
 * 3) 遅延接続（必要になったとき一度だけ connect）
 */
const ensureRedis = async (): Promise<void> => {
  if (!client.isOpen) {
    await client.connect();
    console.log("[Redis] connected");
  }
};

/**
 * 4) 優雅な終了（サーバ停止時に切断）
 *    - Express の server.close と合わせて呼ばれる想定
 */
const closeRedis = async (): Promise<void> => {
  if (client.isOpen) {
    await client.quit(); // disconnect() より quit() 推奨（正常終了）
    console.log("[Redis] closed");
  }
};

// Nodeプロセス終了時に自動クリーンアップ（任意）
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    try {
      await closeRedis();
    } finally {
      process.exit(0);
    }
  });
}

export { client as redis, ensureRedis, closeRedis };
