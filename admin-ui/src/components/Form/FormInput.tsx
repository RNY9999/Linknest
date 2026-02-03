import React from 'react';
import styles from './Form.module.css';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};


export const FormInput = ({ className, ...props }: Props) => {
  return <input {...props} className={`${styles.form__input} ${styles[className ?? '']}`}/>
};