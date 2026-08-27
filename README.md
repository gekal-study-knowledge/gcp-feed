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
python .github/scripts/main.py
```

初回実行時は全エントリーが新規として扱われ、日単位の Markdown が生成されます。

#### 全レポートの再生成

```bash
python .github/scripts/main.py --rebuild
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

data_dir: 'data'
output_dir: '_posts'
```

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

## 既読管理 (Firebase)

日別ページの既読/更新状態を管理します。Google アカウントでログインすると Cloud Firestore に保存され、複数のデバイス・ブラウザ間で既読状態が同期されます。未ログイン時は従来どおりブラウザの localStorage に保存されます（初回ログイン時にローカルの既読を Firestore へマージ）。

### 構成

- **Firebase Authentication (Google)**: 右上のログインアイコンからサインイン
- **Cloud Firestore**: `users/{uid}/reads/{postId}` に既読レコードを保存
- **Firebase プロジェクト**: `gcp-feed`（aws-feed / azure-feed とは別プロジェクト）

### Firebase 設定値

Web SDK の設定値はクライアントに配信される公開情報であり秘匿は不要ですが、このリポジトリには
値を埋め込んでいません。`.env.local.example` を `.env.local` にコピーし、Firebase コンソールで
発行された `NEXT_PUBLIC_FIREBASE_*` を設定してください。GitHub Actions では同名の Secrets を
ビルドジョブの `env` に渡します。

未設定のままでもサイトは動作します（既読は localStorage に保存され、ログインアイコンは非表示）。

### Firestore セキュリティルール

`firestore.rules` で「認証済みユーザー本人のみ自分の既読データを読み書き可能」に制限しています。デプロイ:

```bash
firebase deploy --only firestore:rules --project gcp-feed
```

### Firebase コンソール側の初期設定（未実施 / 要対応）

aws-feed / azure-feed とは**別の Firebase プロジェクト**が必要です。既読データのキー (`postId`) が
`YYYY/MM/DD/YYYY-MM-DD-news` 形式で両サイト共通のため、同じプロジェクトを共有すると
各サイトの既読が混ざります。

1. Firebase コンソールで `gcp-feed` プロジェクトを作成
2. Web アプリを追加し、表示された設定値を `.env.local` に転記
3. Authentication で **Google** ログインプロバイダを有効化
4. 認可ドメインに公開先（独自ドメインを使う場合はそのホスト名）と
   `gekal-study-knowledge.github.io` を追加（`localhost` は既定で許可）
5. Cloud Firestore データベース（`asia-northeast1`）を作成
6. `firebase deploy --only firestore:rules --project gcp-feed` でルールを反映

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
python .github/scripts/main.py

# 全レポートを再生成
python .github/scripts/main.py --rebuild
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
