import { Environment } from "../config/constants";
const node_env = process.env.NODE_ENV;

export const IS_DEV = node_env === Environment.DEV;
export const IS_STG = node_env === Environment.STG;
export const IS_PROD = node_env === Environment.PROD;
