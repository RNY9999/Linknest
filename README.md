# Linknest

## commitメッセージに関して

### タイプ
- feat:     新機能の追加
- fix:      バグ修正
- docs:     ドキュメントのみの変更
- style:    コードのフォーマット（機能変更なし）
- refactor: リファクタリング（挙動変更なし）
- perf:     パフォーマンス改善
- test:     テスト追加・修正
- chore:    ビルド設定・依存更新・CI関連など（その他READMEの更新なども含む）
- hotfix:   緊急修正（本番障害など）

### commitに関して

下記のように作成

```
git commit -m "[issue番号] [タイプ]: 作業内容"

(ex)
git commit -m "#1 chore: commitメッセージに関するREADMEの作成"
```