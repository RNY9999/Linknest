/**
 * Redis内のKeyを返却する関数群 
 */

// Session関連
export const adminSessionKey = (sid: string) => `ln:admin:sid:${sid}`;
export const adminTmpSessionKey = (sid: string) => `ln:admin:tmp_sid:${sid}`;
export const adminCurrentSidKey = (adminId: string) => `ln:admin:current_sid:${adminId}`;

// CSRF関連
export const adminCsrfKey = (sid: string) => `ln:admin:csrf:${sid}`;