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

## v66（2026-10-12 13:35 JST）の内容
比較図のアニメーション、共有画面の1文、「してほしいこと」の箇条書き、フッターの ©。リビジョン `engawa-00070-2rc`（イメージ `engawa:v66`）。

## v65（2026-10-12 13:13 JST）に戻す
内容：サンプルの「本人の言葉」を1行表示、トップに「あなたの情報は、どうなりますか？」、`/about`・LICENSE を含む。
- コード：`git checkout v65-before-anim`（コミット `e881fea`）
- 公開環境：リビジョン `engawa-00069-rvs`（イメージ `engawa:v65`）
```bash
gcloud run services update-traffic engawa --region asia-northeast1 --project engawa-care --to-revisions engawa-00069-rvs=100
```
## v64（2026-10-11、マイク対応の版）に戻す
- リビジョン `engawa-00068-vlx`（イメージ `engawa:v64`）。`/about` は含まれない。

## v67（2026-10-12 夜）の内容と戻し方
トップを、新しい水彩調の画像（縁側のバナー＋Aさんの4コマ）に差し替え。コード：`StoryHero.tsx`、`public/story/`。
- 1つ前（v66）：リビジョン `engawa-00070-2rc`（git タグ `v66`）。v67 は `engawa-00071-fdl`
```bash
gcloud run services update-traffic engawa --region asia-northeast1 --project engawa-care --to-revisions engawa-00070-2rc=100
```

## v68（2026-10-12 夜）の内容と戻し方
各ステップ（書く・質問×4・確認・見せ方）、完成、窓口の方へ、仕組みを見る、プライバシーの絵を、Aさんの水彩調（AI生成）の画像に差し替え。`public/steps/`。フッターに、AI生成の注記。
- 1つ前（v67）：リビジョン `engawa-00071-fdl`（v68 は `engawa-00072-n94`）
```bash
gcloud run services update-traffic engawa --region asia-northeast1 --project engawa-care --to-revisions engawa-00071-fdl=100
```

## v69（2026-10-12 夜）
フッターの「イラストは、AI で生成したイメージです」を削除（田前さんの指示）。1つ前（v68）：リビジョン `engawa-00072-n94`。

## v70（2026-10-12 夜）
採点フォーム `/rate` の「あなたは」に、「医療の仕事」「経営・事業の仕事」を追加（専門家へのフィードバック依頼のため）。1つ前（v69）：リビジョン `engawa-00073-zj6`。

## v71（2026-10-13）
リビジョン `engawa-00075-bhz`。ログインに絵・1文を1行・パスワード表示切替。戻し先は v70 = engawa-00074-9ns。
