# Engawa 実装キュー（課金なしで進められる分）
合否は `npm run verify`（`verify:full` はビルド込み）。全 PASS になるまで次へ進まない。

- [x] 1. API 乱用対策（回数制限・入力サイズ上限）
- [x] 2. デモ用アカウント（ソーシャルログインなし／テスト用トークン）
- [x] 3. 本人側の取り下げ・訂正の画面
- [x] 4. 記録の重複（同一窓口の連続開封）を1回にまとめる
- [x] 5. Dockerfile: docker build 成功、コンテナ実行（非 root）で画面と Gemini を確認。イメージに .env* は含まれない
- [x] 6. スマホ幅（375px）で、入力・質問・確認の3画面を確認（横スクロールなし）。窓口画面のスマホ幅は未確認
- [x] 7. README・AI 使用の開示・プライバシー説明
- [~] 8. 台本は作成。構成図は課金後の実際の構成で最終版を作る 構成図・3分デモ台本

# 課金後（Cloud Run・Vertex AI・Firestore(30日TTL) は 2026-10-08 に完了。残り：Speech-to-Text、Cloud Logging の見せ方、KMS による外部固定）
Firestore / Cloud Run / Speech-to-Text / Cloud Logging
