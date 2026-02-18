export const zenkakuToHankakuNumber = (value: string): string => {
  return value.replaceAll(/[０-９]/g, (char) =>
    String.fromCodePoint((char.codePointAt(0) ?? 0) - 0xFEE0)
  );
};
