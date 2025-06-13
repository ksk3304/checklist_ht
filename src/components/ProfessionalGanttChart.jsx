import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const ProfessionalGanttChart = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState('small');
  const [displayStartDate, setDisplayStartDate] = useState('');
  const [displayEndDate, setDisplayEndDate] = useState('');
  const [newTask, setNewTask] = useState({ task_name: '', member: '', start_date: '', end_date: '' });
  const [showExtraColumns, setShowExtraColumns] = useState(false);

  // Supabase設定
  const supabase = createClient(
    'https://xznyjfxscqshjckdyefc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnlqZnhzY3FzaGpja2R5ZWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NDE0OTgsImV4cCI6MjA2MzAxNzQ5OH0.T4RLIrHHmilAbMFIidhty8tMkY9gk-01_KPB7wEDvq0'
  );

  // データ読み込み
  useEffect(() => {
    loadTasks();
    // 自動更新を無効化
  }, []);

  const loadTasks = async () => {
    try {
      console.log('ガントチャートデータを読み込み中...');

      const tableNames = [
        'work_assignment_gantt',
        'work_assignments', 
        'gantt_tasks',
        'todos'
      ];

      let data = null;
      let successTable = null;

      for (const tableName of tableNames) {
        try {
          const result = await supabase
            .from(tableName)
            .select('*')
            .order('start_date', { ascending: true });

          if (!result.error && result.data) {
            data = result.data;
            successTable = tableName;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (data) {
        console.log(`${successTable}から${data.length}件のタスクを取得`);
        setTasks(data);
      } else {
        console.log('データが見つかりません');
        setTasks([]);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // タスク追加
  const addTask = () => {
    if (!newTask.task_name || !newTask.member || !newTask.start_date || !newTask.end_date) {
      alert('すべての項目を入力してください');
      return;
    }
    const task = {
      id: Date.now(),
      ...newTask
    };
    setTasks([...tasks, task]);
    setNewTask({ task_name: '', member: '', start_date: '', end_date: '' });
  };

  // タスク削除
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // 自動期間設定
  const autoSetPeriod = () => {
    if (tasks.length === 0) return;
    
    const startDates = tasks.map(task => new Date(task.start_date));
    const endDates = tasks.map(task => new Date(task.end_date));
    
    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));
    
    const adjustedStartDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() - 7);
    const adjustedEndDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate() + 14);
    
    setDisplayStartDate(adjustedStartDate.toISOString().split('T')[0]);
    setDisplayEndDate(adjustedEndDate.toISOString().split('T')[0]);
  };

  // 日付範囲計算
  const calculateDateRange = () => {
    let startDate, endDate;
    
    if (displayStartDate && displayEndDate) {
      startDate = new Date(displayStartDate);
      endDate = new Date(displayEndDate);
    } else {
      // デフォルト表示：今日の1ヶ月前から6ヶ月後まで
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      endDate = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
    }

    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  // 日幅取得
  const getDayWidth = () => {
    switch (scale) {
      case 'small': return 15;
      case 'medium': return 30;
      case 'large': return 50;
      default: return 30;
    }
  };

  // バー位置計算
  const calculateBarPosition = (task, dates) => {
    if (!task.start_date || !task.end_date) return null;

    const taskStartDate = new Date(task.start_date + 'T00:00:00');
    const taskEndDate = new Date(task.end_date + 'T00:00:00');
    const firstDate = dates[0];
    const dayWidth = getDayWidth();

    const startOffsetMs = taskStartDate.getTime() - firstDate.getTime();
    const startOffsetDays = Math.floor(startOffsetMs / (1000 * 60 * 60 * 24));

    const durationMs = taskEndDate.getTime() - taskStartDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;

    const barLeft = startOffsetDays * dayWidth;
    const barWidth = Math.max(dayWidth, durationDays * dayWidth);

    return {
      left: Math.max(0, barLeft),
      width: barWidth,
      isVisible: taskEndDate >= firstDate && taskStartDate <= dates[dates.length - 1]
    };
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        ガントチャートを読み込み中...
      </div>
    );
  }

  const dates = calculateDateRange();
  const dayWidth = getDayWidth();

  return (
    <div className="gantt-section">
      {/* タイトル */}
      <h2 className="gantt-title">ガントチャート（業務横断）</h2>

      {/* 入力フォーム */}
      <div className="gantt-input-section">
        <div className="gantt-input-row">
          <input
            id="gantt-task-input"
            type="text"
            placeholder="タスク名"
            value={newTask.task_name}
            onChange={(e) => setNewTask({...newTask, task_name: e.target.value})}
          />
          <input
            id="gantt-member-input"
            type="text"
            placeholder="担当者"
            value={newTask.member}
            onChange={(e) => setNewTask({...newTask, member: e.target.value})}
          />
          <input
            id="gantt-start-date"
            type="date"
            value={newTask.start_date}
            onChange={(e) => setNewTask({...newTask, start_date: e.target.value})}
          />
          <input
            id="gantt-end-date"
            type="date"
            value={newTask.end_date}
            onChange={(e) => setNewTask({...newTask, end_date: e.target.value})}
          />
          <button id="add-gantt-task-btn" onClick={addTask}>
            追加
          </button>
        </div>

        {/* 期間コントロール */}
        <div className="gantt-period-controls">
          <div className="period-input-group">
            <label>表示開始日:</label>
            <input
              type="date"
              value={displayStartDate}
              onChange={(e) => setDisplayStartDate(e.target.value)}
            />
          </div>
          <div className="period-input-group">
            <label>表示終了日:</label>
            <input
              type="date"
              value={displayEndDate}
              onChange={(e) => setDisplayEndDate(e.target.value)}
            />
          </div>
          <button id="apply-period-btn" onClick={() => setTasks([...tasks])}>
            期間適用
          </button>
          <button id="auto-period-btn" onClick={autoSetPeriod}>
            自動設定
          </button>

          {/* 表示スケール */}
          <div className="gantt-scale-controls">
            <label>表示スケール:</label>
            <div className="scale-options">
              <label className="scale-option">
                <input
                  type="radio"
                  name="scale"
                  value="small"
                  checked={scale === 'small'}
                  onChange={(e) => setScale(e.target.value)}
                />
                <span>小（3ヶ月）</span>
              </label>
              <label className="scale-option">
                <input
                  type="radio"
                  name="scale"
                  value="medium"
                  checked={scale === 'medium'}
                  onChange={(e) => setScale(e.target.value)}
                />
                <span>中（1ヶ月）</span>
              </label>
              <label className="scale-option">
                <input
                  type="radio"
                  name="scale"
                  value="large"
                  checked={scale === 'large'}
                  onChange={(e) => setScale(e.target.value)}
                />
                <span>大（詳細）</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* スクロール案内 */}
      <div className="gantt-scroll-controls">
        <button 
          className="gantt-scroll-btn gantt-scroll-left" 
          title="左へスクロール"
          onClick={() => {
            const scrollableArea = document.querySelector('.gantt-scrollable-right');
            if (scrollableArea) {
              scrollableArea.scrollLeft -= 200;
            }
          }}
        >
          ←
        </button>
        <span className="gantt-scroll-info">左右にスクロールできます</span>
        <button 
          className="gantt-scroll-btn gantt-scroll-right" 
          title="右へスクロール"
          onClick={() => {
            const scrollableArea = document.querySelector('.gantt-scrollable-right');
            if (scrollableArea) {
              scrollableArea.scrollLeft += 200;
            }
          }}
        >
          →
        </button>
      </div>

      {/* メインガントチャート */}
      <div className="gantt-container-improved" style={{ maxHeight: '70vh' }}>
        {/* 左側固定エリア */}
        <div className="gantt-fixed-left" style={{ width: showExtraColumns ? '420px' : '220px' }}>
          {/* ヘッダー */}
          <div className="gantt-header-fixed">
            <div className="gantt-task-column-fixed" style={{ width: '200px' }}>
              タスク
              <button 
                onClick={() => setShowExtraColumns(!showExtraColumns)}
                style={{
                  marginLeft: '10px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {showExtraColumns ? '<<' : '>>'}
              </button>
            </div>
            {showExtraColumns && (
              <>
                <div className="gantt-member-column-fixed">担当者</div>
                <div className="gantt-actions-column-fixed">操作</div>
              </>
            )}
          </div>

          {/* タスクリスト */}
          <div className="gantt-body-fixed">
            {tasks.map((task, index) => (
              <div key={task.id} className="gantt-row-fixed" data-task-id={task.id} data-task-index={index}>
                <div className="gantt-task-name-fixed" style={{ width: '200px' }}>{task.task_name}</div>
                {showExtraColumns && (
                  <>
                    <div className="gantt-member-cell-fixed">{task.member || ''}</div>
                    <div className="gantt-actions-cell-fixed">
                      <button className="gantt-delete-btn-new" onClick={() => deleteTask(task.id)} title="削除">×</button>
                      <div className="gantt-drag-handle" data-task-id={task.id} title="ドラッグして順序変更">::</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右側スクロールエリア */}
        <div className="gantt-scrollable-right">
          {/* 日付ヘッダー */}
          <div className="gantt-date-header" style={{ width: `${dates.length * dayWidth}px` }}>
            {dates.map((date, index) => {
              const day = date.getDate();
              const month = date.getMonth() + 1;
              const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const today = new Date();
              const isToday = date.toDateString() === today.toDateString();
              const isFirstDayOfMonth = day === 1;
              
              // スケールに応じて表示内容を変更
              let topContent, bottomContent;
              
              if (scale === 'small') {
                // 3ヶ月表示：月の最初の日のみ月も表示、他は日だけ
                topContent = isFirstDayOfMonth ? `${month}月${day}` : day;
                bottomContent = '';  // 曜日は非表示
              } else if (scale === 'medium') {
                // 1ヶ月表示：月/日と曜日
                topContent = `${month}/${day}`;
                bottomContent = weekday;
              } else {
                // 詳細表示：月/日と曜日
                topContent = `${month}/${day}`;
                bottomContent = weekday;
              }
              
              return (
                <div 
                  key={index} 
                  className={`gantt-day-improved ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`}
                  style={{ 
                    width: `${dayWidth}px`,
                    borderRight: '1px solid #dee2e6'  // 週末でも罫線を表示
                  }}
                >
                  <div className="date-top">{topContent}</div>
                  {bottomContent && <div className="date-bottom">{bottomContent}</div>}
                </div>
              );
            })}
          </div>

          {/* タスクバーエリア */}
          <div 
            className="gantt-bars-container" 
            style={{ 
              width: `${dates.length * dayWidth}px`,
              // CSS背景で縦線を表示（パフォーマンス向上）
              backgroundImage: `repeating-linear-gradient(
                to right,
                transparent,
                transparent ${dayWidth - 1}px,
                #e0e0e0 ${dayWidth - 1}px,
                #e0e0e0 ${dayWidth}px
              )`,
              position: 'relative'
            }}
          >
            {tasks.map(task => {
              const barInfo = calculateBarPosition(task, dates);
              return (
                <div key={task.id} className="gantt-task-row" style={{ height: '50px', position: 'relative' }}>
                  {barInfo && barInfo.isVisible && (
                    <div 
                      className="gantt-bar-improved" 
                      data-task-id={task.id}
                      style={{
                        left: `${barInfo.left}px`,
                        width: `${barInfo.width}px`,
                        position: 'absolute',
                        top: '10px',
                        height: '30px',
                        zIndex: 10
                      }}
                    >
                      <span className="gantt-bar-text">{task.task_name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalGanttChart;