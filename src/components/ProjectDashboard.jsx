import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ProjectDashboard({ session }) {
  const [projects, setProjects] = useState([])
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

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
              <input type="text" placeholder="タスク名" className="gantt-input" />
              <input type="text" placeholder="担当者" className="gantt-input" />
              <input type="date" className="gantt-input" />
              <input type="date" className="gantt-input" />
              <button className="gantt-add-btn">追加</button>
            </div>
            <div className="gantt-controls">
              <div className="date-controls">
                <label>表示開始日: <input type="date" className="gantt-date-input" /></label>
                <label>表示終了日: <input type="date" className="gantt-date-input" /></label>
              </div>
              <div className="gantt-buttons">
                <button className="gantt-period-btn">期間適用</button>
                <button className="gantt-auto-btn">自動設定</button>
              </div>
              <div className="scale-controls">
                <label>表示スケール:</label>
                <label><input type="radio" name="scale" value="small" /> 小（3ヶ月）</label>
                <label><input type="radio" name="scale" value="medium" defaultChecked /> 中（1ヶ月）</label>
                <label><input type="radio" name="scale" value="large" /> 大（詳細）</label>
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
                    <div className="date-cell">5/28<br />水</div>
                    <div className="date-cell">5/29<br />木</div>
                    <div className="date-cell">5/30<br />金</div>
                    <div className="date-cell">5/31<br />土</div>
                    <div className="date-cell">6/1<br />日</div>
                    <div className="date-cell">6/2<br />月</div>
                    <div className="date-cell">6/3<br />火</div>
                    <div className="date-cell">6/4<br />水</div>
                    <div className="date-cell">6/5<br />木</div>
                    <div className="date-cell">6/6<br />金</div>
                    <div className="date-cell">6/7<br />土</div>
                    <div className="date-cell">6/8<br />日</div>
                    <div className="date-cell">6/9<br />月</div>
                    <div className="date-cell">6/10<br />火</div>
                    <div className="date-cell">6/11<br />水</div>
                    <div className="date-cell">6/12<br />木</div>
                    <div className="date-cell">6/13<br />金</div>
                    <div className="date-cell">6/14<br />土</div>
                    <div className="date-cell">6/15<br />日</div>
                    <div className="date-cell">6/16<br />月</div>
                    <div className="date-cell">6/17<br />火</div>
                    <div className="date-cell">6/18<br />水</div>
                  </div>
                </div>
              </div>
              <div className="gantt-rows">
                <div className="gantt-row">
                  <div className="gantt-col task-col">エヌシーイー新潟国道</div>
                  <div className="gantt-col assignee-col">AS,sg,os,kg,ma,tg</div>
                  <div className="gantt-col operation-col">
                    <button className="delete-task-btn">×</button>
                    <button className="move-task-btn">::</button>
                  </div>
                  <div className="gantt-timeline">
                    <div className="task-bar" style={{left: '27%', width: '45%', backgroundColor: '#4285f4'}}>
                      エヌシーイー新潟国道
                    </div>
                  </div>
                </div>
                <div className="gantt-row">
                  <div className="gantt-col task-col">キタック</div>
                  <div className="gantt-col assignee-col">KG,os,ma,tg,ks</div>
                  <div className="gantt-col operation-col">
                    <button className="delete-task-btn">×</button>
                    <button className="move-task-btn">::</button>
                  </div>
                  <div className="gantt-timeline">
                    <div className="task-bar" style={{left: '77%', width: '23%', backgroundColor: '#4285f4'}}>
                      キタック
                    </div>
                  </div>
                </div>
                <div className="gantt-row">
                  <div className="gantt-col task-col">国際航業</div>
                  <div className="gantt-col assignee-col">AS,sg,os,tg,ks(kg</div>
                  <div className="gantt-col operation-col">
                    <button className="delete-task-btn">×</button>
                    <button className="move-task-btn">::</button>
                  </div>
                  <div className="gantt-timeline">
                    <div className="task-bar" style={{left: '0%', width: '100%', backgroundColor: '#ccc'}}>
                    </div>
                  </div>
                </div>
                <div className="gantt-row">
                  <div className="gantt-col task-col">エヌシーイー佐渡</div>
                  <div className="gantt-col assignee-col">KS,as,ma,os</div>
                  <div className="gantt-col operation-col">
                    <button className="delete-task-btn">×</button>
                    <button className="move-task-btn">::</button>
                  </div>
                  <div className="gantt-timeline">
                    <div className="task-bar" style={{left: '0%', width: '100%', backgroundColor: '#ccc'}}>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDashboard