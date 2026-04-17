import styles from './Modal.module.css';

type Props = {
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal = ({ children, onClose}: Props) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};