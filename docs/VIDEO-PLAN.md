# デモ動画（3分）の作り方

Zenn の提出物：約3分の動画（YouTube）。**主要な機能が、実際に動いているところを見せる**こと（モックにしない）。
そのため、次の分担にする。

| 種類 | 使うもの | ルール |
|---|---|---|
| **実画面の録画** | iPhone の画面収録／Mac の QuickTime | アプリの操作は、**必ず本物の録画**。生成した映像で代用しない |
| **イメージ映像** | Google Flow（Veo） | 物語の導入・終わりだけ。画面の左下に「イメージ映像（AI生成）」と常に表示 |
| **構成図・数字** | docs/architecture.png、/how の画面 | 実物のスクリーンショット |
| **ナレーション** | 田前さん本人の声（おすすめ）または Cloud Text-to-Speech | 当事者としての声のほうが、伝わる |

## 構成（3:00）
| 時間 | 映像 | ナレーション |
|---|---|---|
| 0:00–0:20 | 縁側のねこ（Flow S1）→ タイトル「Engawa（縁側）」 | 窓口が変わるたびに、同じ話を、一からする。うまく言葉にできない人ほど、途中で諦めてしまう。私自身、そうでした。Engawa は、困りごとを、自分の言葉のまま持ち歩ける手帳です。 |
| 0:20–0:45 | 3つの窓口で説明を繰り返すAさん（Flow S2、顔は映さない）＋ 字幕「家族の世話をしている中2のうち、相談したことがない子：67.7％（厚労省委託調査、2021）」 | Aさんは、三つ目の窓口で、また同じ説明をしています。家族の世話をしている中学2年生で、相談したことがない子は、およそ7割でした。 |
| 0:45–1:25 | 【実画面・スマホ】はじめる → 書く（声でも可）→ 質問（AIが選ぶ）→ 確認 →「合っている」で印 → 見せる範囲（初期は「見せない」。選ぶとプレビュー） | まず、自分の言葉で書きます。話してもかまいません。AIは、次に聞く質問を選ぶだけで、候補は、あなたの言葉からの引用だけです。診断も、点数づけも、しません。「合っている」を押すと、確認済の印が押されます。窓口に見せる範囲は、あなたが選びます。 |
| 1:25–1:55 | 【実画面】手帳完成 →「窓口に画面を見せる」（大きな文字）→ 紙（QR・照合コード）→ 照合ページで「一致しました」 | できた手帳は、携帯の画面を見せても、紙にして持っていってもかまいません。窓口の準備は、要りません。紙には、日時と照合コードが付いていて、あとから、同じ内容かを確かめられます。 |
| 1:55–2:30 | 【実画面・パソコン】窓口ログイン → 読む → 本人に確かめる（確認前は引き継ぎが鍵つき）→ 引き継ぐ → 経過の時系列 | 窓口側は、読む、本人に確かめる、引き継ぐ、の順です。本人の確認がないと、引き継ぎはできません。誰がいつ見たかは、本人にも見えて、いつでも取り下げられます。 |
| 2:30–2:50 | 【実画面】/how の「22/22」→ Cloud Logging の画面（本文なし）→ 構成図 | AIの出力は、必ず検証します。診断のような質問は、通しません。記録は、書き換えを検知できます。ログに、本人の言葉は入りません。Cloud Run、Vertex AI、Firestore で動いています。 |
| 2:50–3:00 | ねこ（Flow S3）＋ 字幕「現時点では、提携や連携はありません」 | 窓口が受け取るかは、窓口しだいです。まず、カードを作る時間と、書き終える人の割合を測ります。 |

※ 「私自身、そうでした」は、田前さん本人の事実として、この表現でよいか、収録前に確認する。
※ 窓口のパスワードは、動画に映さない（Zenn のテストアカウント欄に書く）。作り話の例だけを使う。

## Google Flow で作るもの（3本・各8秒前後）
共通の注意：**画面に文字を入れない**（生成の文字は崩れやすい）。**顔を映さない**（後ろ姿・手元・影）。**実在のロゴ・実在の役所名を出さない**。静かで、温かい色。大げさに悲しませない。

共通スタイル（毎回、先頭に付ける）：
```
Warm hand-painted 2D animation style, soft paper texture, gentle afternoon light, muted warm palette (cream, wood brown, sage green, soft orange). Calm, quiet, dignified mood. No text, no logos, no subtitles in the image. No faces shown: use back views, hands, silhouettes.
```

**S1：縁側（導入）**
```
[共通スタイル] A Japanese engawa (wooden veranda) in late afternoon. A tabby cat sits calmly with eyes closed on a red zabuton cushion. A small teacup with a thin curl of steam sits beside a small notebook. Sunlight glows softly over a garden. Very slow camera push-in. The cat's tail sways gently. 8 seconds.
```
**S2：繰り返し（問題）**
```
[共通スタイル] Three quick, gentle cuts of a municipal office counter, seen from behind a seated adult (back view, no face). Cut 1: the person speaks to a staff member behind a counter, hands moving as if explaining. Cut 2: a different counter, the same posture, shoulders slightly lower. Cut 3: a third counter, the person's head tilts down, tired. Soft desaturated tones, no dramatic music feel. Staff are blurred silhouettes. 8 seconds.
```
**S3：終わり（余韻）**
```
[共通スタイル] The same engawa at dusk. Warm orange light. The tabby cat dozes. A small notebook with a green checkmark seal sits on the wooden floor next to the cup. Camera slowly pulls back. 6 seconds.
```
同じねこの見た目を保つために、Flow の「参照画像」に、アプリのねこの絵（docs の画像）を入れる。

## 実画面の録画のしかた
1. iPhone：設定 → コントロールセンターに「画面収録」を追加 → 通知をオフ（おやすみモード）→ 録画しながら、公開URLを操作。
2. Mac：QuickTime → 新規画面収録。窓口の画面は、パソコン幅で。
3. 手順は、**作り話の例**で（家賃・窓口の繰り返し）。本物の困りごとは、入れない。
4. 録画は、1場面ずつ撮って、あとで繋ぐ（失敗しても、撮り直しやすい）。
5. 公開URL：https://engawa-935562452794.asia-northeast1.run.app

## 公開（YouTube）
- 3分以内。限定公開でも可（審査員が見られる設定にする）。
- 説明欄に：AI の使用（Gemini、Flow、Claude Code）、イメージ映像は AI 生成であること、提携がないこと、リポジトリ、公開URL。
- 字幕（日本語）を付ける。

## 所要の目安
撮影・録画 約1〜2時間、Flow 生成と選別 約1時間、編集 約1〜2時間、ナレーション録音 約30分。
