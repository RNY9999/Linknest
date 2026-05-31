export type LoginResult =
  | { status: "success"; message: string }
  | { status: "failure"; message: string }
  | { status: "locked"; message: string };
