import { routes } from "@/constants/routes";
export type SubMenuItem = {
  id: number
  label: string;
  path: string;
}

type MenuItem = {
  id: number
  label: string;
  iconPath: string;
  path?: string;
  subMenu?: SubMenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    id: 100,
    label: 'ホーム',
    iconPath: '/icons/side-menu/home.svg',
    path: routes.TOP,
  },
  {
    id: 200,
    label: '通知・お知らせ',
    iconPath: '/icons/side-menu/bell-ring.svg',
    subMenu: [
      {
        id: 201,
        label: '',
        path: '',
      }
    ]
  },
  {
    id: 300,
    label: 'サポート',
    iconPath: '/icons/side-menu/headset.svg',
    subMenu: [
      {
        id: 301,
        label: '',
        path: '',
      }
    ]
  },
  {
    id: 400,
    label: 'ユーザー',
    iconPath: '/icons/side-menu/users-round.svg',
    subMenu: [
      {
        id: 401,
        label: '',
        path: '',
      }
    ]
  },
  {
    id: 500,
    label: '管理者',
    iconPath: '/icons/side-menu/shield-user.svg',
    subMenu: [
      {
        id: 501,
        label: '管理者一覧',
        path: routes.ADMINS,
      }
    ]
  },
  {
    id: 600,
    label: 'ログ',
    iconPath: '/icons/side-menu/file-text.svg',
    subMenu: [
      {
        id: 601,
        label: '',
        path: '',
      }
    ]
  },
];