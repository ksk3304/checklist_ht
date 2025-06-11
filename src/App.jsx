import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import ProjectDashboard from './components/ProjectDashboard'
import TaskList from './components/TaskList'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // セッションの取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 認証状態の監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="loading">読み込み中...</div>
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>チームチェックリスト</h1>
        {session && (
          <button 
            onClick={() => supabase.auth.signOut()}
            className="logout-btn"
          >
            ログアウト
          </button>
        )}
      </header>
      
      <main className="app-main">
        {!session ? (
          <Auth />
        ) : (
          <Router>
            <Routes>
              <Route path="/" element={<ProjectDashboard session={session} />} />
              <Route path="/project/:projectId" element={<TaskList session={session} />} />
            </Routes>
          </Router>
        )}
      </main>
    </div>
  )
}

export default App