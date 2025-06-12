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
        .order('created_at', { ascending: false })
      
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
      const { error } = await supabase.from('tasks').insert([
        {
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.due_date || null,
          created_by: session.user.id,
          assigned_to: session.user.id,
          project_id: projectId
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