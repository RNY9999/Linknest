/**
 * 画面表示用のステータスラベルを作成するユーティリティ
 */

/**
 * 管理者一覧画面用ステータスラベル
 * 
 * 「_ロック」がある場合、「（ロック）」にリプレース
 * @param statusId 
 */
export const buildStatusLabelForAdminsList = (status: string) => {
  const searchString = '_ロック';
  const replaceString = '（ロック中）';

  return status.replace(searchString, replaceString);
}