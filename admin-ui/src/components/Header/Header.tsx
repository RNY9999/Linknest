import Image from "next/image";
import styles from "./Header.module.css";

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.header__logo}>
        <Image 
          src="/images/logo/Linknest_logo_white.svg" 
          alt="Linknest ロゴ" 
          className={styles.header__img} 
          width={115}
          height={38}
          priority
        />
        <span className={styles.header__title}>管理システム</span>
      </div>
    </header>
  );
};

export default Header;