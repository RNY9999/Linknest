# MVP1-FEAT-001 ログイン機能 実装ログ

## 機能概要

* 機能ID: `MVP1-FEAT-001`
* 機能名: ログイン機能
* 対象UI: Linknest user-ui
* 参照資料:
  * `README.md`
  * `login-flow.png`

---

## 実装履歴

---

### [工程1] /login 静的UI実装

- **実施日**: 2026-05-29
- **担当**:
  - 初期静的UI実装: Claude Code
  - WF確認・実機表示確認・CSS調整: ユーザー

#### 実装内容

- `/login` 画面の初期表示状態を静的UIとして実装した
- WF「1. ログイン画面」の全表示要素を実装対象とした

#### 変更ファイル

| ファイル | 種別 |
|---|---|
| `src/app/login/page.tsx` | 新規作成 |
| `src/app/login/page.module.css` | 新規作成 |

#### 設計判断

- カードUI（白背景・角丸・シャドウ）はWFに存在しないため追加しなかった
- レイアウトはすべて CSS Grid で実装。`display: flex` は使用していない
- パスワード入力欄の目アイコンは `grid-area: 1 / 1 / 2 / 2` による同一グリッドセル重ねで配置し、`position: absolute` は使用していない
- クラス名はケバブケースBEM（`.login-page`, `.login-page__*`）に統一
- ログインボタンは静的UIのため `type="button"`
- PC表示時にフォーム横幅が過度に広がらないよう、`.login-page__content` に `max-width: 460px` と `justify-self: center` を設定して中央配置とした
- `href="#"` はプレースホルダー。実際のリンク先は今後の工程で設定する

#### 未実装事項（次工程以降）

- 入力状態管理
- UIバリデーション
- 入力欄・ボタン・リンクのフォーカス表示（`:focus-visible`）対応
- 認証失敗表示
- アカウントロックモーダル
- API連携
- 画面遷移

#### 確認結果

- `npm run lint`: エラーなし
- `npm run build`: 成功（`/login` Static生成）
- ブラウザでの初期表示確認済み
- iPhone 16 Pro Max 実機からLAN経由での表示確認済み（ユーザーによるCSS調整完了）

#### 次の作業

- 工程2: 入力状態管理（`useState` によるメールアドレス・パスワード制御）