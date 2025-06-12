import { useState, useMemo } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

function TaskCalendar({ tasks }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [hoveredDate, setHoveredDate] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

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
              <div className="task-indicator pending" title={`未完了: ${statusCounts.pending}件`}>
                {statusCounts.pending}
              </div>
            )}
            {statusCounts.in_progress && (
              <div className="task-indicator in_progress" title={`進行中: ${statusCounts.in_progress}件`}>
                {statusCounts.in_progress}
              </div>
            )}
            {statusCounts.completed && (
              <div className="task-indicator completed" title={`完了: ${statusCounts.completed}件`}>
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
        x: event.clientX,
        y: event.clientY - 20
      })
    }
  }

  const handleTileLeave = () => {
    setHoveredDate(null)
  }

  return (
    <div className="task-calendar-container">
      <h3 className="calendar-title">タスクカレンダー</h3>
      
      <div className="calendar-wrapper">
        <div
          onMouseLeave={handleTileLeave}
          onMouseMove={(e) => {
            // カレンダータイル上でマウス移動時の処理
            const tile = e.target.closest('.react-calendar__tile')
            if (tile) {
              const ariaLabel = tile.getAttribute('aria-label')
              if (ariaLabel) {
                try {
                  const dateMatch = ariaLabel.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
                  if (dateMatch) {
                    const year = dateMatch[1]
                    const month = dateMatch[2].padStart(2, '0')
                    const day = dateMatch[3].padStart(2, '0')
                    const date = new Date(`${year}-${month}-${day}`)
                    handleTileHover(e, date)
                  }
                } catch (error) {
                  // 日付解析エラーは無視
                }
              }
            }
          }}
        >
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            locale="ja-JP"
            calendarType="US"
            formatShortWeekday={(locale, date) => {
              const weekdays = ['日', '月', '火', '水', '木', '金', '土']
              return weekdays[date.getDay()]
            }}
          />
        </div>
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