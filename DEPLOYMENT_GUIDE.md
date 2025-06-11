# Vercelデプロイガイド

## 前提条件
- GitHubアカウント
- Vercelアカウント（GitHubでサインイン可能）
- プロジェクトのGitHubリポジトリ

## ステップ1: GitHubリポジトリの準備

### 1-1. Gitの初期化（まだの場合）
```bash
cd /Users/setokeisuke/Documents/ClaudeCode/ゆいひな用チェックリスト
git init
```

### 1-2. GitHubでリポジトリ作成
1. GitHub.comにログイン
2. 右上の「+」→「New repository」
3. Repository name: `team-checklist`（任意）
4. Private repository（推奨）
5. 「Create repository」をクリック

### 1-3. コードをプッシュ
```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/team-checklist.git
git push -u origin main
```

## ステップ2: Vercelでデプロイ

### 2-1. Vercelにアクセス
1. https://vercel.com にアクセス
2. 「Login」→「Continue with GitHub」

### 2-2. プロジェクトをインポート
1. 「New Project」をクリック
2. GitHubリポジトリから`team-checklist`を選択
3. 「Import」をクリック

### 2-3. 環境変数の設定
⚠️ **重要: これが最も重要なステップです**

1. 「Environment Variables」セクションで以下を追加：
   ```
   Name: VITE_SUPABASE_URL
   Value: https://xznyjfxscqshjckdyefc.supabase.co
   
   Name: VITE_SUPABASE_ANON_KEY
   Value: [あなたのanon key]
   ```

2. **絶対にservice_role keyは追加しない**

### 2-4. ビルド設定
- Framework Preset: `Vite`（自動検出される）
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 2-5. デプロイ
1. 「Deploy」ボタンをクリック
2. 2-3分待つ
3. 完了すると`https://team-checklist-xxxxx.vercel.app`のようなURLが発行される

## ステップ3: Supabaseの設定更新

### 3-1. Redirect URLsに本番URLを追加
1. Supabase Dashboardを開く
2. Authentication > Settings
3. Redirect URLsに追加：
   ```
   https://team-checklist-xxxxx.vercel.app/**
   ```
4. 「Save」をクリック

## ステップ4: カスタムドメインの設定（オプション）

### 4-1. Vercelでドメイン追加
1. Vercelのプロジェクトページ
2. 「Settings」→「Domains」
3. 「Add」をクリック
4. ドメインを入力（例：`checklist.yourdomain.com`）

### 4-2. DNSレコードの設定
表示される指示に従ってDNSレコードを設定

### 4-3. Supabaseに新ドメインを追加
Redirect URLsに新しいドメインも追加：
```
https://checklist.yourdomain.com/**
```

## トラブルシューティング

### 「Invalid API key」エラー
- 環境変数が正しく設定されているか確認
- Vercel > Settings > Environment Variables

### 認証エラー
- Supabase DashboardでRedirect URLsを確認
- HTTPSで始まっていることを確認

### ビルドエラー
- ローカルで`npm run build`が成功するか確認
- package.jsonの依存関係を確認

## 更新方法

コードを更新したら：
```bash
git add .
git commit -m "Update: 機能の説明"
git push
```

Vercelが自動的に再デプロイします。

## セキュリティの最終確認

デプロイ後：
1. 本番環境で新規ユーザー登録をテスト
2. プロジェクト・タスクの作成をテスト
3. ブラウザの開発者ツールでservice_role keyが露出していないことを確認
4. 個人データへのアクセスができないことを確認

以上で安全にデプロイ完了です！