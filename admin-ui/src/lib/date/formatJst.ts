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