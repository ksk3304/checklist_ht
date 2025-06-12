import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function TaskList({ session }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' })
  const [editingTask, setEditingTask] = useState(null)
  const [project, setProject] = useState(null)
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoForm, setMemoForm] = useState({ title: '', content: '' })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, in_progress, completed

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchTasks()
    }
  }, [projectId, filter])

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      if (error) throw error
      setProject(data)
      setMemoForm({ title: data.memo_title || '', content: data.memo_content || '' })
    } catch (error) {
      console.error('Error fetching project:', error)
      navigate('/')
    }
  }

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true })
        .order('display_order', { ascending: true })
      
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (e) => {
    e.preventDefault()
    try {
      // 最大のdisplay_orderを取得
      const { data: maxOrderData } = await supabase
        .from('tasks')
        .select('display_order')
        .eq('project_id', projectId)
        .order('display_order', { ascending: false })
        .limit(1)
      
      const maxOrder = maxOrderData?.[0]?.display_order || 0
      
      const { error } = await supabase.from('tasks').insert([
        {
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.due_date || null,
          created_by: session.user.id,
          assigned_to: session.user.id,
          project_id: projectId,
          display_order: maxOrder + 10
        }
      ])
      if (error) throw error
      
      setNewTask({ title: '', description: '', due_date: '' })
      fetchTasks()
    } catch (error) {
      console.error('Error creating task:', error)
      alert('タスクの作成に失敗しました')
    }
  }

  const updateTask = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editingTask.title,
          description: editingTask.description,
          due_date: editingTask.due_date || null
        })
        .eq('id', editingTask.id)
      
      if (error) throw error
      setEditingTask(null)
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
      alert('タスクの更新に失敗しました')
    }
  }

  const startEditing = (task) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || ''
    })
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
      
      if (error) throw error
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    if (!confirm('このタスクを削除しますか？')) return
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      
      if (error) throw error
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const startEditingMemo = () => {
    setEditingMemo(true)
    setMemoForm({ 
      title: project.memo_title || '', 
      content: project.memo_content || '' 
    })
  }

  const saveMemo = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          memo_title: memoForm.title,
          memo_content: memoForm.content
        })
        .eq('id', projectId)
      
      if (error) throw error
      
      setEditingMemo(false)
      fetchProject()
    } catch (error) {
      console.error('Error saving memo:', error)
      alert('メモの保存に失敗しました')
    }
  }

  const cancelEditingMemo = () => {
    setEditingMemo(false)
    setMemoForm({ 
      title: project.memo_title || '', 
      content: project.memo_content || '' 
    })
  }

  const moveTask = async (taskId, direction) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) return
    
    const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1
    if (targetIndex < 0 || targetIndex >= tasks.length) return
    
    const currentTask = tasks[taskIndex]
    const targetTask = tasks[targetIndex]
    
    // 同じ日付の場合のみ入れ替え可能
    if (currentTask.due_date !== targetTask.due_date) {
      alert('異なる期限のタスクは入れ替えできません')
      return
    }
    
    try {
      // display_orderを入れ替え
      const tempOrder = currentTask.display_order
      
      await supabase
        .from('tasks')
        .update({ display_order: targetTask.display_order })
        .eq('id', currentTask.id)
      
      await supabase
        .from('tasks')
        .update({ display_order: tempOrder })
        .eq('id', targetTask.id)
      
      fetchTasks()
    } catch (error) {
      console.error('Error moving task:', error)
      alert('タスクの移動に失敗しました')
    }
  }

  if (loading) return <div>タスクを読み込み中...</div>
  if (!project) return <div>プロジェクトが見つかりません</div>

  return (
    <div className="task-list-container">
      <div className="project-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← プロジェクト一覧に戻る
        </button>
        <h2>{project.name}</h2>
        {project.description && (
          <p className="project-description" style={{ whiteSpace: 'pre-wrap' }}>
            {project.description}
          </p>
        )}
      </div>

      <div className="memo-section">
        {editingMemo ? (
          <div className="memo-edit-form">
            <h3>メモを編集</h3>
            <input
              type="text"
              placeholder="メモのタイトル"
              value={memoForm.title}
              onChange={(e) => setMemoForm({ ...memoForm, title: e.target.value })}
              className="memo-title-input"
            />
            <textarea
              placeholder="メモの内容"
              value={memoForm.content}
              onChange={(e) => setMemoForm({ ...memoForm, content: e.target.value })}
              className="memo-content-textarea"
              rows={5}
            />
            <div className="memo-actions">
              <button onClick={(e) => saveMemo(e)} className="save-btn">保存</button>
              <button onClick={cancelEditingMemo} className="cancel-btn">キャンセル</button>
            </div>
          </div>
        ) : (
          <div className="memo-view">
            {(project.memo_title || project.memo_content) ? (
              <>
                {project.memo_title && <h3 className="memo-title">{project.memo_title}</h3>}
                {project.memo_content && (
                  <p className="memo-content" style={{ whiteSpace: 'pre-wrap' }}>
                    {project.memo_content}
                  </p>
                )}
              </>
            ) : (
              <p className="no-memo">メモはまだありません</p>
            )}
            <button onClick={startEditingMemo} className="edit-memo-btn">
              メモを編集
            </button>
          </div>
        )}
      </div>
      {editingTask ? (
        <div className="task-form edit-form">
          <h3>タスクを編集</h3>
          <form onSubmit={updateTask}>
            <input
              type="text"
              placeholder="タスク名"
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              required
            />
            <textarea
              placeholder="説明（任意）"
              value={editingTask.description}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
            />
            <input
              type="date"
              value={editingTask.due_date}
              onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
            />
            <div className="form-actions">
              <button type="submit">更新</button>
              <button type="button" onClick={() => setEditingTask(null)}>キャンセル</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="task-form">
          <h3>新しいタスクを追加</h3>
          <form onSubmit={createTask}>
          <input
            type="text"
            placeholder="タスク名"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <textarea
            placeholder="説明（任意）"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <input
            type="date"
            value={newTask.due_date}
            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
          />
            <button type="submit">追加</button>
          </form>
        </div>
      )}

      <div className="task-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          すべて
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          未完了
        </button>
        <button 
          className={filter === 'in_progress' ? 'active' : ''}
          onClick={() => setFilter('in_progress')}
        >
          進行中
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          完了
        </button>
      </div>

      <div className="tasks">
        {tasks.length === 0 ? (
          <p className="no-tasks">タスクがありません</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`task-item status-${task.status}`}>
              <div className="task-header">
                <h4>{task.title}</h4>
                <div className="task-controls">
                  <select 
                    value={task.status} 
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  >
                    <option value="pending">未完了</option>
                    <option value="in_progress">進行中</option>
                    <option value="completed">完了</option>
                  </select>
                </div>
              </div>
              {task.description && (
                <p className="task-description" style={{ whiteSpace: 'pre-wrap' }}>
                  {task.description}
                </p>
              )}
              {task.due_date && (
                <p className="task-due">期限: {new Date(task.due_date).toLocaleDateString('ja-JP')}</p>
              )}
              <div className="task-actions">
                <button 
                  className="move-btn"
                  onClick={() => moveTask(task.id, 'up')}
                  disabled={tasks.findIndex(t => t.id === task.id) === 0}
                  title="上に移動"
                >
                  ↑
                </button>
                <button 
                  className="move-btn"
                  onClick={() => moveTask(task.id, 'down')}
                  disabled={tasks.findIndex(t => t.id === task.id) === tasks.length - 1}
                  title="下に移動"
                >
                  ↓
                </button>
                <button 
                  className="edit-btn"
                  onClick={() => startEditing(task)}
                >
                  編集
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteTask(task.id)}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TaskList