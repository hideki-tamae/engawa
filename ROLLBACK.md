# 戻し方（UI v1 = 2026-10-08 の形）

## コード
```bash
git checkout ui-v1-2026-10-08          # その時点を見る
git switch -c from-ui-v1 ui-v1-2026-10-08   # そこから作業を続ける
```

## 公開環境（Cloud Run）
その時点の版は、リビジョン `engawa-00006-64d`（イメージ `engawa:v5`）。
```bash
gcloud run services update-traffic engawa --region asia-northeast1 --project engawa-care \
  --to-revisions engawa-00006-64d=100
```
