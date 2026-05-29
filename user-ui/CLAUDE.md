@AGENTS.md
# Linknest user-ui

## プロジェクト概要
- Linknest の一般ユーザー向けUI
- MVP1ではログイン、ホーム、チャット等を実装予定
- 現在の実装対象は MVP1-FEAT-001 ログイン機能

## 技術構成
- Next.js App Router
- TypeScript
- CSS Modules
- CSSリセットには `destyle.css` を使用する
- Tailwind CSS は使用しない
- React Compiler は使用しない
- 外部UIコンポーネントライブラリは使用しない
- 開発ポートは `3400`

## ディレクトリ方針
- 画面: src/app/
- 再利用UI: src/components/
- 定数: src/constants/
- API関連: src/lib/
- 型定義: src/types/

## 実装ルール
- 仕様やWFに記載されていない機能を勝手に追加しない
- 外部UIライブラリを勝手に導入しない
- 新しいnpmパッケージを追加する前に確認する
- 過剰な共通化は行わない
- 変更前に変更対象ファイルと方針を説明する
- 実装後に npm run lint と npm run build を実行する

## 現在の実装順
1. /login の静的UI
2. 入力状態管理
3. UIバリデーション
4. エラー・アカウントロック表示
5. API連携
6. テスト