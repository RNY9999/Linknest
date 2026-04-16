"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./SideMenu.module.css";
import { menuItems, SubMenuItem } from "./menuConfig";
import { useEffect, useState } from "react";
const SideMenu = () => {
  const [openMenuIds, setOpenMenuIds] = useState<number[]>([]);
  const closeMenuIcon = "/icons/side-menu/chevron-right.svg";
  const openMenuIcon = "/icons/side-menu/chevron-down.svg";
  const pathName = usePathname();

  const isActive = (path: string) => pathName === path;
  const isOpen = (id: number): boolean => {
    return openMenuIds.includes(id);
  };

  const handleToggleMenu = (menuId: number) => {
    setOpenMenuIds((prev): number[] => {
      return prev.includes(menuId)
        ? prev.filter((id) => id !== menuId) // menuId は含まれないので閉じる
        : [...prev, menuId]; // prev + menuId となるので menuId は開く
    });
  };

  const hasActiveChild = (subMenu: SubMenuItem[]) => {
    let result = false;
    subMenu.forEach((item) => {
      console.log(`item.path: ${item.path}`);
      console.log(pathName);
      if (item.path === pathName) {
        console.log('return true');
        result = true;
      }
    });
    
    return result;
  };

  useEffect(() => {
    menuItems.forEach((menuItem) => {
      menuItem.subMenu?.forEach((subMenu) => {
        if (subMenu.path && subMenu.path === pathName) {
          setOpenMenuIds([menuItem.id]);
        }
      });
    });
  }, [pathName]);
  return (
    <aside className={styles.sideMenu}>
      <div className={styles.sideMenuHeader}></div>
      <nav className={styles.sideMenuNavigation}>
        <ul className={styles.menuList}>
          {menuItems.map((menuItem) => {
            return (
              <li className={styles.menuList__item} key={menuItem.id}>
                {menuItem.path && (
                  <Link
                    href={menuItem.path}
                    className={`${styles.menuList__link} ${isActive(menuItem.path) ? styles.isActive : ""}`}
                  >
                    <Image
                      src={menuItem.iconPath}
                      alt=""
                      width={28}
                      height={28}
                      className={styles.menuList__icon}
                    />
                    {menuItem.label}
                  </Link>
                )}
                {menuItem.subMenu && (
                  <>
                    <button
                      className={`${styles.parentList} ${hasActiveChild(menuItem.subMenu) ? styles.isActive : ""}`}
                      type="button"
                      onClick={() => handleToggleMenu(menuItem.id)}
                    >
                      <Image
                        src={menuItem.iconPath}
                        alt=""
                        width={28}
                        height={28}
                      />
                      {menuItem.label}
                      <Image
                        className={styles.parentList__status}
                        src={isOpen(menuItem.id) ? openMenuIcon : closeMenuIcon}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </button>
                    {isOpen(menuItem.id) && (
                      <ul className={styles.childrenList}>
                        {menuItem.subMenu.map((subMenu) => {
                          return (
                            <li
                              className={styles.childrenList__item}
                              key={subMenu.id}
                            >
                              <Link
                                href={subMenu.path}
                                className={`
                                  ${styles.childrenList__link} 
                                  ${isActive(subMenu.path) ? styles.isActive : ""}`}
                              >
                                {subMenu.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
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
