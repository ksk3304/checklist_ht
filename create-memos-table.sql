-- プロジェクトごとのメモを管理するテーブルを作成
CREATE TABLE progress.project_memos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES progress.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    display_order INTEGER DEFAULT 0
);

-- RLSを有効化
ALTER TABLE progress.project_memos ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Anyone authenticated can view memos" ON progress.project_memos
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can create memos" ON progress.project_memos
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can update memos" ON progress.project_memos
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can delete memos" ON progress.project_memos
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 権限付与
GRANT ALL ON progress.project_memos TO authenticated;

-- 更新日時のトリガー
CREATE TRIGGER update_project_memos_updated_at
    BEFORE UPDATE ON progress.project_memos
    FOR EACH ROW
    EXECUTE FUNCTION progress.update_updated_at();