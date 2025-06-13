import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const GanttChart = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState('medium');
  const [displayStartDate, setDisplayStartDate] = useState('');
  const [displayEndDate, setDisplayEndDate] = useState('');
  const [newTask, setNewTask] = useState({ task_name: '', member: '', start_date: '', end_date: '' });
  const [error, setError] = useState(null);

  // Supabaseからタスクデータを取得
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Supabaseからタスクを取得中...');
      
      const { data, error } = await supabase
        .from('work_assignment_gantt')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Supabaseエラー:', error);
        setError('データの取得に失敗しました: ' + error.message);
        return;
      }

      console.log('取得したデータ:', data);
      setTasks(data || []);
      
    } catch (err) {
      console.error('予期しないエラー:', err);
      setError('予期しないエラーが発生しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // タスク追加
  const addTask = async () => {
    if (!newTask.task_name || !newTask.member || !newTask.start_date || !newTask.end_date) {
      alert('すべての項目を入力してください');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('work_assignment_gantt')
        .insert([newTask])
        .select();

      if (error) {
        console.error('タスク追加エラー:', error);
        alert('タスクの追加に失敗しました: ' + error.message);
        return;
      }

      console.log('タスクを追加しました:', data);
      await fetchTasks(); // データを再取得
      setNewTask({ task_name: '', member: '', start_date: '', end_date: '' });
    } catch (err) {
      console.error('予期しないエラー:', err);
      alert('予期しないエラーが発生しました');
    }
  };

  // タスク削除
  const deleteTask = async (id) => {
    try {
      const { error } = await supabase
        .from('work_assignment_gantt')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('タスク削除エラー:', error);
        alert('タスクの削除に失敗しました: ' + error.message);
        return;
      }

      console.log('タスクを削除しました:', id);
      await fetchTasks(); // データを再取得
    } catch (err) {
      console.error('予期しないエラー:', err);
      alert('予期しないエラーが発生しました');
    }
  };

  // 自動期間設定
  const autoSetPeriod = () => {
    if (tasks.length === 0) return;
    
    const startDates = tasks.map(task => new Date(task.start_date + 'T00:00:00'));
    const endDates = tasks.map(task => new Date(task.end_date + 'T00:00:00'));
    
    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));
    
    const adjustedStartDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() - 3);
    const adjustedEndDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate() + 7);
    
    setDisplayStartDate(adjustedStartDate.toISOString().split('T')[0]);
    setDisplayEndDate(adjustedEndDate.toISOString().split('T')[0]);
  };

  // 日付範囲計算関数（1年間表示）
  const calculateDateRange = () => {
    const now = new Date();
    const dates = [];

    // 今日から1年間表示するように変更
    for (let i = -30; i <= 365; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      dates.push(new Date(date));
    }

    return dates;
  };

  // ガントチャート描画
  const renderGanttChart = () => {
    let dates;
    
    if (displayStartDate && displayEndDate) {
      const startDate = new Date(displayStartDate);
      const endDate = new Date(displayEndDate);
      dates = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // 自動計算の場合は1年間表示
      dates = calculateDateRange();
    }

    let dayWidth;
    switch (scale) {
      case 'small':
        dayWidth = 15;
        break;
      case 'medium':
        dayWidth = 30;
        break;
      case 'large':
        dayWidth = 50;
        break;
      default:
        dayWidth = 30;
    }

    return (
      <div className="gantt-chart">
        <div className="gantt-container-improved">
          {/* 固定左側部分 */}
          <div className="gantt-fixed-left">
            <div className="gantt-header-fixed">
              <div className="gantt-task-column-fixed">タスク</div>
              <div className="gantt-member-column-fixed">担当者</div>
              <div className="gantt-actions-column-fixed">操作</div>
            </div>
            <div className="gantt-body-fixed">
              {tasks.map((task, index) => (
                <div key={task.id} className="gantt-row-fixed" data-task-id={task.id} data-task-index={index}>
                  <div className="gantt-task-name-fixed">{task.task_name}</div>
                  <div className="gantt-member-cell-fixed">{task.member || ''}</div>
                  <div className="gantt-actions-cell-fixed">
                    <button className="gantt-delete-btn-new" onClick={() => deleteTask(task.id)} title="削除">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* スクロール可能な右側部分 */}
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
                
                return (
                  <div 
                    key={index} 
                    className={`gantt-day-improved ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`}
                    style={{ width: `${dayWidth}px` }}
                  >
                    <div className="date-top">{month}/{day}</div>
                    <div className="date-bottom">{weekday}</div>
                  </div>
                );
              })}
            </div>
            
            {/* タスクバー部分 */}
            <div className="gantt-bars-container" style={{ width: `${dates.length * dayWidth}px` }}>
              {tasks.map(task => {
                // バー位置計算関数
                const calculateBarPosition = (task, dateRange) => {
                  if (!task.start_date || !task.end_date) return null;

                  // デバッグ用：コンソールに情報を出力
                  console.log('=== デバッグ情報 ===');
                  console.log('タスク名:', task.task_name);
                  console.log('開始日:', task.start_date);
                  console.log('終了日:', task.end_date);
                  console.log('カレンダー範囲:');
                  console.log('  最初の日:', dateRange[0].toISOString().split('T')[0]);
                  console.log('  最後の日:', dateRange[dateRange.length - 1].toISOString().split('T')[0]);

                  const startDate = new Date(task.start_date + 'T00:00:00');
                  const endDate = new Date(task.end_date + 'T00:00:00');

                  console.log('開始日オブジェクト:', startDate.toISOString().split('T')[0]);
                  console.log('終了日オブジェクト:', endDate.toISOString().split('T')[0]);

                  const columnWidth = dayWidth;

                  const startIndex = dateRange.findIndex(date =>
                    date.toDateString() === startDate.toDateString()
                  );

                  if (startIndex === -1) {
                    // 開始日が範囲外の場合、範囲内に開始日があるかチェック
                    const firstDate = dateRange[0];
                    const lastDate = dateRange[dateRange.length - 1];

                    if (startDate > lastDate || endDate < firstDate) {
                      return null; // 完全に範囲外
                    }

                    // 開始日が範囲より前の場合、0から開始
                    if (startDate < firstDate) {
                      const endIndex = dateRange.findIndex(date =>
                        date.toDateString() === endDate.toDateString()
                      );

                      const actualEndIndex = endIndex >= 0 ? endIndex :
                        (endDate > lastDate ? dateRange.length - 1 : -1);

                      if (actualEndIndex === -1) return null;

                      return {
                        left: 0,
                        width: (actualEndIndex + 1) * columnWidth - 2,
                        isVisible: true
                      };
                    }

                    return null;
                  }

                  let endIndex = dateRange.findIndex(date =>
                    date.toDateString() === endDate.toDateString()
                  );

                  // 終了日が範囲外の場合、範囲の最後まで延長
                  if (endIndex === -1) {
                    const lastDate = dateRange[dateRange.length - 1];
                    if (endDate > lastDate) {
                      endIndex = dateRange.length - 1;
                    } else {
                      // 終了日が範囲より前の場合
                      return null;
                    }
                  }

                  const duration = Math.max(1, endIndex - startIndex + 1);

                  return {
                    left: startIndex * columnWidth,
                    width: duration * columnWidth - 2,
                    isVisible: true
                  };
                };

                const barPosition = calculateBarPosition(task, dates);
                
                if (!barPosition) return null;
                
                return (
                  <div key={task.id} className="gantt-task-row" style={{ height: '50px', position: 'relative' }}>
                    {barPosition.isVisible && (
                      <div 
                        className="gantt-bar-improved" 
                        data-task-id={task.id}
                        style={{
                          left: `${barPosition.left}px`,
                          width: `${barPosition.width}px`,
                          position: 'absolute',
                          top: '10px',
                          height: '30px',
                          backgroundColor: '#4285f4',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          zIndex: 1
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

  if (loading) return <div className="loading">ガントチャートを読み込み中...</div>;
  if (error) return <div className="error">エラー: {error}</div>;

  return (
    <div className="gantt-section">
      <h2 className="gantt-title">ガントチャート（業務横断）</h2>
      <div className="gantt-container">
        <div className="gantt-form">
          <div className="gantt-inputs">
            <input 
              type="text" 
              placeholder="タスク名" 
              className="gantt-input"
              value={newTask.task_name}
              onChange={(e) => setNewTask({...newTask, task_name: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="担当者" 
              className="gantt-input"
              value={newTask.member}
              onChange={(e) => setNewTask({...newTask, member: e.target.value})}
            />
            <input 
              type="date" 
              className="gantt-input"
              value={newTask.start_date}
              onChange={(e) => setNewTask({...newTask, start_date: e.target.value})}
            />
            <input 
              type="date" 
              className="gantt-input"
              value={newTask.end_date}
              onChange={(e) => setNewTask({...newTask, end_date: e.target.value})}
            />
            <button className="gantt-add-btn" onClick={addTask}>追加</button>
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
                /> 小（3ヶ月）
              </label>
              <label>
                <input 
                  type="radio" 
                  name="scale" 
                  value="medium" 
                  checked={scale === 'medium'}
                  onChange={(e) => setScale(e.target.value)}
                /> 中（1ヶ月）
              </label>
              <label>
                <input 
                  type="radio" 
                  name="scale" 
                  value="large" 
                  checked={scale === 'large'}
                  onChange={(e) => setScale(e.target.value)}
                /> 大（詳細）
              </label>
            </div>
          </div>
        </div>
        
        {renderGanttChart()}
      </div>

      <style jsx>{`
        .gantt-section {
          margin-top: 2rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .gantt-title {
          margin-bottom: 1rem;
          color: #333;
        }

        .gantt-form {
          margin-bottom: 1rem;
        }

        .gantt-inputs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .gantt-input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          flex: 1;
          min-width: 120px;
        }

        .gantt-add-btn {
          padding: 0.5rem 1rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .gantt-add-btn:hover {
          background: #0056b3;
        }

        .gantt-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .date-controls {
          display: flex;
          gap: 1rem;
        }

        .gantt-date-input {
          padding: 0.25rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-left: 0.5rem;
        }

        .gantt-auto-btn {
          padding: 0.5rem 1rem;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .gantt-auto-btn:hover {
          background: #1e7e34;
        }

        .scale-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .scale-controls label {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .gantt-container-improved {
          display: flex;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }

        .gantt-fixed-left {
          border-right: 1px solid #ddd;
          background: #f8f9fa;
          min-width: 300px;
        }

        .gantt-header-fixed {
          display: flex;
          background: #e9ecef;
          border-bottom: 1px solid #ddd;
          font-weight: bold;
        }

        .gantt-task-column-fixed {
          width: 150px;
          padding: 0.5rem;
          border-right: 1px solid #ddd;
        }

        .gantt-member-column-fixed {
          width: 100px;
          padding: 0.5rem;
          border-right: 1px solid #ddd;
        }

        .gantt-actions-column-fixed {
          width: 50px;
          padding: 0.5rem;
        }

        .gantt-row-fixed {
          display: flex;
          border-bottom: 1px solid #eee;
          min-height: 50px;
          align-items: center;
        }

        .gantt-task-name-fixed {
          width: 150px;
          padding: 0.5rem;
          border-right: 1px solid #ddd;
          font-weight: 500;
        }

        .gantt-member-cell-fixed {
          width: 100px;
          padding: 0.5rem;
          border-right: 1px solid #ddd;
          font-size: 0.875rem;
          color: #666;
        }

        .gantt-actions-cell-fixed {
          width: 50px;
          padding: 0.5rem;
          text-align: center;
        }

        .gantt-delete-btn-new {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 12px;
        }

        .gantt-delete-btn-new:hover {
          background: #c82333;
        }

        .gantt-scrollable-right {
          overflow-x: auto;
          flex: 1;
        }

        .gantt-date-header {
          display: flex;
          background: #e9ecef;
          border-bottom: 1px solid #ddd;
          min-height: 60px;
        }

        .gantt-day-improved {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-right: 1px solid #ddd;
          font-size: 0.75rem;
          padding: 0.25rem;
        }

        .gantt-day-improved.weekend {
          background-color: #f8d7da;
        }

        .gantt-day-improved.today {
          background-color: #d4edda;
          font-weight: bold;
        }

        .date-top {
          font-weight: bold;
        }

        .date-bottom {
          color: #666;
          font-size: 0.6rem;
        }

        .gantt-bars-container {
          position: relative;
        }

        .gantt-task-row {
          border-bottom: 1px solid #eee;
        }

        .gantt-bar-improved {
          cursor: pointer;
        }

        .gantt-bar-improved:hover {
          opacity: 0.8;
        }

        .gantt-bar-text {
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .error {
          text-align: center;
          padding: 2rem;
          color: #dc3545;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          margin: 1rem;
        }
      `}</style>
    </div>
  );
};

export default GanttChart;