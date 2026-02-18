/**
 * ISO8601(UTC)文字列を日本時間(JST)の「hh時mm分」表記に変換する関数
 * @example 2025-10-27T10:45:12.901Z → 19時45分
 */
export const formatIsoToJstTime = (iso: string): string => {
  if (!iso) return "";

  const date = new Date(iso);
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const time = formatter.format(date);
  const [hh, mm] = time.split(':');

  return `${hh}時${mm}分`;
}

/**
 * ISO8601(UTC)文字列2つから差分(単位s)を計算する関数
 * 引数 iso1, iso2 を受け取り、 iso1 - iso2 を実行
 * iso1 - iso2 の結果が 0以下 の場合は 0 を返却
 * @example 2025-10-27T10:45:12.901Z - 2025-10-27T10:43:12.901Z → 120s
 */
export const calcIsoTimeGapSec = (iso1: string, iso2: string): number => {
  if (!iso1 || !iso2) return 0;

  const dateMs1: number = Date.parse(iso1);
  const dateMs2: number = Date.parse(iso2);

  if (Number.isNaN(dateMs1) || Number.isNaN(dateMs2)) return 0;

  const timeGapMs = dateMs1 - dateMs2;
  const timeGapSec = Math.floor(timeGapMs / 1000);

  return Math.max(0, timeGapSec);
}