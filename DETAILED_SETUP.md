# 詳細セットアップガイド

## ステップ1: Supabaseの設定（約15分）

### 1-1. 既存プロジェクトにアクセス

1. **Supabase Dashboard**にログイン
   - https://supabase.com/dashboard にアクセス
   - 既存のプロジェクトをクリック

2. **プロジェクトURL・キーの確認**
   - 左サイドバーの「Settings」→「API」をクリック
   - 以下をメモ（後で使用）：
     - Project URL: `https://xxxxx.supabase.co`
     - anon public key: `eyJhb...`（長い文字列）
   
   ⚠️ **注意**: service_role keyは絶対にコピーしない！

### 1-2. SQL Editorでデータベース設定

1. **SQL Editorを開く**
   - 左サイドバーの「SQL Editor」をクリック
   - 「+ New query」ボタンをクリック

2. **個人データ保護用のスキーマ作成**
   - 以下のSQLをコピー&ペースト：
   ```sql
   -- 個人データ用スキーマの作成と保護
   CREATE SCHEMA IF NOT EXISTS private_p;
   
   -- 例：個人データ用テーブル（既存テーブルがある場合はこの部分をスキップ）
   CREATE TABLE IF NOT EXISTS private_p.personal_data (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       user_id UUID REFERENCES auth.users(id),
       data JSONB,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- RLSを有効化
   ALTER TABLE private_p.personal_data ENABLE ROW LEVEL SECURITY;
   ```

3. **自分のUUIDを取得**
   - 以下のクエリを実行して、`auth.users`テーブルから自分のユーザー情報を探します。
   ```sql
   SELECT id, email FROM auth.users;
   ```
   - 結果に表示される`id`があなたのUUIDです。それをコピーしてください。（例：`12345678-1234-1234-1234-123456789012`）
   - **もしユーザーが一人も表示されない場合:** 左サイドバーの「Authentication」→「Users」に移動し、「Add user」ボタンから自分用のユーザーを作成してください。作成後、再度上記のSQLを実行してください。
   - (補足: SQLエディタ上で`SELECT auth.uid()`を実行すると、特定のユーザーとしてログインしているわけではないため`NULL`が返されます。そのため、`auth.users`テーブルから直接UUIDを取得する必要があります。)

4. **個人データ保護ポリシーの作成**
   - UUIDを使って以下を実行（UUIDを実際の値に置き換え）：
   ```sql
   -- 自分だけアクセス可能なポリシー
   CREATE POLICY "Only owner can access" ON private_p.personal_data
       FOR ALL USING (auth.uid() = '12345678-1234-1234-1234-123456789012');
   
   -- anon/authenticatedロールから権限を剥奪
   REVOKE ALL ON SCHEMA private_p FROM anon, authenticated;
   REVOKE ALL ON ALL TABLES IN SCHEMA private_p FROM anon, authenticated;
   ```

5. **チーム用スキーマとテーブルの作成**
   ```sql
   -- チーム用スキーマの作成
   CREATE SCHEMA IF NOT EXISTS progress;
   
   -- 権限付与
   GRANT USAGE ON SCHEMA progress TO anon, authenticated;
   GRANT ALL ON ALL TABLES IN SCHEMA progress TO authenticated;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA progress TO authenticated;
   
   -- チェックリストテーブルの作成
   CREATE TABLE progress.tasks (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       title TEXT NOT NULL,
       description TEXT,
       status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
       assigned_to UUID REFERENCES auth.users(id),
       created_by UUID REFERENCES auth.users(id) NOT NULL,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW(),
       due_date DATE
   );
   
   CREATE TABLE progress.task_comments (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       task_id UUID REFERENCES progress.tasks(id) ON DELETE CASCADE,
       user_id UUID REFERENCES auth.users(id) NOT NULL,
       comment TEXT NOT NULL,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- RLSを有効化
   ALTER TABLE progress.tasks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE progress.task_comments ENABLE ROW LEVEL SECURITY;
   
   -- チームメンバーのアクセスポリシー
   CREATE POLICY "Team members can view tasks" ON progress.tasks
       FOR SELECT USING (auth.uid() IS NOT NULL);
   
   CREATE POLICY "Authenticated users can create tasks" ON progress.tasks
       FOR INSERT WITH CHECK (auth.uid() = created_by);
   
   CREATE POLICY "Task creator can update" ON progress.tasks
       FOR UPDATE USING (auth.uid() = created_by);
   
   CREATE POLICY "Team members can view comments" ON progress.task_comments
       FOR SELECT USING (auth.uid() IS NOT NULL);
   
   CREATE POLICY "Authenticated users can create comments" ON progress.task_comments
       FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

### 1-3. API設定

1. **Exposed Schemasの設定**
   - 左サイドバーの「Settings」→「API」をクリック
   - 下にスクロールして「Exposed schemas」セクションを見つける
   - テキストボックスに `progress` と入力
   - 「Save」ボタンをクリック
   
   ⚠️ **重要**: `private_p` は絶対に追加しない！

2. **設定確認**
   - Exposed schemasに「public, progress」と表示されることを確認
   - 「private_p」が含まれていないことを確認

---

## ステップ2: 認証とCORS設定（約10分）

### 2-1. Site URLの設定

1. **Authentication設定を開く**
   - 左サイドバーの「Authentication」をクリック
   - 「Settings」タブをクリック（デフォルトで開いている場合もあります）

2. **Site URLの追加**
   - 「Site URL」フィールドを見つける
   - 現在の値（例：`http://localhost:3000`）の後に、カンマで区切って追加：
   ```
   http://localhost:3000, https://yourdomain.com
   ```
   - 「Save」ボタンをクリック

### 2-2. Redirect URLsの設定

1. **同じAuthentication > Settingsページで**
   - 「Redirect URLs」セクションを見つける
   - 「Add URL」ボタンをクリック

2. **開発用URLを追加**
   - 入力欄に `http://localhost:3000/**` と入力
   - 「Add URL」をクリック

3. **本番用URLを追加**
   - 再度「Add URL」ボタンをクリック
   - 入力欄に `https://yourdomain.com/**` と入力（実際のドメインに置き換え）
   - 「Add URL」をクリック

4. **設定を保存**
   - ページ下部の「Save」ボタンをクリック

### 2-3. 設定確認

- Site URL: `http://localhost:3000, https://yourdomain.com`
- Redirect URLs: 
  - `http://localhost:3000/**`
  - `https://yourdomain.com/**`

---

## ステップ3: 環境設定とローカル実行（約10分）

### 3-1. 必要なソフトウェアの確認

以下がインストールされていることを確認：
- **Node.js** (v18以上推奨)
  - 確認方法: ターミナルで `node --version` を実行
  - インストール: https://nodejs.org/

### 3-2. プロジェクトのセットアップ

1. **プロジェクトフォルダに移動**
   ```bash
   cd /Users/setokeisuke/Documents/ClaudeCode/ゆいひな用チェックリスト
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```
   
   実行結果例：
   ```
   added 200 packages, and audited 201 packages in 30s
   ```

3. **環境変数ファイルの作成**
   ```bash
   cp .env.example .env
   ```

### 3-3. 環境変数の設定

1. **エディタで.envファイルを開く**
   ```bash
   # VS Codeの場合
   code .env
   
   # または任意のテキストエディタで開く
   ```

2. **Supabaseの情報を入力**
   - ステップ1-1でメモしたProject URLとanon keyを使用：
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **ファイルを保存**

### 3-4. 開発サーバーの起動

1. **サーバーを開始**
   ```bash
   npm run dev
   ```

2. **ブラウザで確認**
   - 自動でブラウザが開く（通常 http://localhost:3000）
   - 開かない場合は手動で http://localhost:3000 にアクセス

3. **正常動作の確認**
   - ✅ ログインページが表示される
   - ✅ 新規登録でアカウント作成可能
   - ✅ ログイン後にチェックリスト画面が表示される
   - ✅ タスクの追加・編集・削除が可能

### 3-5. トラブルシューティング

**よくあるエラーと解決方法：**

1. **「Module not found」エラー**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **「Invalid API key」エラー**
   - `.env`ファイルのanon keyを再確認
   - Supabase Dashboardで正しいキーをコピー

3. **認証エラー**
   - Supabase DashboardのRedirect URLsを再確認
   - `http://localhost:3000/**` が含まれているか確認

4. **データが表示されない**
   - Exposed schemasに`progress`が含まれているか確認
   - RLSポリシーが正しく設定されているか確認

### 3-6. 次のステップ

開発環境で正常動作を確認したら：
1. チームメンバーにアカウント作成を依頼
2. 本番環境へのデプロイ準備
3. カスタムドメインの設定

---

## 重要な注意事項

### セキュリティチェックリスト
- [ ] `private_p`がExposed schemasに含まれていない
- [ ] service_roleキーがコードに含まれていない
- [ ] `.env`ファイルが`.gitignore`に含まれている
- [ ] 個人用テーブルにRLSが設定されている

### 緊急時の対処
問題が発生した場合：
1. ブラウザの開発者ツールでエラーを確認
2. ターミナルのエラーメッセージを確認
3. Supabase Dashboardのログを確認

これで基本的なセットアップは完了です！