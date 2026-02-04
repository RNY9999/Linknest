"use client";

import { useEffect, useState, useRef } from "react";
import { apiEndpoint } from "@/constants/api";
import styles from "./loginFirstOtpVerify.module.css";
import { apiClient } from "@/lib/apiClient";
import { calcIsoTimeGapSec } from "@/lib/date/formatJst";
import { routes } from "@/constants/routes";
import { useRouter } from "next/navigation";
import { useAdminLogout } from "@/hooks/useAdminLogout";
import {
  Form,
  FormError,
  FormField,
  FormInput,
  FormSubmit,
} from "@/components/Form";
import React from "react";
import { zenkakuToHankakuNumber } from "@/lib/string/zenkakuToHankakuNumber";
import { checkAxiosError, fillErrorMessageTemplate } from "@/lib/error";

const LoginFirstOtpVerifyPage = () => {
  const router = useRouter();
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const [remainingSec, setRemainingSec] = useState<string>("00:00");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { logout } = useAdminLogout();
  const otpLength = 6;
  const isValid = otp.trim().length === otpLength;

  /**
   * OTP検証
   *
   * ▼ 処理概要
   * 1. ワンタイムパスワード検証APIを叩いてResponseにより処理分岐
   * → [200] nextPath へ遷移
   * → [400] BAD_REQUEST, CSRF-TOKEN未送信 サーバエラー
   * → [401] code により分岐
   * → → [UNAUTHORIZED] セッションエラー画面へ遷移
   * → → [OTP_UNAUTHORIZED] エラー文言をページ内で表示※エラー文はAPI参照
   * → [403] CSRF検証失敗 セッションエラー画面へ遷移
   * → [423] ワンタイムパスワード入力上限エラー画面へ遷移
   * → [500] サーバエラー画面へ遷移
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      // 1. ワンタイムパスワード検証APIを叩いてResponseにより処理分岐
      const sendData = { otp: otp };
      const res = await apiClient.patch(apiEndpoint.ADMIN_OTP_VERIFY, sendData);

      // → [200] nextPath へ遷移
      const nextPath = res.data?.data?.nextPath;
      router.replace(nextPath ?? routes.OTP_COMPLETE);
    } catch (error) {
      // Axiosエラーかどうかの判定
      if (!checkAxiosError(error)) {
        router.replace(routes.SERVER_ERROR);
        return;
      }

      const status = error.response?.status; // エラーステータス
      const code = error.response?.data?.code; // API内エラーコード
      const message = error.response?.data?.message; // エラーメッセージ
      const details = error.response?.data?.details; // エラーメッセージ埋め込み用の値

      // 何らかの理由（ネットワークエラーなど）で status が取得できない場合はサーバエラー
      if (!status) {
        router.replace(routes.SERVER_ERROR);
        return;
      }

      // TODO エラーステータスをマジックナンバーのように使用してるので後でどこかでまとめた方がいいかも
      switch (status) {
        // → [400] BAD_REQUEST, CSRF-TOKEN未送信 サーバエラー
        case 400:
          router.replace(routes.SERVER_ERROR);
          return;
        // → [401] code により分岐
        case 401:
          // → → [UNAUTHORIZED] セッションエラー画面へ遷移
          if (code === "UNAUTHORIZED") {
            router.replace(routes.SESSION_ERROR);
            return;
          }
          // → → [OTP_UNAUTHORIZED] エラー文言をページ内で表示※エラー文はAPI参照
          if (code === "OTP_UNAUTHORIZED") {
            const errorMessage = fillErrorMessageTemplate(message, details);
            setErrorMessage(errorMessage);

            otpInputRef.current?.focus();
            otpInputRef.current?.select();
            return;
          }
        // 念のため 401 で上記にかからなかったものは default 処理へ流す
        // → [403] CSRF検証失敗 セッションエラー画面へ遷移
        case 403:
          router.replace(routes.SESSION_ERROR);
          return;
        // → [423] ワンタイムパスワード入力上限エラー画面へ遷移
        case 423:
          router.replace(routes.OTP_MAX_ERROR);
          return;
        // → [500] サーバエラー画面へ遷移
        // default → サーバエラー
        case 500:
        default:
          router.replace(routes.SERVER_ERROR);
          return;
      }
    }
  };

  /**
   * OTP入力ハンドラー
   *
   * ▼ 処理概要
   * 1. e.target.value を 全角数字を半角数字へ変換して受け取る
   * 2. /\D/g 数値以外を '' へ変換し、6文字を取得
   * 3. 完成した otp を setOtp でセット
   * @param e
   * @returns
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const otp = zenkakuToHankakuNumber(e.target.value)
      .replace(/\D/g, "")
      .slice(0, otpLength);
    setOtp(otp);
  };

  // エラーエリアのクローズ
  const closeErrorField = () => {
    setErrorMessage("");
    otpInputRef.current?.focus();
  };

  // OTP送信確認画面へ戻る
  const handleBack = () => {
    router.replace(routes.OTP_SEND);
  };

  // 初回 OTP有効期限確認用 useEffect
  useEffect(() => {
    // otpExpiresAt を取得：2025-12-14T12:55:00.000Z（ISO 8601 UTC形式）
    const getOtpExpiresAt = async () => {
      try {
        const res = await apiClient.get(apiEndpoint.ADMIN_GET_OTP_EXPIRES_AT);
        const otpExpiresAt = res.data?.data?.expiresAt;

        // 取得できない場合は、session エラーとして扱う
        if (!otpExpiresAt) {
          router.replace(routes.SESSION_ERROR);
          return;
        }

        setOtpExpiresAt(otpExpiresAt);
      } catch {
        router.replace(routes.SERVER_ERROR);
        return;
      }
    };
    getOtpExpiresAt();
  }, [router]);

  /**
   * otpExpiresAt 更新時 useEffect
   *
   * ▼ 関数定義
   * 【関数定義1】RemainingTimerFormat : 秒 → mm:ss へのフォーマット用関数
   * 【関数定義2】tick : setInterval内で1秒毎に回す関数, 初回即時表示用に関数化
   *
   * ▼処理概要
   * 1. トリガーである otpExpiresAt が存在しない場合は即リターン
   * 2. 関数定義
   * 3. tick()を実行（初回表示）
   * 4. 1秒間隔でsetInterval内でtickを実行 : これにより画面上でタイマーが1秒間隔で動作する
   * 5. setInterval 終了用の関数をリターン（画面遷移時、リロード時などに正常にsetIntervalを終了させる）
   */
  useEffect(() => {
    // 1. トリガーである otpExpiresAt が存在しない場合は即リターン
    if (!otpExpiresAt) return;

    // 2. 関数定義
    /**
     * 【関数定義1】RemainingTimerFormat：秒 → mm:ss へのフォーマット用関数
     * sec を受け取って、hh:ss へフォーマット
     * @example 182 → 03:02
     * */
    const RemainingTimerFormat = (sec: number) => {
      const ss = String(sec % 60).padStart(2, "0");
      const mm = String((sec - (sec % 60)) / 60).padStart(2, "0");

      return `${mm}:${ss}`;
    };

    /**
     * 【関数定義2】setInterval内で1秒毎に回す関数, 初回即時表示用に関数化
     * 1. OTP有効期限 - 現在時刻を計算
     * @example 2025-10-27T10:45:14.922Z - 2025-10-27T10:42:12.901Z → 182
     * 2. フォーマット
     * @example 182 → 03:02
     * 3. setRemainingSec()
     * 4. 0秒判定用にremainingSecを返却
     */
    const tick = () => {
      // 1. OTP有効期限 - 現在時刻を計算
      const nowIsoUtc = new Date().toISOString();
      const remainingSec = calcIsoTimeGapSec(otpExpiresAt, nowIsoUtc);
      // 2. フォーマット
      const formatRemainingTimer = RemainingTimerFormat(remainingSec);
      // 3. setRemainingSec()
      setRemainingSec(formatRemainingTimer);
      // 4. 0秒判定用にremainingSecを返却
      return remainingSec;
    };

    // 3. tick()を実行（初回表示）
    tick();

    // 4. 1秒間隔でsetInterval内でtickを実行 : これにより画面上でタイマーが1秒間隔で動作する
    const intervalId = setInterval(() => {
      const sec = tick();
      if (sec <= 0) clearInterval(intervalId);
    }, 1000);
    // 5. setInterval 終了用の関数をリターン（画面遷移時、リロード時などに正常にsetIntervalを終了させる）
    return () => clearInterval(intervalId);
  }, [otpExpiresAt]);

  return (
    <div className={styles.inputOtp}>
      <h1 className={styles.inputOtp__title}>
        初回ログイン
        <br />
        ワンタイムパスワード入力
      </h1>
      <div className={styles.inputOtp__contents}>
        <p className={styles.inputOtp__text}>
          ご登録のメールアドレスにワンタイムパスワードを送信しました。
          <br />
          確認の上、以下フォームにご入力ください。
        </p>
      </div>
      <div className={styles.inputOtp__expiresAt}>
        <p className={styles.inputOtp__attention}>有効期限は５分です</p>
        <p className={styles.inputOtp__timeLimit}>{remainingSec}</p>
      </div>
      <Form onSubmit={handleSubmit} noValidate>
        <FormField label="ワンタイムパスワード" htmlFor="otp">
          <FormInput
            ref={otpInputRef}
            type="text"
            id="otp"
            name="otp"
            maxLength={6}
            minLength={6}
            onChange={handleChange}
            value={otp}
            required
            className="form__input--otp"
          />
        </FormField>
        <FormError
          errorMessage={errorMessage}
          closeErrorField={closeErrorField}
        />
        <FormSubmit disabled={!isValid}>
          ワンタイムパスワードを認証する
        </FormSubmit>
      </Form>
      <div className={styles.inputOtp__reTry}>
        <p className={styles.inputOtp__text}>
          メールが届かない場合や、有効期限が切れた場合、以下のリンクからワンタイムパスワードを再送信してください
        </p>
        <button
          className={styles.inputOtp__link}
          onClick={handleBack}
          type="button"
        >
          ワンタイムパスワードを再送信する
        </button>
      </div>
      <hr />
      <div className={styles.inputOtp__pageOption}>
        <button
          className={styles.inputOtp__link}
          onClick={handleBack}
          type="button"
        >
          &lt;&lt; 戻る
        </button>
        <button
          className={styles.inputOtp__link}
          onClick={logout}
          type="button"
        >
          ログインはこちら
        </button>
      </div>
    </div>
  );
};

export default LoginFirstOtpVerifyPage;
