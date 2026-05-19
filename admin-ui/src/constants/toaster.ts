export const toaster = {
  DELETED: {
    param: '?toaster=deleted',
    key: 'toaster',
    value: 'deleted',
    message: '管理者を削除しました。',
  },
  EDITED: {
    param: '?toaster=edited',
    key: 'toaster',
    value: 'edited',
    message: '管理者の編集が完了しました。'
  }
} as const;