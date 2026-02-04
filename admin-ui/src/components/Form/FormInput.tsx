import React, { forwardRef } from "react";
import styles from "./Form.module.css";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

// TODO forwardRef に関して調査。。。あまり理解しないで使っているので
export const FormInput = forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={`${styles.form__input} ${className ? styles[className] : ""}`}
      />
    );
  },
);

FormInput.displayName = "FormInput";
