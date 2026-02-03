import React from 'react';
import styles from './Form.module.css';

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
};

export const FormSubmit = ({ children, disabled }: Props) => {
  return (
    <button 
      type="submit" 
      className={styles.form__submit}
      disabled={disabled}
    >
      {children}
    </button>
  );
};