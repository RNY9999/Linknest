import { formatIsoToJst } from "@/lib/date/formatJst";
import styles from "./AdminLoginLogs.module.css";

const adminLoginLogsTitle = 'ログイン履歴';
const adminLoginLogsHeader = [
  { label: "日付", id: "occurredAt" },
  { label: "ステータス", id: "status" },
  { label: "IPアドレス", id: "ipAddress" },
  { label: "ユーザーエージェント", id: "userAgent" },
];

const setLoginStatusCss = (status: string) => {
  const loginSuccess = 'success';
  const loginFailure = 'failure';

  if (status === loginSuccess) {
    return '--is-login-success';
  };

  if (status === loginFailure) {
    return '--is-login-failure';
  }

  return '';
};

type AdminLoginLogs = {
  occurredAt: string;
  status: string;
  statusLabel: string;
  ipAddress: string;
  userAgent: string;
}[];

type Props = {
  adminLoginLogs: AdminLoginLogs;
};

const AdminLoginLogs = ({adminLoginLogs}: Props) => {
  return (
    <div className={styles["admin-login-logs"]}>
      <h3 className={styles["admin-login-logs__title"]}>
        {adminLoginLogsTitle}
      </h3>
      <div className={styles["admin-login-logs__table"]}>
        <div className={styles["admin-login-logs__header"]}>
          {adminLoginLogsHeader.map((col) => {
            return (
              <div
                key={col.id} 
                className={styles["admin-login-logs__header-col"]}
              >
                {col.label}
              </div>
            );
          })}
        </div>
        <div className={styles["admin-login-logs__list"]}>
          {adminLoginLogs.map((record, index) => {
            return (
              <div
                key={`adminLoginLog-${record.occurredAt}`} 
                className={
                  `${styles["admin-login-logs__record"]} ${index === adminLoginLogs.length - 1 ? styles['--isLast'] : ''}`
                }
              >
                <p className={styles['admin-login-logs__record-data']}>
                  {formatIsoToJst(record.occurredAt)}
                </p>
                <p 
                  className={
                  `${styles['admin-login-logs__record-data']} ${styles[setLoginStatusCss(record.status)]}`
                  }
                >
                  {record.statusLabel}
                </p>
                <p className={styles['admin-login-logs__record-data']}>
                  {record.ipAddress}
                </p>
                <p className={styles['admin-login-logs__record-data']}>
                  {record.userAgent}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
};

export default AdminLoginLogs;
