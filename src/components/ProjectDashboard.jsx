import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ProjectDashboard({ session }) {
  const [projects, setProjects] = useState([])
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  // ガントチャート用のstate
  const [ganttTasks, setGanttTasks] = useState([
    { id: 1, name: 'エヌシーイー新潟国道', assignee: 'AS,sg,os,kg,ma,tg', startDate: '2025-06-09', endDate: '2025-06-18' },
    { id: 2, name: 'キタック', assignee: 'KG,os,ma,tg,ks', startDate: '2025-06-14', endDate: '2025-06-18' },
    { id: 3, name: '国際航業', assignee: 'AS,sg,os,tg,ks(kg', startDate: '2025-05-28', endDate: '2025-06-18' },
    { id: 4, name: 'エヌシーイー佐渡', assignee: 'KS,as,ma,os', startDate: '2025-05-28', endDate: '2025-06-18' }
  ])
  const [newGanttTask, setNewGanttTask] = useState({ name: '', assignee: '', startDate: '', endDate: '' })
  const [displayStartDate, setDisplayStartDate] = useState('2025-05-28')
  const [displayEndDate, setDisplayEndDate] = useState('2025-06-18')
  const [scale, setScale] = useState('medium')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('projects').insert([
        {
          name: newProject.name,
          description: newProject.description,
          created_by: session.user.id
        }
      ])
      if (error) throw error
      
      setNewProject({ name: '', description: '' })
      setShowForm(false)
      fetchProjects()
    } catch (error) {
      console.error('Error creating project:', error)
      alert('プロジェクトの作成に失敗しました')
    }
  }

  const deleteProject = async (projectId) => {
    if (!confirm('このプロジェクトとすべてのタスクを削除しますか？')) return
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
      
      if (error) throw error
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  // ガントチャート機能
  const addGanttTask = () => {
    if (!newGanttTask.name || !newGanttTask.assignee || !newGanttTask.startDate || !newGanttTask.endDate) {
      alert('すべての項目を入力してください')
      return
    }
    const newTask = {
      id: Date.now(),
      ...newGanttTask
    }
    setGanttTasks([...ganttTasks, newTask])
    setNewGanttTask({ name: '', assignee: '', startDate: '', endDate: '' })
  }

  const deleteGanttTask = (id) => {
    setGanttTasks(ganttTasks.filter(task => task.id !== id))
  }

  const applyPeriod = () => {
    // 表示期間を適用（再レンダリングのトリガー）
    setGanttTasks([...ganttTasks])
  }

  const autoSetPeriod = () => {
    if (ganttTasks.length === 0) return
    
    const startDates = ganttTasks.map(task => new Date(task.startDate))
    const endDates = ganttTasks.map(task => new Date(task.endDate))
    
    const minDate = new Date(Math.min(...startDates))
    const maxDate = new Date(Math.max(...endDates))
    
    setDisplayStartDate(minDate.toISOString().split('T')[0])
    setDisplayEndDate(maxDate.toISOString().split('T')[0])
  }

  // 日付範囲を生成
  const generateDateRange = () => {
    const start = new Date(displayStartDate)
    const end = new Date(displayEndDate)
    const dates = []
    
    let current = new Date(start)
    while (current <= end) {
      dates.push(new Date(current))
      if (scale === 'small') {
        current.setDate(current.getDate() + 7) // 週単位
      } else if (scale === 'large') {
        current.setDate(current.getDate() + 1) // 日単位
      } else {
        current.setDate(current.getDate() + 3) // 3日単位
      }
    }
    return dates
  }

  // タスクバーの位置とサイズを計算
  const calculateTaskBarStyle = (task) => {
    const start = new Date(displayStartDate)
    const end = new Date(displayEndDate)
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)
    
    const totalDays = (end - start) / (1000 * 60 * 60 * 24)
    const startOffset = Math.max(0, (taskStart - start) / (1000 * 60 * 60 * 24))
    const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24)
    
    const left = (startOffset / totalDays) * 100
    const width = (duration / totalDays) * 100
    
    return {
      left: `${left}%`,
      width: `${Math.max(width, 2)}%`,
      backgroundColor: '#4285f4'
    }
  }

  if (loading) return <div className="loading">プロジェクトを読み込み中...</div>

  return (
    <div className="project-dashboard">
      <div className="dashboard-header">
        <h2>プロジェクト一覧</h2>
        <button 
          className="add-project-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'キャンセル' : '新規プロジェクト'}
        </button>
      </div>

      {showForm && (
        <div className="project-form">
          <h3>新しいプロジェクトを作成</h3>
          <form onSubmit={createProject}>
            <input
              type="text"
              placeholder="プロジェクト名"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              required
            />
            <textarea
              placeholder="プロジェクト説明（任意）"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <div className="form-actions">
              <button type="submit">作成</button>
              <button type="button" onClick={() => setShowForm(false)}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="no-projects">
            <p>プロジェクトがありません</p>
            <p>新規プロジェクトボタンから最初のプロジェクトを作成してください</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div 
                className="project-content"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <h3>{project.name}</h3>
                {project.description && (
                  <p className="project-description" style={{ whiteSpace: 'pre-wrap' }}>
                    {project.description}
                  </p>
                )}
                <div className="project-meta">
                  <span className="created-date">
                    作成日: {new Date(project.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
              <div className="project-actions">
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteProject(project.id)
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ガントチャート */}
      <div className="gantt-section">
        <h2 className="gantt-title">ガントチャート（業務横断）</h2>
        <div className="gantt-container">
          <div className="gantt-form">
            <div className="gantt-inputs">
              <input 
                type="text" 
                placeholder="タスク名" 
                className="gantt-input"
                value={newGanttTask.name}
                onChange={(e) => setNewGanttTask({...newGanttTask, name: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="担当者" 
                className="gantt-input"
                value={newGanttTask.assignee}
                onChange={(e) => setNewGanttTask({...newGanttTask, assignee: e.target.value})}
              />
              <input 
                type="date" 
                className="gantt-input"
                value={newGanttTask.startDate}
                onChange={(e) => setNewGanttTask({...newGanttTask, startDate: e.target.value})}
              />
              <input 
                type="date" 
                className="gantt-input"
                value={newGanttTask.endDate}
                onChange={(e) => setNewGanttTask({...newGanttTask, endDate: e.target.value})}
              />
              <button className="gantt-add-btn" onClick={addGanttTask}>追加</button>
            </div>
            <div className="gantt-controls">
              <div className="date-controls">
                <label>表示開始日: 
                  <input 
                    type="date" 
                    className="gantt-date-input"
                    value={displayStartDate}
                    onChange={(e) => setDisplayStartDate(e.target.value)}
                  />
                </label>
                <label>表示終了日: 
                  <input 
                    type="date" 
                    className="gantt-date-input"
                    value={displayEndDate}
                    onChange={(e) => setDisplayEndDate(e.target.value)}
                  />
                </label>
              </div>
              <div className="gantt-buttons">
                <button className="gantt-period-btn" onClick={applyPeriod}>期間適用</button>
                <button className="gantt-auto-btn" onClick={autoSetPeriod}>自動設定</button>
              </div>
              <div className="scale-controls">
                <label>表示スケール:</label>
                <label>
                  <input 
                    type="radio" 
                    name="scale" 
                    value="small" 
                    checked={scale === 'small'}
                    onChange={(e) => setScale(e.target.value)}
                  /> 小（週単位）
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="scale" 
                    value="medium" 
                    checked={scale === 'medium'}
                    onChange={(e) => setScale(e.target.value)}
                  /> 中（3日単位）
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="scale" 
                    value="large" 
                    checked={scale === 'large'}
                    onChange={(e) => setScale(e.target.value)}
                  /> 大（日単位）
                </label>
              </div>
            </div>
          </div>
          
          <div className="gantt-chart">
            <div className="gantt-notice">
              <p>左右にスクロールできます</p>
            </div>
            <div className="gantt-table">
              <div className="gantt-header">
                <div className="gantt-col task-col">タスク</div>
                <div className="gantt-col assignee-col">担当者</div>
                <div className="gantt-col operation-col">操作</div>
                <div className="gantt-timeline">
                  <div className="timeline-dates">
                    {generateDateRange().map((date, index) => (
                      <div key={index} className="date-cell">
                        {date.getMonth() + 1}/{date.getDate()}<br />
                        {['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="gantt-rows">
                {ganttTasks.map((task) => (
                  <div key={task.id} className="gantt-row">
                    <div className="gantt-col task-col">{task.name}</div>
                    <div className="gantt-col assignee-col">{task.assignee}</div>
                    <div className="gantt-col operation-col">
                      <button className="delete-task-btn" onClick={() => deleteGanttTask(task.id)}>×</button>
                      <button className="move-task-btn">::</button>
                    </div>
                    <div className="gantt-timeline">
                      <div className="task-bar" style={calculateTaskBarStyle(task)}>
                        {task.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDashboard