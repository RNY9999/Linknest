---
name: "機能追加・改善提案テンプレート"
about: 新しい機能の追加、または既存機能の改善の際のISSUEテンプレート
title: "【】"
labels: ["TASK"]
assignees: []
---

## 概要
どんな機能を追加・改善したいかを簡潔に記載してください。

例：
管理者ログイン後のセッション延長APIにCSRFトークンを返すようにしたい。

---

## 目的・背景
なぜこの機能が必要なのか、どんな課題を解決するのかを記載してください。

例：
- セッション更新APIがCSRFトークンを返さないため、UI側でトークンリフレッシュができない  
- セキュリティ上、CSRF防止の仕組みを全APIに統一する必要がある

---

## 詳細仕様・要件
実装に必要な要件や補足を具体的に記載してください。

例：
- API: `/api/admin/session/refresh`
- Method: `POST`
- Response: `{ "refreshed": true, "expiresAt": "2025-10-08T10:00:00Z" }`
- Cookie: `ln_csrf`を新規発行

---

## 完了条件
完了と判断する基準を明確に記載してください。

- [ ] 機能が仕様通り動作している
- [ ] 単体テスト・統合テストが通過している
- [ ] OpenAPI（YAML）に反映済み
- [ ] UI設計書（PPTX / Figma）と整合性あり

---

## 関連資料
- `/openapi/paths/admin/session.yaml`
- `A_Linknest_UI資料_内部設計書_20250815.pptx`
- `Linknest_テーブル定義書_20250806.xlsx`

---

## 担当者
@hisamatsu-renya  
（他にアサインが必要なら追加してください）
