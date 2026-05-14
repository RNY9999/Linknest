import styles from "./AdminDetailCard.module.css";

type Props = {
  title: string;
  column: {
    key: string;
    value: string;
  }[];
};

const AdminDetailCard = ({ title, column }: Props) => {
  return (
    <section className={styles["admin-detail-card"]}>
      <h3 className={styles["admin-detail-card__title"]}>{title}</h3>
      {column.map(({ key, value }) => {
        return (
          <div key={key} className={styles["admin-detail-card__record"]}>
            <p className={styles["admin-detail-card__key"]}>{key}</p>
            <p className={styles["admin-detail-card__value"]}>{value}</p>
          </div>
        );
      })}
    </section>
  );
};

export default AdminDetailCard;
