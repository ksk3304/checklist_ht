import { useState, useMemo, useEffect, useRef } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

function TaskCalendar({ tasks }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [hoveredDate, setHoveredDate] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const calendarRef = useRef(null)

  // タスクの期限日付をグループ化
  const tasksByDate = useMemo(() => {
    const grouped = {}
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = task.due_date
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(task)
      }
    })
    return grouped
  }, [tasks])

  // 期限のある日付のリスト
  const dueDates = Object.keys(tasksByDate)

  // カレンダーのタイル内容をカスタマイズ
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0]
      const tasksOnDate = tasksByDate[dateString]
      
      if (tasksOnDate && tasksOnDate.length > 0) {
        // ステータス別のカウント
        const statusCounts = tasksOnDate.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1
          return acc
        }, {})

        return (
          <div className="calendar-task-indicators">
            {statusCounts.pending && (
              <div className="task-indicator pending">
                {statusCounts.pending}
              </div>
            )}
            {statusCounts.in_progress && (
              <div className="task-indicator in_progress">
                {statusCounts.in_progress}
              </div>
            )}
            {statusCounts.completed && (
              <div className="task-indicator completed">
                {statusCounts.completed}
              </div>
            )}
          </div>
        )
      }
    }
    return null
  }

  // カレンダーのタイルクラス名をカスタマイズ
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0]
      const tasksOnDate = tasksByDate[dateString]
      
      if (tasksOnDate && tasksOnDate.length > 0) {
        // 最も優先度の高いステータスに基づいてクラスを決定
        const hasPending = tasksOnDate.some(task => task.status === 'pending')
        const hasInProgress = tasksOnDate.some(task => task.status === 'in_progress')
        
        if (hasPending) return 'has-pending-tasks'
        if (hasInProgress) return 'has-inprogress-tasks'
        return 'has-completed-tasks'
      }
    }
    return null
  }

  // マウスホバー時のツールチップ表示
  const handleTileHover = (event, date) => {
    const dateString = date.toISOString().split('T')[0]
    const tasksOnDate = tasksByDate[dateString]
    
    if (tasksOnDate && tasksOnDate.length > 0) {
      setHoveredDate(dateString)
      setTooltipPosition({
        x: event.clientX + 10,
        y: event.clientY - 80
      })
    } else {
      setHoveredDate(null)
    }
  }

  const handleTileLeave = () => {
    setHoveredDate(null)
  }



  return (
    <div className="task-calendar-container">
      <h3 className="calendar-title">タスクカレンダー</h3>
      
      <div 
        className="calendar-wrapper" 
        onMouseMove={(e) => {
          const tile = e.target.closest('.react-calendar__tile')
          if (tile) {
            const abbr = tile.querySelector('abbr')
            if (abbr) {
              const dayText = abbr.textContent
              const currentDate = new Date()
              const year = currentDate.getFullYear()
              const month = currentDate.getMonth()
              
              // 現在表示されている月の日付を作成
              const date = new Date(year, month, parseInt(dayText))
              const dateString = date.toISOString().split('T')[0]
              
              if (tasksByDate[dateString]) {
                if (hoveredDate !== dateString) {
                  setHoveredDate(dateString)
                  // カレンダーとマウス位置から最適な位置を決定
                  const calendarRect = e.currentTarget.getBoundingClientRect()
                  const screenWidth = window.innerWidth
                  const screenHeight = window.innerHeight
                  const tooltipWidth = 250
                  const mouseY = e.clientY
                  
                  // 左右の配置を決定
                  const spaceOnRight = screenWidth - calendarRect.right
                  const isRightSide = spaceOnRight >= tooltipWidth / 2
                  
                  // 上下の配置を決定（画面の半分より上か下か）
                  const isUpperHalf = mouseY < screenHeight / 2
                  
                  let x, y
                  
                  if (isRightSide) {
                    // 右側：カレンダーと10px重なって表示
                    x = calendarRect.right - 10
                  } else {
                    // 左側：カレンダーと10px重なって表示
                    x = calendarRect.left - tooltipWidth + 10
                  }
                  
                  if (isUpperHalf) {
                    // 上半分：カレンダーの上部に合わせて表示
                    y = calendarRect.top + 20
                  } else {
                    // 下半分：カレンダーの下部に合わせて表示
                    y = calendarRect.bottom - 140
                  }
                  
                  setTooltipPosition({ x, y })
                }
              } else {
                setHoveredDate(null)
              }
            }
          } else {
            setHoveredDate(null)
          }
        }}
        onMouseLeave={() => setHoveredDate(null)}
      >
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          tileContent={tileContent}
          tileClassName={({ date, view }) => {
            if (view === 'month') {
              const dateString = date.toISOString().split('T')[0]
              const tasksOnDate = tasksByDate[dateString]
              
              if (tasksOnDate && tasksOnDate.length > 0) {
                // 最も優先度の高いステータスに基づいてクラスを決定
                const hasPending = tasksOnDate.some(task => task.status === 'pending')
                const hasInProgress = tasksOnDate.some(task => task.status === 'in_progress')
                
                if (hasPending) return 'has-pending-tasks'
                if (hasInProgress) return 'has-inprogress-tasks'
                return 'has-completed-tasks'
              }
            }
            return null
          }}
          locale="ja-JP"
          formatShortWeekday={(locale, date) => {
            const weekdays = ['日', '月', '火', '水', '木', '金', '土']
            return weekdays[date.getDay()]
          }}
        />
      </div>

      {/* ツールチップ */}
      {hoveredDate && tasksByDate[hoveredDate] && (
        <div
          className="calendar-tooltip"
          style={{
            position: 'fixed',
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            zIndex: 1000
          }}
        >
          <div className="tooltip-header">
            <strong>{new Date(hoveredDate).toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric'
            })}のタスク</strong>
          </div>
          <div className="tooltip-tasks">
            {tasksByDate[hoveredDate].map(task => (
              <div key={task.id} className={`tooltip-task status-${task.status}`}>
                <span className="task-status-dot"></span>
                <span className="task-title">{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 凡例 */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color pending"></div>
          <span>未完了</span>
        </div>
        <div className="legend-item">
          <div className="legend-color in_progress"></div>
          <span>進行中</span>
        </div>
        <div className="legend-item">
          <div className="legend-color completed"></div>
          <span>完了</span>
        </div>
      </div>
    </div>
  )
}

export default TaskCalendar