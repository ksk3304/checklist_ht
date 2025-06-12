import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCalendar from './TaskCalendar'

function TaskList({ session }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' })
  const [editingTask, setEditingTask] = useState(null)
  const [project, setProject] = useState(null)
  const [memos, setMemos] = useState([])
  const [newMemo, setNewMemo] = useState({ title: '', content: '' })
  const [editingMemo, setEditingMemo] = useState(null)
  const [editingMemoData, setEditingMemoData] = useState({ title: '', content: '' })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, in_progress, completed

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchTasks()
      fetchMemos()
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

  const fetchMemos = async () => {
    try {
      const { data, error } = await supabase
        .from('project_memos')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true })
      
      if (error) throw error
      setMemos(data || [])
    } catch (error) {
      console.error('Error fetching memos:', error)
    }
  }

  const createMemo = async (e) => {
    e.preventDefault()
    if (!newMemo.title.trim() || !newMemo.content.trim()) {
      alert('タイトルと内容を入力してください')
      return
    }
    
    try {
      const maxOrderData = await supabase
        .from('project_memos')
        .select('display_order')
        .eq('project_id', projectId)
        .order('display_order', { ascending: false })
        .limit(1)
      
      const maxOrder = maxOrderData.data?.[0]?.display_order || 0
      
      const { error } = await supabase
        .from('project_memos')
        .insert([{
          project_id: projectId,
          title: newMemo.title,
          content: newMemo.content,
          created_by: session.user.id,
          display_order: maxOrder + 10
        }])
      
      if (error) throw error
      
      setNewMemo({ title: '', content: '' })
      fetchMemos()
    } catch (error) {
      console.error('Error creating memo:', error)
      alert('メモの作成に失敗しました')
    }
  }

  const updateMemo = async (memoId, updates) => {
    try {
      const { error } = await supabase
        .from('project_memos')
        .update(updates)
        .eq('id', memoId)
      
      if (error) throw error
      fetchMemos()
    } catch (error) {
      console.error('Error updating memo:', error)
      alert('メモの更新に失敗しました')
    }
  }

  const deleteMemo = async (memoId) => {
    if (!confirm('このメモを削除しますか？')) return
    
    try {
      const { error } = await supabase
        .from('project_memos')
        .delete()
        .eq('id', memoId)
      
      if (error) throw error
      fetchMemos()
    } catch (error) {
      console.error('Error deleting memo:', error)
      alert('メモの削除に失敗しました')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id)
      const newIndex = tasks.findIndex((task) => task.id === over.id)
      
      const movedTask = tasks[oldIndex]
      const targetTask = tasks[newIndex]
      
      // 同じ日付の場合のみ入れ替え可能
      if (movedTask.due_date !== targetTask.due_date) {
        alert('異なる期限のタスクは入れ替えできません')
        return
      }
      
      const newTasks = arrayMove(tasks, oldIndex, newIndex)
      setTasks(newTasks) // 即座にUIを更新
      
      // データベースを更新
      try {
        // 影響を受けるタスクのdisplay_orderを更新
        const updatePromises = newTasks.map((task, index) => {
          if (task.display_order !== index * 10) {
            return supabase
              .from('tasks')
              .update({ display_order: index * 10 })
              .eq('id', task.id)
          }
          return null
        }).filter(Boolean)
        
        await Promise.all(updatePromises)
      } catch (error) {
        console.error('Error updating task order:', error)
        fetchTasks() // エラー時は再取得
      }
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
        <h3 className="memo-section-title">備忘録</h3>
        
        <div className="add-memo-form">
          <form onSubmit={createMemo}>
            <input
              type="text"
              placeholder="タイトル"
              value={newMemo.title}
              onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
              className="memo-input"
            />
            <textarea
              placeholder="内容"
              value={newMemo.content}
              onChange={(e) => setNewMemo({ ...newMemo, content: e.target.value })}
              className="memo-textarea"
              rows={3}
            />
            <button type="submit" className="add-memo-btn">追加</button>
          </form>
        </div>

        <div className="memos-list">
          {memos.map((memo) => (
            <div key={memo.id} className="memo-item">
              <div className="memo-header">
                <h4 className="memo-title">{memo.title}</h4>
                <div className="memo-buttons">
                  <button
                    className="memo-edit-btn"
                    onClick={() => {
                      setEditingMemo(memo.id)
                      setEditingMemoData({ title: memo.title, content: memo.content })
                    }}
                  >
                    編集
                  </button>
                  <button
                    className="memo-delete-btn"
                    onClick={() => deleteMemo(memo.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
              {editingMemo === memo.id ? (
                <div className="memo-edit-content">
                  <input
                    type="text"
                    value={editingMemoData.title}
                    onChange={(e) => setEditingMemoData({ ...editingMemoData, title: e.target.value })}
                    className="memo-input"
                  />
                  <textarea
                    value={editingMemoData.content}
                    onChange={(e) => setEditingMemoData({ ...editingMemoData, content: e.target.value })}
                    className="memo-textarea"
                    rows={3}
                  />
                  <div className="memo-edit-actions">
                    <button
                      onClick={() => {
                        updateMemo(memo.id, editingMemoData)
                        setEditingMemo(null)
                      }}
                      className="save-btn"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingMemo(null)}
                      className="cancel-btn"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <p className="memo-content" style={{ whiteSpace: 'pre-wrap' }}>
                  {memo.content}
                </p>
              )}
              <span className="memo-date">
                {new Date(memo.created_at).toLocaleDateString('ja-JP')} {new Date(memo.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <SortableTask key={task.id} task={task} startEditing={startEditing} updateTaskStatus={updateTaskStatus} deleteTask={deleteTask} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <TaskCalendar tasks={tasks} />
    </div>
  )
}

function SortableTask({ task, startEditing, updateTaskStatus, deleteTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-item status-${task.status} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        ☰
      </div>
      <div className="task-content">
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
    </div>
  )
}

export default TaskList