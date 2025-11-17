// API共通の成功/失敗の形を統一
export type SuccessStatus =
  | 200
  | 202
  ;

export type ApiSuccess<Data, Meta> = {
  success: true;
  code: "OK"
  message: string;
  data: Data;
  meta: Meta;
}


