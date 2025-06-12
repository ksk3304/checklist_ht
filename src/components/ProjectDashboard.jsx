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
    </div>
  )
}

export default ProjectDashboard