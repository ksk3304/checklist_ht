# セキュリティチェックリスト

## ✅ Supabase設定

### スキーマ設定
- [x] `private_p`スキーマが作成されている
- [x] `private_p`がExposed schemasに含まれていない ⚠️ **重要**
- [x] `progress`スキーマのみがExposed schemasに追加されている

### RLS（Row Level Security）
- [x] すべてのテーブルでRLSが有効化されている
  - `private_p.personal_data` - 有効
  - `progress.projects` - 有効
  - `progress.tasks` - 有効
  - `progress.task_comments` - 有効
- [x] 認証されたユーザーのみアクセス可能
- [x] 個人データは自分のUIDのみアクセス可能

### 認証設定
- [x] Site URLは既存のまま変更していない
- [x] Redirect URLsに開発環境のURLが追加されている

## ✅ フロントエンド設定

### 環境変数
- [x] `.env`ファイルにanon keyのみ設定
- [x] service_role keyは一切使用していない ⚠️ **重要**
- [x] `.env`ファイルが`.gitignore`に含まれている

### APIアクセス
- [x] Supabaseクライアントがprogressスキーマをデフォルトに設定
- [x] 個人データスキーマへのアクセスコードが存在しない

## ✅ コードセキュリティ

### 認証チェック
- [x] すべての操作で`auth.uid() IS NOT NULL`を確認
- [x] ログインしていない場合は認証画面を表示

### データ検証
- [x] 必須フィールドのバリデーション
- [x] SQLインジェクション対策（Supabase clientが自動処理）

## ✅ デプロイ前の最終確認

### Supabase Dashboard確認
1. **Settings > API > Exposed schemas**
   - `public, graphql_public, progress`のみ
   - `private_p`が含まれていないことを確認

2. **Authentication > Settings > Redirect URLs**
   - 本番URLを追加（デプロイ後）

### ローカルテスト
- [x] 新規ユーザー登録が可能
- [x] プロジェクト作成・編集・削除が動作
- [x] タスク作成・編集・削除が動作
- [x] 他ユーザーのデータにアクセスできないことを確認

## 📝 デプロイ時の注意事項

1. **環境変数の設定**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - service_role keyは絶対に設定しない

2. **本番URLの追加**
   - デプロイ完了後、Supabase DashboardのRedirect URLsに追加

3. **ビルドコマンド**
   ```bash
   npm run build
   ```

4. **ディストリビューションフォルダ**
   ```
   dist
   ```

## 🚨 個人データ保護の確認

- [x] 個人用スキーマ`private_p`は完全に隔離されている
- [x] チーム用データのみがAPIで公開されている
- [x] 同じSupabaseプロジェクトでも個人データは保護される

すべてのチェックが完了したら、安全にデプロイできます！