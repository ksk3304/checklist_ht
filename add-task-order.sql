-- タスクテーブルに並び順用のカラムを追加
ALTER TABLE progress.tasks 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- 既存のタスクに初期値を設定（作成日時順）
WITH ordered_tasks AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) * 10 as new_order
  FROM progress.tasks
)
UPDATE progress.tasks t
SET display_order = ot.new_order
FROM ordered_tasks ot
WHERE t.id = ot.id;