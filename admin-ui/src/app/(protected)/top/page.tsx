import SideMenu from "@/components/SideMenu/SideMenu";
import styles from "./top.module.css";

const topPage = () => {
  return (
    <main className={styles.top}>
      <div className={styles.top__sideMenu}>
        <SideMenu />
      </div>
      <div className={styles.top__mainContents}>

      </div>
    </main>
  )
}

export default topPage;