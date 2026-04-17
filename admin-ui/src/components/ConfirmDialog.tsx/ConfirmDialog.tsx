import { Modal } from "../Modal/Modal";
import styles from './ConfirmDialog.module.css'

type Props = {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  title,
  message,
  onConfirm,
  onCancel
}: Props) => {
  return (
    <Modal onClose={onCancel}>
      <div className={styles.dialog}>
        <div className={styles.dialog__texts}>
          <h2 className={styles.dialog__title}>{title}</h2>
          <p className={styles.dialog__message}>{message}</p>
        </div>
        <div className={styles.dialog__buttons}>
          <button onClick={onCancel} className={styles.dialog__cancel}>いいえ</button>
          <button onClick={onConfirm} className={styles.dialog__confirm}>はい</button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;