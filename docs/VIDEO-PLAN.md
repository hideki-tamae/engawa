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
| 0:00–0:20 | 縁側の空の座布団とノート（Flow S1）→ タイトル「Engawa（縁側）」 | 窓口が変わるたびに、同じ話を、一からする。うまく言葉にできない人ほど、途中で諦めてしまう。Engawa は、困りごとを、自分の言葉のまま持ち歩ける手帳です。 |
| 0:20–0:45 | 3つの窓口で説明を繰り返すAさん（Flow S2、顔は映さない）＋ 字幕「窓口に不満を持った人の60.2%が、待ち時間を理由に挙げた（名古屋市・令和7年度第1回市政アンケート、有効回答851人）」 | 窓口の不満で、いちばん多いのは待ち時間です。Engawa は、待ち時間そのものは、解決しません。狙うのは、窓口を回るたびに、同じ説明をやり直す手間です。 |
| 0:45–1:20 | 【実画面・スマホ】はじめる → 書く（声でも可）→ 質問（AIが選ぶ）→ 確認 →「合っている」で印 → 見せる範囲 | まず、自分の言葉で書きます。話してもかまいません。AIは、次に聞く質問を選ぶだけで、候補は、あなたの言葉からの引用だけです。診断も、点数づけも、しません。窓口に見せる範囲は、あなたが選びます。 |
| 1:20–1:45 | 【実画面】手帳完成 →（任意）基本情報を、この端末にだけ残す →「窓口に画面を見せる」→ 基本情報も見せる → 項目ごとにコピー | 名前や住所を、毎回書く手間も、減らせます。基本情報は、端末の中にだけ残り、見せるかどうかは、そのつど選びます。身分証の写真やマイナンバーは、預かりません。 |
| 1:45–2:10 | 【実画面・パソコン】/window で受け取る → 本人に確かめる（確認前は引き継ぎが鍵つき）→ 引き継ぐ → 招待コードをつくる | 窓口側は、読む、本人に確かめる、引き継ぐ、の順です。引き継いだら、次の窓口に、招待コードを渡せます。受け取った窓口は、試行の間、無料で、導入の初期設定の代行も受けられます。 |
| 2:10–2:35 | 【実画面】次の相談先の提案（確認できたリンクだけ公式ページ。確認できないものは、公式サイト内の検索リンク）→ Model Armor が攻撃文を止める画面（固定の質問に戻る） | AIは、相談先を探しますが、リンクは、実際にページを開いて確かめたものだけを出します。「指示を無視して」のような攻撃文は、Google の Model Armor で検出して、AIに渡しません。 |
| 2:35–2:55 | 【実画面】/how の Evals → 安全テスト13項目 → 構成図 → 費用の1枚（1件 約1.5円） | 診断のような質問は、通しません。共有範囲の外が見えないこと、取り下げが効くことなど、13項目を、本番で確かめています。ログに、本人の言葉は入りません。1件の相談の費用は、音声ありで、約1.5円です。 |
| 2:55–3:00 | 縁側の夕方（Flow S3）＋ 字幕「現時点では、提携や連携はありません」 | 窓口が受け取るかは、窓口しだいです。まず、カードを作る時間と、書き終える人の割合を測ります。 |

※ 名古屋市の数字は、**年度・調査名・母数**を字幕に入れる。60.2%は「窓口に不満を持った人」の中での割合で、全市民の割合ではない。
※ 「私自身、そうでした」は、本人の事実として使うか、収録前に確認する（今回の台本では外した）。
※ 窓口のパスワードは、動画に映さない（Zenn のテストアカウント欄に書く）。作り話の例だけを使う。
※ 費用の1.5円は、小さな実測（各3回）に基づく概算（docs/COST.md）。字幕に「概算」と入れる。

## Google Flow で作るもの（3本・各8秒前後）
共通の注意：**画面に文字を入れない**（生成の文字は崩れやすい）。**顔を映さない**（後ろ姿・手元・影）。**実在のロゴ・実在の役所名を出さない**。静かで、温かい色。大げさに悲しませない。

共通スタイル（毎回、先頭に付ける）：
```
Warm hand-painted 2D animation style, soft paper texture, gentle afternoon light, muted warm palette (cream, wood brown, sage green, soft orange). Calm, quiet, dignified mood. No text, no logos, no subtitles in the image. No faces shown: use back views, hands, silhouettes.
```

**S1：縁側（導入・ねこなし）**
```
[共通スタイル] A Japanese engawa (wooden veranda) in late afternoon. A red zabuton cushion sits empty on the wooden floor. A small teacup with a thin curl of steam sits beside a small notebook. Sunlight glows softly over a garden. Very slow camera push-in. Steam from the teacup drifts gently. 8 seconds.
```
**S2：繰り返し（問題）**
```
[共通スタイル] Three quick, gentle cuts of a municipal office counter, seen from behind a seated adult (back view, no face). Cut 1: the person speaks to a staff member behind a counter, hands moving as if explaining. Cut 2: a different counter, the same posture, shoulders slightly lower. Cut 3: a third counter, the person's head tilts down, tired. Soft desaturated tones, no dramatic music feel. Staff are blurred silhouettes. 8 seconds.
```
**S3：終わり（余韻）**
```
[共通スタイル] The same engawa at dusk. Warm orange light. The empty zabuton rests quietly. A small notebook with a green checkmark seal sits on the wooden floor next to the cup. Camera slowly pulls back. 6 seconds.
```
ねこは使わない（キャラクターなし）。

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
