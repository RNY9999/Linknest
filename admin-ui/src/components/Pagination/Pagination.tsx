"use client";
import styles from "./Pagination.module.css";

type Props = {
  meta: {
    total: number;
    page: number;
    perPage: number;
  },
  onChangePage: (page: number) => void;
};

const Pagination = ({meta, onChangePage}: Props) => {
  const { total, page, perPage } = { ...meta };
  const displayStartNumber = total === 0 ? 0 : (page - 1) * perPage + 1;
  const displayEndNumber = Math.min(page * perPage, total);
  const maxPage = 5;
  const totalPage = Math.ceil(total / perPage);

  // pagination として表示する箇所は true にする

  const pagination: Array<boolean> = new Array(totalPage).fill(false);
  pagination.forEach((_isDisplay, index) => {
    const comparePage = index + 1;
    if (page - 2 <= comparePage && page + 2 >= comparePage) {
      pagination[index] = true;
    }

    // 5ページ以上ある場合、page 1, 2, 最終ページ, 最終ページ - 1 で特別対応
    if (totalPage >= maxPage) {
      if (page === 1 || page === 2) {
        if (maxPage >= comparePage) {
          pagination[index] = true;
        }
      }
      if (page === totalPage || page === totalPage - 1) {
        if (totalPage - maxPage + 1 <= comparePage) {
          pagination[index] = true;
        }
      }
    }
  });

  return total === 0 ? (
    <div className={styles.pagination}>
      <p className={styles.pagination__info}>{`全 0 件中 0 ~ 0 件を表示中`}</p>
    </div>
  ) : (
    <div className={styles.pagination}>
      <p className={styles.pagination__info}>
        {`全 ${total} 件中 ${displayStartNumber} ~ ${displayEndNumber} 件を表示中`}
      </p>
      <div className={styles.pagination__wrapper}>
        {pagination.length >= 2 && !pagination[1] && (
          <button type="button" className={styles.pagination__goFirst} onClick={() => onChangePage(1)}>
            最初へ
          </button>
        )}
        {pagination.length >= 1 && page !== 1 && (
          <button type="button" className={styles.pagination__goBefore} onClick={() => onChangePage(page - 1)}>
            前へ
          </button>
        )}
        {pagination.length >= 1 && !pagination[0] && (
          <div className={styles.pagination__dot}>...</div>
        )}
        {pagination.map((isDisplay, index) => {
          if (!isDisplay) return null;
          if (isDisplay) {
            return (
              <button
                type="button"
                className={`${styles.pagination__paging} ${page === index + 1 ? styles.now : ""}`}
                key={`${index}-${isDisplay}`}
                disabled={page === index + 1}
                onClick={() => onChangePage(index + 1)}
              >
                {index + 1}
              </button>
            );
          }
        })}
        {pagination.length >= 1 && !pagination[pagination.length - 1] && (
          <div className={styles.pagination__dot}>...</div>
        )}
        {pagination.length >= 1 && page !== totalPage && (
          <button type="button" className={styles.pagination__goNext} onClick={() => onChangePage(page + 1)}>
            次へ
          </button>
        )}
        {pagination.length >= 2 && !pagination[pagination.length - 2] && (
          <button type="button" className={styles.pagination__goLast} onClick={() => onChangePage(totalPage)}>
            最後へ
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
