-- プロジェクトテーブルにメモ用のカラムを追加
ALTER TABLE progress.projects 
ADD COLUMN memo_title TEXT DEFAULT '',
ADD COLUMN memo_content TEXT DEFAULT '';

-- 既存のレコードに対してデフォルト値を設定（既にNULLの場合）
UPDATE progress.projects 
SET memo_title = COALESCE(memo_title, ''),
    memo_content = COALESCE(memo_content, '');