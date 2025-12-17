// OTP関連情報のアップデート用
export type UpdateAdminOtp = {
  otpCode?: string | null,
  otpExpiredAt?: Date | null,
  otpFailureCount?: number,
}