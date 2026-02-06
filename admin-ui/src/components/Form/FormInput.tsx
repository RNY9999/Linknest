import React, { forwardRef, useState } from "react";
import Image from "next/image";
import styles from "./Form.module.css";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  isPassword?: boolean;
};

// TODO forwardRef に関して調査。。。あまり理解しないで使っているので
export const FormInput = forwardRef<HTMLInputElement, Props>(
  ({ className, isPassword, ...props }, ref) => {
    const eyeSvg = '/icons/form/eye.svg';
    const eyeOffSvg = '/icons/form/eye-off.svg';
    const [eyeStatus, setEyeStatus] = useState<string>(eyeOffSvg);

    const handleClick = () => {
      if (eyeStatus === eyeSvg) setEyeStatus(eyeOffSvg);
      if (eyeStatus === eyeOffSvg) setEyeStatus(eyeSvg);
    };

    const checkPasswordInputType = () => {
      return eyeStatus === eyeSvg ? "text" : "password";
    }

    return (
      <div className={styles['form__input-wrapper']}>
        <input
          ref={ref}
          {...props}
          className={`${styles.form__input} ${className ? styles[className] : ""} ${isPassword ? styles['form__input--password'] : ''}`}
          type={isPassword 
            ? checkPasswordInputType()
            : props.type}
        />
        {isPassword && (
          <button
            type="button"
            className={styles['form__input-icon-wrapper']}
            onClick={handleClick}
            aria-label="パスワード表示・非表示切り替え"
            onMouseDown={(e) => e.preventDefault()}
          >
            <Image
              src={eyeStatus}
              alt="パスワード表示・非表示切り替えアイコン"
              width={24}
              height={24}
              className={styles['form__input-icon']}
            />
          </button>
        ) }
      </div>
    );
  },
);

FormInput.displayName = "FormInput";
