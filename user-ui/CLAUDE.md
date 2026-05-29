@AGENTS.md

# Linknest user-ui

## プロジェクト概要

* Linknest の一般ユーザー向けUI
* MVP1ではログイン、ホーム、チャット等を段階的に実装予定
* 現在の実装対象は `MVP1-FEAT-001` ログイン機能

## 技術構成

* Next.js App Router
* TypeScript
* CSS Modules
* CSSリセットには `destyle.css` を使用する
* Tailwind CSS は使用しない
* React Compiler は使用しない
* 外部UIコンポーネントライブラリは使用しない
* 開発ポートは `3400`

## ディレクトリ方針

* 画面・レイアウト: `src/app/`
* 再利用可能なUI: `src/components/`
* 定数: `src/constants/`
* API関連・共通処理: `src/lib/`
* 型定義: `src/types/`
* 画像・アイコン等の静的ファイル: `public/`
* 設計資料・WF: `docs/`

## 実行コマンド

* 開発サーバ起動: `npm run dev`
* Lint確認: `npm run lint`
* Build確認: `npm run build`

## 実装ルール

* 仕様やWFに記載されていない機能を勝手に追加しない
* 外部UIライブラリを勝手に導入しない
* 新しいnpmパッケージを追加する前に、理由と代替案を説明して確認する
* 過剰な共通化は行わない
* 機能実装、ディレクトリ構成変更、依存追加、既存仕様に影響する変更を行う前に、変更対象ファイルと方針を説明する
* 実装後に `npm run lint` と `npm run build` を実行し、結果を報告する
* 明示的な依頼がない限り、`git commit` や `git push` は行わない

## CSS命名ルール

* CSS Modules のクラス名は BEM を基本とし、ケバブケースで記述する
* Block は画面または独立した共通コンポーネント単位とする

  * 例: `.login-page`
* Element は `__` で表現する

  * 例: `.login-page__content`
  * 例: `.login-page__input`
  * 例: `.login-page__login-button`
* Modifier は独立した状態クラスとして `.--modifier` の形式で定義する

  * 例: `.login-page__input.--error`
  * 例: `.login-page__login-button.--disabled`
* TSX側では、CSS Modulesのクラス名をブラケット記法で参照する

  * 通常: `styles["login-page__input"]`
  * Modifier付き: `${styles["login-page__input"]} ${styles["--error"]}`
* ModifierをElement名とまとめた1つのキーとして参照しない

  * NG: `styles["login-page__input --error"]`

## CSSレイアウトルール

* レイアウト配置のために `display` を指定する場合は、原則として `display: grid` を使用する
* `display: flex` は使用しない
* 縦並び、横並び、中央配置、要素の重ね合わせも可能な限り CSS Grid で実装する
* パスワード入力欄の目アイコンのような重ね合わせも、`position: absolute` より Grid による配置を優先する
* 例外的に Grid では不自然な実装になる場合は、変更前に理由を説明して確認する

## 今後の実装順

1. `/login` の静的UI
2. 入力状態管理
3. UIバリデーション
4. エラー・アカウントロック表示
5. API連携
6. テスト

## 現在の実装対象

* 対象機能: `MVP1-FEAT-001` ログイン機能
* 対象画面: `/login`
* 現在の工程: 入力状態管理・パスワード表示切替・フォーカス表示対応
* 参照資料: `docs/design/MVP1-FEAT-001/README.md`
* WF画像: `docs/design/MVP1-FEAT-001/login-flow.png`
* 今回実装する内容:
  * メールアドレス入力値の状態管理
  * パスワード入力値の状態管理
  * パスワード表示／非表示切替
  * 目アイコンの表示切替
  * 入力欄・ボタン・リンクのフォーカス表示（`:focus-visible`）対応
* UIバリデーション、API連携、認証処理、画面遷移、認証失敗表示、アカウントロック制御は、明示的に依頼されるまで実装しない
* ログインボタンの活性・非活性制御は、仕様確定まで実装しない

## 実装ログ運用
- 機能単位の実装ログは `docs/design/{機能ID}/implementation-log.md` に記録する
- 小さな調整ごとではなく、実装工程が完了したタイミングで記録する
- 実装ログには、実装内容、変更ファイル、設計判断、未実装事項、確認結果、次の作業を記載する
- 実装ログの追記は、ユーザーが確認・許可した後に行う