import SideMenu from "@/components/SideMenu/SideMenu";
import styles from "./admins.module.css";

const adminsPage = () => {
  return (
    <main className={styles.admins}>
      <div className={styles.admins__sideMenu}>
        <SideMenu />
      </div>
      <div className={styles.admins__mainContents}>

      </div>
    </main>
  )
}

export default adminsPage;