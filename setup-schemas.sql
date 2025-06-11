-- 1. 個人データ用スキーマの作成と保護
CREATE SCHEMA IF NOT EXISTS private_p;

-- 個人データ用テーブル例（既存の場合はスキップ）
CREATE TABLE IF NOT EXISTS private_p.personal_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE private_p.personal_data ENABLE ROW LEVEL SECURITY;

-- 自分だけアクセス可能なポリシー（YOURUIDを実際のUUIDに置き換えてください）
CREATE POLICY "Only owner can access" ON private_p.personal_data
    FOR ALL USING (auth.uid() = 'YOUR_USER_UUID_HERE');

-- anon/authenticatedロールから権限を剥奪
REVOKE ALL ON SCHEMA private_p FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA private_p FROM anon, authenticated;

-- 2. チーム用スキーマの作成
CREATE SCHEMA IF NOT EXISTS progress;

-- 権限付与
GRANT USAGE ON SCHEMA progress TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA progress TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA progress TO authenticated;

-- 3. チェックリストテーブルの作成
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

-- チームメンバーのみアクセス可能（後でメンバー管理テーブルと連携）
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

-- 更新日時の自動更新
CREATE OR REPLACE FUNCTION progress.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON progress.tasks
    FOR EACH ROW
    EXECUTE FUNCTION progress.update_updated_at();

-- 重要: Supabase Dashboardで以下を実行
-- 1. Settings > API > Exposed schemas に 'progress' を追加
-- 2. private_p は絶対に追加しない