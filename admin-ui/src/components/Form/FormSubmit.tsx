import React from 'react';
import styles from './Form.module.css';

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export const FormSubmit = ({ children, disabled, className }: Props) => {
  return (
    <button 
      type="submit" 
      className={`${styles.form__submit} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};