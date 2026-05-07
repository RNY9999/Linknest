import React from "react";
import styles from "./Form.module.css";

type Props = {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  id?: string;
  noValidate?: boolean;
};

export const Form = ({
  children,
  onSubmit,
  className,
  id,
  noValidate,
}: Props) => {
  return (
    <form
      id={id}
      className={`${styles.form} ${className}`}
      onSubmit={onSubmit}
      noValidate={noValidate}
    >
      {children}
    </form>
  );
};
