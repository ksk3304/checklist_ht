# チームチェックリスト

Supabaseの既存プロジェクトを使用した、チーム内限定のタスク管理アプリです。

## 特徴

- 個人データとチームデータの完全分離
- 追加課金なし（既存Supabaseプロジェクトを使用）
- 別ドメインでのホスティング対応
- リアルタイムタスク管理

## セットアップ手順

### 1. Supabaseの設定

1. Supabase Dashboardで既存プロジェクトを開く
2. SQL Editorで `setup-schemas.sql` を実行：
   ```sql
   -- setup-schemas.sqlの内容をコピー&ペースト
   ```
3. **重要**: `YOUR_USER_UUID_HERE` を自分のUUIDに置き換え
4. Settings > API > Exposed schemas に `progress` を追加
5. `private_p` は絶対に追加しない

### 2. CORS設定

1. Authentication > Settings > Site URL に本番ドメインを追加
2. Redirect URLs に以下を追加：
   - `http://localhost:3000/**`（開発用）
   - `https://yourdomain.com/**`（本番用）

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集：
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 依存関係のインストール

```bash
npm install
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

### 6. デプロイ（Vercel例）

1. プロジェクトをGitHubにプッシュ
2. [Vercel](https://vercel.com)でプロジェクトをインポート
3. 環境変数を設定（VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY）
4. カスタムドメインを設定
5. Supabaseの認証設定にドメインを追加

## セキュリティチェックリスト

- [ ] `private_p` スキーマがExposed schemasに含まれていない
- [ ] RLSがすべてのテーブルで有効
- [ ] service_roleキーがフロントエンドに含まれていない
- [ ] 個人用バケットがPrivateのまま
- [ ] 認証Redirect URLが正しく設定されている

## トラブルシューティング

### 認証エラー
- Redirect URLの設定を確認
- CORS設定を確認

### データが表示されない
- RLSポリシーの設定を確認
- Exposed schemasの設定を確認

### 個人データが見える
- `private_p` をExposed schemasから削除
- RLSポリシーを再確認

## 使用技術

- React + Vite
- Supabase (PostgreSQL + Auth)
- CSS（フレームワークなし）

## ライセンス

MIT