/**
 * 画面表示用のステータスラベルを作成するユーティリティ
 */

/**
 * 管理者一覧画面用ステータスラベル
 * 
 * 「_ロック」, 「_退職済み」 => 「（ロック）」, 「（退職済み）」
 * @param statusId 
 */
export const buildStatusLabelForAdminsList = (status: string) => {
  const searchRegex = /_(.+)$/;
  const replaceRegex = '（$1）';

  return status.replace(searchRegex, replaceRegex);
}