import styles from './Form.module.css';

type Props = {
  errorMessage: string;
  closeErrorField: () => void;
}

export const FormError = ({ errorMessage, closeErrorField }: Props) => {
  const isHidden = errorMessage === '';

  return (
    <div className={isHidden ? styles['error__field--hidden'] : styles.error__field}>
      <button
        type="button"
        className={isHidden ? styles['error__close--hidden'] : styles.error__close}
        onClick={closeErrorField}
      />
      <p className={styles.error__text}>
        {errorMessage}
      </p>
    </div>
  );
};