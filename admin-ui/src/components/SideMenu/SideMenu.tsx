"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./SideMenu.module.css";
import { menuItems, SubMenuItem, footerItems } from "./menuConfig";
import { useEffect, useState } from "react";
import ConfirmDialog from "../ConfirmDialog.tsx/ConfirmDialog";
import { apiClient } from "@/lib/apiClient";
import { apiEndpoint } from "@/constants/api";
import { routes } from "@/constants/routes";
const SideMenu = () => {
  const router = useRouter();

  const [openMenuIds, setOpenMenuIds] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const closeMenuIcon = "/icons/side-menu/chevron-right.svg";
  const openMenuIcon = "/icons/side-menu/chevron-down.svg";
  const pathName = usePathname();
  const adminDisplayName = "Linknest管理者_001"; // 本来はAPIで取得
  const logoutDialogMessage = "ログアウトしますか？"

  const isLogout = (label: string) => label === "ログアウト";
  const isActive = (path: string) => pathName === path || pathName.startsWith(`${path}/`); 
  const isOpen = (id: number): boolean => {
    return openMenuIds.includes(id);
  };

  /**
   * 「<< 戻る」ボタン or 「ログインはこちら」ボタンを押した際の処理
   *
   * ▼ 処理概要
   * 1. try, catch内でログアウトAPIを叩く
   * 2. 成功、失敗関係なく finally でログイン画面へ遷移
   */
  const handleLogout = async () => {
    try {
      // 1. try, catch内でログアウトAPIを叩く
      await apiClient.delete(apiEndpoint.ADMIN_LOGOUT);
    } catch {
      // error自体はcatchするが、finallyで必ずログアウト
    } finally {
      // 2. 成功、失敗関係なく finally でログイン画面へ遷移
      router.replace(routes.LOGIN);
    }
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
      if (isActive(item.path)) {
        console.log("return true");
        result = true;
      }
    });

    return result;
  };

  useEffect(() => {
    menuItems.forEach((menuItem) => {
      menuItem.subMenu?.forEach((subMenu) => {
        if (subMenu.path && isActive(subMenu.path)) {
          setOpenMenuIds([menuItem.id]);
        }
      });
    });
  }, [pathName]);
  return (
    <aside className={styles.sideMenu}>
      <button className={styles.sideMenuHeader}>
        <div className={styles.sideMenuHeader__icon}>
          <Image
            src="/icons/side-menu/shield-user-white.svg"
            alt=""
            width={28}
            height={28}
          />
        </div>
        <h1>{adminDisplayName}</h1>
      </button>
      <hr className={styles.sideMenu__hr} />
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
      <hr className={styles.sideMenu__hr} />
      <div className={styles.SideMenuFooter}>
        <ul className={styles.menuList}>
          {footerItems.map((footerItem) => {
            return (
              <li className={styles.menuList__item} key={footerItem.id}>
                {isLogout(footerItem.label) && footerItem.path && (
                  <>
                    <button
                      className={`${styles.menuList__link} ${isActive(footerItem.path) ? styles.isActive : ""} ${styles.isLogout}`}
                      type="button"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <Image
                        src={footerItem.iconPath}
                        alt=""
                        width={28}
                        height={28}
                        className={styles.menuList__icon}
                      />
                      {footerItem.label}
                    </button>
                    {isDialogOpen && 
                      <ConfirmDialog 
                        title={footerItem.label} 
                        message={logoutDialogMessage}
                        onCancel={() => setIsDialogOpen(false)}
                        onConfirm={handleLogout}
                      />
                    }
                  </>
                )}
                {!isLogout(footerItem.label) && footerItem.path && (
                  <Link
                    href={footerItem.path}
                    className={`${styles.menuList__link} ${isActive(footerItem.path) ? styles.isActive : ""}`}
                  >
                    <Image
                      src={footerItem.iconPath}
                      alt=""
                      width={28}
                      height={28}
                      className={styles.menuList__icon}
                    />
                    {footerItem.label}
                  </Link>
                )}
                {!isLogout(footerItem.label) && footerItem.subMenu && (
                  <>
                    <button
                      className={`${styles.parentList} ${hasActiveChild(footerItem.subMenu) ? styles.isActive : ""}`}
                      type="button"
                      onClick={() => handleToggleMenu(footerItem.id)}
                    >
                      <Image
                        src={footerItem.iconPath}
                        alt=""
                        width={28}
                        height={28}
                      />
                      {footerItem.label}
                      <Image
                        className={styles.parentList__status}
                        src={
                          isOpen(footerItem.id) ? openMenuIcon : closeMenuIcon
                        }
                        alt=""
                        width={24}
                        height={24}
                      />
                    </button>
                    {isOpen(footerItem.id) && (
                      <ul className={styles.childrenList}>
                        {footerItem.subMenu.map((subMenu) => {
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
      </div>
    </aside>
  );
};

export default SideMenu;
