import styles from "./AdminDetailCard.module.css";

type Props = {
  title: string;
  column: {
    key: string;
    value: string;
  }[];
};

const hasColorKeyValueCheck = [
  {key: 'ワンタイムパスワード入力失敗回数', check: (value: number) => value > 0},
  {key: 'ログイン失敗回数', check: (value: number) => value > 0}
];

const checkAddErrorColor = (key: string, value: string): boolean => {
  let result = false;
  hasColorKeyValueCheck.forEach((record) => {
    if (record.key === key) {
      if (record.check(Number(value))) {
        result = true;
      }
    }
  })
  
  return result;
}

const AdminDetailCard = ({ title, column }: Props) => {
  return (
    <section className={styles["admin-detail-card"]}>
      <h3 className={styles["admin-detail-card__title"]}>{title}</h3>
      {column.map(({ key, value }) => {
        return (
          <div key={key} className={styles["admin-detail-card__record"]}>
            <p className={styles["admin-detail-card__key"]}>{key}</p>
            <p 
              className={
                `${styles["admin-detail-card__value"]} ${checkAddErrorColor(key, value) ? styles["--error"] : ""}`
              }>
                {value}
              </p>
          </div>
        );
      })}
    </section>
  );
};

export default AdminDetailCard;
