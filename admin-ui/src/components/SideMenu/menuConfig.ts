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
        label: '未実装メニュー1',
        path: 'test1',
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
        label: '未実装メニュー2',
        path: 'test2',
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
        label: '未実装メニュー3',
        path: 'test3',
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
        label: '未実装メニュー4',
        path: 'test4',
      }
    ]
  },
];

export const footerItems: MenuItem[] = [
  {
    id: 10,
    label: '設定',
    iconPath: '/icons/side-menu/cog.svg',
    path: routes.OPTIONS,
  },
  {
    id: 20,
    label: 'ログアウト',
    iconPath: '/icons/side-menu/log-out.svg',
    path: routes.LOGIN,
  },
]