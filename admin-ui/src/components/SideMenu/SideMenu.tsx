import Link from "next/link";
import Image from "next/image";
import styles from "./SideMenu.module.css";
import { menuItems } from "./menuConfig";
const SideMenu = () => {
  return (
    <aside className={styles.SideMenu}>
      <div className={styles.SideMenuHeader}></div>
      <nav className={styles.SideMenuNavigation}>
        <ul className={styles.menuList}>
          {menuItems.map((menuItem) => {
            return (
              <li className={styles.menuList__item} key={menuItem.id}>
                {menuItem.path && (
                  <Link href={menuItem.path} className={styles.menuList__link}>
                    <Image
                      src={menuItem.iconPath}
                      alt=""
                      width={20}
                      height={20}
                      className={styles.menuList__icon}
                    />
                    {menuItem.label}
                  </Link>
                )}
                {menuItem.subMenu && (
                  <>
                    <div className={styles.parentList}>
                      <Image
                        src={menuItem.iconPath}
                        alt=""
                        width={20}
                        height={20}
                      />
                      {menuItem.label}
                    </div>
                    <ul className={styles.childrenList}>
                      {menuItem.subMenu.map((subMenu) => {
                        return (
                          <li className={styles.childrenList__item} key={subMenu.id}>
                            <Link href={subMenu.path} className={styles.childrenList__link}>
                              {subMenu.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.SideMenuFooter}></div>
    </aside>
  );
};

export default SideMenu;
