import React from 'react';
import styles from './Form.module.css';
import Link from 'next/link';

type Props = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  href?: string;
  link?: string;
};

export const FormField = ({ label, htmlFor, children, href, link }: Props) => {
  return (
    <div className={styles.form__field}>
      <label htmlFor={htmlFor} className={styles.form__label}>
        {label}
      </label>
      {children}
      {href && link && 
        <Link href={href} className={styles.form__fieldLink}>
          {link}
        </Link>
      }
    </div>
  );
};