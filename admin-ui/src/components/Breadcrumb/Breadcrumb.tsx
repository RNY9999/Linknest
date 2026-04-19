"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./Breadcrumb.module.css";

type BreadcrumbItem = {
  label: string;
  path: string;
};

type Props = {
  items: BreadcrumbItem[];
};

const Breadcrumb = ({ items }: Props) => {
  const router = useRouter();
  const breadcrumbSeparatorSrc = "/icons/breadcrumb/chevron-right.svg";
  const breadcrumbBackSrc = "/icons/breadcrumb/arrow-left.svg";
  return (
    <nav aria-label="パンくずリスト" className={styles.breadcrumb}>
      <button
        className={styles.breadcrumb__back}
        type="button"
        onClick={() => router.back()}
      >
        <Image src={breadcrumbBackSrc} alt="" width={24} height={24} />
      </button>
      <ol className={styles.breadcrumb__list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.path}-${index}`}
              className={styles.breadcrumb__item}
              aria-current={isLast ? "page" : undefined}
            >
              {isLast ? (
                <span className={styles.breadcrumb__current}>{item.label}</span>
              ) : (
                <Link href={item.path} className={styles.breadcrumb__link}>
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <Image
                  src={breadcrumbSeparatorSrc}
                  alt=""
                  width={24}
                  height={24}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
