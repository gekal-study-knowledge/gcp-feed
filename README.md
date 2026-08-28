# GCP Feed 購読システム

Google Cloud 公式の RSS フィードを自動的に購読し、日単位でまとめた Markdown レポートを生成し、Next.js で閲覧できるシステムです。

## 機能

- **自動フィード取得**: Google Cloud リリースノート、Google Cloud Blog、Google Online Security Blog など 7 つのフィードを取得
- **変更検出**: 新規エントリーのみを検出して処理（MD5 ハッシュで重複判定）
- **日単位レポート**: 新しい情報が公開された日ごとに Markdown ファイルを生成
- **GitHub Actions 連携**: 1 時間ごとに自動実行し、変更を自動コミット
- **Next.js + GitHub Pages 公開**: モダンな UI でレポートを閲覧可能（ダークモード対応）
- **既読管理**: 日別ページ単位で既読/更新状態を表示。Google ログイン時は Cloud Firestore に保存され、複数デバイス間で同期（未ログイン時は localStorage で動作）

## ディレクトリ構成

```
gcp-feed/
├── .github/
│   ├── scripts/
│   │   ├── main.py              # フィード取得スクリプト
│   │   ├── config.yaml          # フィード設定
│   │   └── requirements.txt     # Python 依存パッケージ
│   └── workflows/
│       ├── fetch-feeds.yml      # フィード取得ワークフロー
│       └── deploy.yml           # デプロイワークフロー
├── src/
│   ├── app/                     # Next.js App Router
│   ├── components/              # UI コンポーネント (Atoms/Molecules/Organisms)
│   ├── lib/                     # ユーティリティ (posts.ts など)
│   └── theme/                   # MUI テーマ設定
├── data/                        # 日毎・情報源ごとの YAML データ (自動生成)
│   └── YYYY/
│       └── MM/
│           └── YYYY-MM-DD/
│               ├── gcp_release_notes.yaml
│               └── ...
├── _posts/                      # 日単位の Markdown レポート (自動生成)
│   └── YYYY/
│       └── MM/
│           └── YYYY-MM-DD-news.md
├── package.json                 # Node.js 依存パッケージ
└── tsconfig.json                # TypeScript 設定
```

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/gekal-study-knowledge/gcp-feed.git
cd gcp-feed
```

### 2. Python 依存パッケージのインストール

```bash
pip install -r .github/scripts/requirements.txt
```

### 3. Node.js 依存パッケージのインストール

```bash
npm install
```

### 4. ローカルでの実行

#### フィード取得（Python）

```bash
python3 .github/scripts/main.py
```

初回実行時は全エントリーが新規として扱われ、日単位の Markdown が生成されます。

#### 全レポートの再生成

```bash
python3 .github/scripts/main.py --rebuild
```

#### 開発サーバーの起動（Next.js）

```bash
npm run dev
```

http://localhost:3000 でプレビューできます。

## GitHub Actions での自動実行

### 設定方法

1. GitHub リポジトリにコードをプッシュ
2. リポジトリの Settings → Actions → General で、Workflow permissions を「Read and write permissions」に設定
3. リポジトリの Settings → Pages で、Source を「Deploy from a branch」、Branch を「main」、Folder を「`/ (root)`」に設定

### 実行スケジュール

- **自動実行**: 1 時間ごと (毎時 0 分)
- **手動実行**: GitHub の Actions タブから「Fetch GCP Feeds」ワークフローを選択し、「Run workflow」をクリック

### 動作フロー

1. **フィード取得ジョブ**:
   - フィードを取得
   - 新規エントリーを検出（MD5 ハッシュで重複判定）
   - YAML データを更新 (`data/`)
   - 日単位の Markdown を生成 (`_posts/`)
   - 変更があれば自動コミット&プッシュ

2. **デプロイジョブ** (変更がある場合のみ):
   - Next.js ビルド (`npm run build`)
   - 静的ファイルを GitHub Pages にデプロイ

## GitHub Pages での公開

設定完了後、以下の URL でアクセス可能になります:

```
https://gcp.news.gekal.cn/
```

### 表示内容

- **トップページ**: 最近の記事（先月 1 日〜）と月別アーカイブ
- **アーカイブページ**: 月単位で記事をリスト表示
- **記事ページ**: 日単位の Google Cloud ニュースを情報源別に表示
- **ダークモード対応**: 右上のトグルで切り替え可能

## 設定ファイル (config.yaml)

場所：`.github/scripts/config.yaml`

```yaml
feeds:
  - name: 'Google Cloud Release Notes'
    url: 'https://cloud.google.com/feeds/gcp-release-notes.xml'
    source_id: 'gcp_release_notes'

  - name: 'Google Cloud Blog'
    url: 'https://cloudblog.withgoogle.com/rss/'
    source_id: 'google_cloud_blog'

  - name: 'Google Cloud Japan Blog'
    url: 'https://cloudblog.withgoogle.com/ja/rss/'
    source_id: 'google_cloud_japan_blog'

  - name: 'Google Cloud Blog (AI & ML)'
    url: 'https://cloudblog.withgoogle.com/products/ai-machine-learning/rss/'
    source_id: 'google_cloud_ai_ml_blog'

  - name: 'Google Online Security Blog'
    url: 'https://security.googleblog.com/feeds/posts/default'
    source_id: 'google_security_blog'

  - name: 'GKE Security Bulletins'
    url: 'https://cloud.google.com/feeds/kubernetes-engine-security-bulletins.xml'
    source_id: 'gke_security_bulletins'

  - name: 'Google Cloud Status'
    url: 'https://status.cloud.google.com/en/feed.atom'
    source_id: 'google_cloud_status'

# この文字数を超える summary は <details> で折りたたむ（0 で無効）
summary_collapse_threshold: 2000

data_dir: 'data'
output_dir: '_posts'
```

### summary の HTML 表示

Google のフィードは summary に見出し・表・`aside` を含む HTML を全文で載せてきます
（1 エントリー平均 20〜25KB、リリースノートは最大 100KB）。この HTML はそのまま描画しますが、
素で書き出すと本文中の `<h2>` がページ自身の情報源見出しと同じ要素になり、階層が崩れます。
そのため `main.py` は summary を必ず `.entry-summary` でラップし、CSS 側でフィード本文として
分離できるようにしています。

`config.yaml` の `summary_collapse_threshold`（既定 2000 文字）を超える summary は
`<details>` で折りたたみます。1 日のページ高さが 49,000px から 2,800px になり、
スマートフォンでも見出しを拾いながら読めます。`0` を設定すると折りたたみを無効化できます。

表示側（`src/components/organisms/PostContent.tsx`）での対応:

| 対象       | 内容                                                                                          |
| :--------- | :-------------------------------------------------------------------------------------------- |
| 見出し     | ページ自身の見出しは `& > h2` / `& > h3` と直接の子に限定。本文中の h1〜h6 は一段小さく正規化 |
| 表         | 要素内で横スクロールさせ、ページ全体を押し広げない。セル内のリストも詰める                    |
| `aside`    | Google のリリースノートが使う注記ブロックとして左罫線付きで表示                               |
| 長い URL   | `overflow-wrap: anywhere` で折り返す                                                          |
| NEW バッジ | `.entry-summary` 内の h3 を除外し、エントリー見出しにのみ付与                                 |

### フィード選定メモ

Google Cloud はフィードの鮮度・粒度がまちまちなため、以下を実測した上で選定しています。

| 項目                       | 内容                                                                                                                             |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| リリースノート             | `gcp-release-notes.xml` は 1 エントリー = 1 日分の全プロダクト分の集約。タイトルは `August 26, 2026` のような日付になる          |
| プロダクト別リリースノート | `compute-engine` は 2020 年、`anthos` は 2022 年で更新が止まっている。集約フィードと内容も重複するため採用しない                 |
| 日本語ブログ               | `cloudblog.withgoogle.com/ja/rss/` が存在し、AWS Japan Blog に相当する（Azure には無い）                                         |
| Google Developers Blog     | `developers.googleblog.com/feeds/posts/default` は item に日付要素が一切無く、全件が取得日に寄ってしまうため採用しない           |
| Google Cloud Status        | 障害が無い間はエントリーがほとんど無い。これは正常                                                                               |
| サマリーが大きい           | Google のフィードは全文配信で、1 エントリーが平均 20〜25KB、リリースノートは最大 100KB。日次 Markdown が数百 KB になることがある |

`Google Cloud Blog (AI & ML)` は総合フィード `cloudblog.withgoogle.com/rss/` と一部重複します
（実測で 20 件中 8 件）。重複判定は情報源ごとに行われるため、同じ記事が 2 つの見出しの下に出ることがあります。
AI/ML の記事量が多く総合フィードから押し出されやすいため、重複を許容して採用しています。

その他のトピック別フィード（同様に総合フィードと重複します）:
`https://cloudblog.withgoogle.com/products/{compute,networking,data-analytics,identity-security}/rss/` /
`https://cloudblog.withgoogle.com/topics/developers-practitioners/rss/`

その他の候補: `https://research.google/blog/rss/`（100 件）、`https://kubernetes.io/feed.xml`（50 件）。
`https://firebase.blog/rss.xml` は 2012 年まで遡る 616 件を返すため、取り込むなら覚悟が必要です。

### フィードの追加方法

新しいフィードを追加するには、`feeds` セクションに以下の形式で追加します:

```yaml
feeds:
  - name: '表示名'
    url: 'RSS フィードの URL'
    source_id: '一意な識別子'
```

## 出力形式

### REST API

収集した全エントリーを JSON 形式で取得できます。

- **Endpoint**: `/api/entries/all/index.json`
- **Method**: `GET`
- **Response**: `Entry[]`

### 日別 REST API

特定の日付のエントリーのみを JSON 形式で取得できます。

- **Endpoint**: `/api/entries/[year]/[month]/[day]/index.json`
- **Method**: `GET`
- **Response**: `Entry[]`

**利用例**:

```bash
# 2026年4月24日のエントリーを取得
curl https://gcp.news.gekal.cn/api/entries/2026/04/24/index.json
```

**Entry オブジェクトの構造**:

| フィールド   | 型       | 説明                                                            |
| :----------- | :------- | :-------------------------------------------------------------- |
| `id`         | `string` | エントリーの一意識別子 (MD5 ハッシュ)                           |
| `title`      | `string` | 記事のタイトル                                                  |
| `link`       | `string` | 記事へのリンク                                                  |
| `published`  | `string` | 公開日時 (`YYYY-MM-DD HH:MM:SS`)                                |
| `fetched`    | `string` | 取得日時 (`YYYY-MM-DD HH:MM:SS`)                                |
| `summary`    | `string` | 記事の概要 (HTML 形式)                                          |
| `sourceId`   | `string` | 情報源の識別子 (例: `gcp_release_notes`)                        |
| `sourceName` | `string` | 情報源の人間が読みやすい名前 (例: `Google Cloud Release Notes`) |

**利用例**:

```bash
curl https://gcp.news.gekal.cn/api/entries/all/index.json
```

### データファイル (YAML)

各情報源のエントリーは日毎に `data/YYYY/MM/YYYY-MM-DD/` ディレクトリに保存されます:

**例**: `data/2026/03/2026-03-20/gcp_release_notes.yaml`

```yaml
entries:
  '03e53c826d6aaecf116c86dbdce0075a':
    'id': '03e53c826d6aaecf116c86dbdce0075a'
    'title': '記事のタイトル'
    'link': 'https://...'
    'published': '2026-03-20 18:38:00'
    'summary': '記事の概要...'
last_updated: '2026-03-21 10:45:50 JST'
```

### 日単位レポート (Markdown)

新規エントリーがあった日付の Markdown が `_posts/YYYY/MM/` に生成されます:

**例**: `_posts/2026/03/2026-03-20-news.md`

```markdown
---
layout: default
title: GCP News - 2026-03-20
news_counter: 15
last_updated: '2026-03-21 10:45:50 JST'
---

# GCP Updates - 2026-03-20

## Google Cloud Release Notes

### August 26, 2026

- **Link**: [https://...](https://...)
- **Published**: 2026-03-20 18:38:00

記事の概要...
```

記事は情報源ごとにグループ化され、各情報源内で公開日順に並びます。

## AI 概要の再チェック

各日の概要は `data/YYYY/MM/YYYY-MM-DD/summary.yaml` に保存され、`generated_at` に
生成時刻が秒まで記録されます。フィードは後から同じ日付のエントリーを追加してくることが
あるため、`generated_at` より後に取得された (`fetched` が新しい) エントリーがある日は
概要が古くなります。

`check_summaries.py` はその状態を洗い出します。

```bash
# 対応が必要な日を一覧表示
python3 .github/scripts/check_summaries.py

# 特定日以降だけを対象にする
python3 .github/scripts/check_summaries.py --since 2026-08-01

# JSON で出力する (自動処理向け)
python3 .github/scripts/check_summaries.py --json

# 終了コードだけ見る (CI 向け。対応が必要なら 1)
python3 .github/scripts/check_summaries.py --quiet
```

検出する状態は 3 つです。

| 状態                        | 意味                                                                                             |
| :-------------------------- | :----------------------------------------------------------------------------------------------- |
| 概要が未生成                | その日の `summary.yaml` が存在しない                                                             |
| 概要の生成後に変更あり      | `generated_at` より後に取得されたエントリーがある、または `article_count` が実データとずれている |
| generated_at を解釈できない | `generated_at` が想定の形式でない                                                                |

初期に生成された概要は `generated_at` が `"YYYY-MM-DD JST"` と日付のみで時刻を持ちません。
その場合はその日の 23:59:59 に生成されたものとみなして比較し、誤検知を防いでいます。

このスクリプトは `fetch-feeds.yml` の取得ステップの直後にも実行され、結果が
GitHub Actions のジョブサマリーに出力されます。毎時の取得で概要が古くなった日は
そこで確認できます。

### ズレの警告

概要を生成した後にフィードが同じ日付のエントリーを追加すると、概要と記事一覧の
内容がずれます。日別ページはビルド時にこれを判定し、ずれていれば概要の上に
警告を表示します。

- 記事数のチップが `概要 N 記事 / 一覧 M 記事` に変わる
- 「この概要は最新ではありません」という警告を出し、生成後に追加された件数を示す

判定は `getDailySummary()` が行い、`generated_at` より後に取得された
(`fetched` が新しい) エントリーの有無と、`article_count` と実データの件数の
一致を見ます。`generated_at` が日付のみの古い概要はその日の 23:59:59 とみなす
ため、同じ日に取得されたエントリーを誤って「生成後の追加」と判定しません
(`check_summaries.py` と同じ規則)。

警告が出た日は `check_summaries.py` でも「概要の生成後に変更あり」として
報告されるので、スキルの手順で作り直してください。

### 概要の生成・更新

概要の本文は自動生成されず、AI (Claude) が書きます。手順は
`.claude/skills/daily-ai-summary/SKILL.md` にスキルとしてまとめてあり、
Claude Code でこのリポジトリを開けば読み込まれます。

```bash
# 1. 対象日を洗い出す
python3 .github/scripts/check_summaries.py

# 2. 概要を書くためのダイジェストを作る
python3 .github/scripts/summary_digest.py --missing --limit 200
python3 .github/scripts/summary_digest.py 2026-08-27,2026-08-28

# 3. (Claude が overview と topics を書いて JSON にする)

# 4. summary.yaml へ書き出す
python3 .github/scripts/write_summary.py summaries.json          # 新規
python3 .github/scripts/write_summary.py summaries.json --force  # 作り直し

# 5. 確認する
python3 .github/scripts/check_summaries.py
```

`article_count` と `sources` は `write_summary.py` が実データから数え直すため、
JSON には `date` / `overview` / `topics` だけを書きます。`generated_at` も
実行時刻が秒まで自動で入ります。

## 既読管理 (Firebase)

日別ページの既読/更新状態を管理します。Google アカウントでログインすると Cloud Firestore に保存され、複数のデバイス・ブラウザ間で既読状態が同期されます。未ログイン時は従来どおりブラウザの localStorage に保存されます（初回ログイン時にローカルの既読を Firestore へマージ）。

### 構成

- **Firebase Authentication (Google)**: 右上のログインアイコンからサインイン
- **Cloud Firestore**: `users/{uid}/reads/{postId}` に既読レコードを保存
- **Firebase プロジェクト**: `gcp-feed`（aws-feed / azure-feed とは別プロジェクト）

### Firebase 設定値

Web SDK の設定値はクライアントに配信される公開情報なので、`src/lib/firebase/config.ts` に
フォールバックとして直接埋め込んでいます（セキュリティは Firestore ルールと Firebase Auth の
認可ドメインで担保）。GitHub Actions 側で追加の Secrets を設定する必要はありません。

ローカルで別プロジェクトに向けたい場合のみ、`.env.local.example` を `.env.local`（git 管理外）に
コピーして `NEXT_PUBLIC_FIREBASE_*` を上書きします。

### Firestore セキュリティルール

`firestore.rules` で「認証済みユーザー本人のみ自分の既読データを読み書き可能」に制限しています。デプロイ:

```bash
firebase deploy --only firestore:rules --project gcp-feed
```

### Firebase の初期設定（完了済み）

aws-feed とは**別の Firebase プロジェクト**を使います。既読データのキー (`postId`) が
`YYYY/MM/DD/YYYY-MM-DD-news` 形式で各サイト共通のため、同じプロジェクトを共有すると
既読が混ざります。

- [x] Firebase プロジェクト `gcp-feed` の作成
- [x] Web アプリの登録と設定値の反映（`src/lib/firebase/config.ts`）
- [x] Cloud Firestore データベース（`(default)` / `asia-northeast1`）の作成
- [x] `firestore.rules` のデプロイ
- [x] Authentication で **Google** プロバイダを有効化
- [x] 承認済みドメインの設定

承認済みドメイン:

```
localhost
gcp-feed.firebaseapp.com
gcp-feed.web.app
gcp.news.gekal.cn
gekal-study-knowledge.github.io
```

公開先を増やす場合はここにドメインを追加します。構成ができていれば CLI から実行できます:

```bash
TOKEN=$(gcloud auth print-access-token)
curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"authorizedDomains":["localhost","gcp-feed.firebaseapp.com","gcp-feed.web.app","gcp.news.gekal.cn","gekal-study-knowledge.github.io"]}' \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/gcp-feed/config?updateMask=authorizedDomains"
```

現在の設定は以下で確認できます:

```bash
curl -s "https://identitytoolkit.googleapis.com/v1/projects?key=$NEXT_PUBLIC_FIREBASE_API_KEY"
```

### 注意: Authentication の初期化は API では行えない

新しいプロジェクトで Authentication をまだ一度も有効化していない状態では、サインイン時に
`CONFIGURATION_NOT_FOUND` が返ります。この初期化はコンソールで Google プロバイダを
有効化する操作でしか行えません。試した代替手段と結果:

| 方法                                          | 結果                                                      |
| :-------------------------------------------- | :-------------------------------------------------------- |
| `identityPlatform:initializeAuth`             | `BILLING_NOT_ENABLED`（Identity Platform 扱いで課金必須） |
| `defaultSupportedIdpConfigs` に POST          | `INVALID_CONFIG : client_id cannot be empty`              |
| `config` に PATCH                             | `CONFIGURATION_NOT_FOUND`（構成が無いので更新できない）   |
| IAP OAuth Admin API で OAuth クライアント作成 | 2026-03-19 に完全終了済みで利用不可                       |

Google プロバイダの登録には OAuth 2.0 クライアント ID が必要で、それを作成できるのが
コンソールの「Google を有効にする」操作だけ、というのが理由です。構成さえできれば
承認済みドメインの追加などは上記のとおり API から実行できます。

## 技術スタック

### バックエンド（フィード取得）

- **Python 3.x**
- **feedparser**: RSS フィード解析
- **PyYAML**: YAML 読み書き

### フロントエンド（Web UI）

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**
- **Material UI v9**
- **date-fns**: 日付処理
- **remark**: Markdown → HTML 変換
- **Firebase (Auth + Firestore)**: Google ログインと既読状態のクラウド同期

### インフラ

- **GitHub Actions**: 自動実行とデプロイ
- **GitHub Pages**: 静的ホスティング

## スクリプトコマンド

### Python（フィード取得）

```bash
# 新規フィードを取得
python3 .github/scripts/main.py

# 全レポートを再生成
python3 .github/scripts/main.py --rebuild
```

### Node.js（開発・ビルド）

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# 静的ファイルのプレビュー
npm run start

# リント
npm run lint

# フォーマット
npm run format
```

## トラブルシューティング

### GitHub Actions でコミットできない

リポジトリの Settings → Actions → General → Workflow permissions を「Read and write permissions」に変更してください。

### フィードが取得できない

- インターネット接続を確認
- フィード URL が正しいか確認
- フィード提供元のステータスを確認

### 重複したエントリーが生成される

エントリー ID は記事のリンクとタイトルから生成されます（MD5 ハッシュ）。フィード側で内容が変更された場合、新規エントリーとして扱われることがあります。

### ビルドエラー

```bash
# 依存パッケージを再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュをクリアしてビルド
rm -rf .next out
npm run build
```

## ライセンス

MIT License
