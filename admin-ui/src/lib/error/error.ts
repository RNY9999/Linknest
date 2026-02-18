import axios from "axios";

/**
 * Axiosエラー判定関数
 * @param error - error
 * @return boolean - true: AxiosError, false: otherError
 */
export const checkAxiosError = (error: unknown) => {
  return axios.isAxiosError(error);
};