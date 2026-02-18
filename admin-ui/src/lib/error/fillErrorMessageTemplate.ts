/**
 * エラーメッセージテンプレート埋め込み関数
 * 
 * @example
 * template → {sample} です
 * details → {sample: "example message"}
 * 
 * return → example message です
 * 
 * @param template 
 * @param details 
 */
export const fillErrorMessageTemplate = (template: string, details: Record<string, string | number>) => {
  let buildMessage: string = template;
  const changeKeys = Object.keys(details);

  changeKeys.forEach((changeKey) => {
    const replaceWord = '{' + changeKey + '}';
    buildMessage = buildMessage.replaceAll(replaceWord, String(details[changeKey])
    );
  });
  return buildMessage;
};