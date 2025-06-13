import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const DynamicGanttChart = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState('medium');

  // Supabase設定（あなたのデータベース）
  const supabase = createClient(
    'https://xznyjfxscqshjckdyefc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnlqZnhzY3FzaGpja2R5ZWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NDE0OTgsImV4cCI6MjA2MzAxNzQ5OH0.T4RLIrHHmilAbMFIidhty8tMkY9gk-01_KPB7wEDvq0'
  );

  // データ読み込み
  useEffect(() => {
    loadTasks();

    // 30秒ごとに自動更新
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      console.log('ガントチャートデータを読み込み中...');

      // 複数のテーブル名を試行
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
            .order('order_index', { ascending: true })
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

  // 以下、前回と同じ関数群...
  const calculateDateRange = () => {
    const now = new Date();
    const dates = [];

    for (let i = -30; i <= 365; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(12, 0, 0, 0);
      dates.push(new Date(date));
    }

    return dates;
  };

  const getColumnWidth = () => {
    switch (scale) {
      case 'small': return 20;
      case 'medium': return 40;
      case 'large': return 80;
      default: return 40;
    }
  };

  const calculateBarPosition = (task, dateRange) => {
    if (!task.start_date || !task.end_date) return null;

    const startDate = new Date(task.start_date + 'T12:00:00');
    const endDate = new Date(task.end_date + 'T12:00:00');
    const columnWidth = getColumnWidth();

    const startIndex = dateRange.findIndex(date => {
      const taskStartStr = startDate.toISOString().split('T')[0];
      const dateStr = date.toISOString().split('T')[0];
      return taskStartStr === dateStr;
    });

    if (startIndex === -1) return null;

    const endIndex = dateRange.findIndex(date => {
      const taskEndStr = endDate.toISOString().split('T')[0];
      const dateStr = date.toISOString().split('T')[0];
      return taskEndStr === dateStr;
    });

    const actualEndIndex = endIndex >= 0 ? endIndex : dateRange.length - 1;
    const duration = Math.max(1, actualEndIndex - startIndex + 1);

    return {
      left: startIndex * columnWidth,
      width: duration * columnWidth - 2
    };
  };

  const formatDateHeader = (date) => {
    switch (scale) {
      case 'small':
        return date.getDate() === 1 ? `${date.getMonth() + 1}月` : '';
      case 'medium':
        return date.getDate();
      case 'large':
        return `${date.getMonth() + 1}/${date.getDate()}`;
      default:
        return date.getDate();
    }
  };

  const getDateStyle = (date) => {
    const day = date.getDay();
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return { backgroundColor: '#ff7675', color: 'white' };
    } else if (day === 0 || day === 6) {
      return { backgroundColor: '#ffeaa7' };
    }
    return {};
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '-';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return `${diffDays}日`;
  };

  const dateRange = calculateDateRange();

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        最新のガントチャートデータを読み込み中...
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      border: '1px solid #e1e5e9',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#fff',
      marginTop: '20px'
    }}>
      {/* コントロール */}
      <div style={{
        padding: '12px',
        background: '#f8f9fa',
        borderBottom: '1px solid #e1e5e9',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <button
          onClick={loadTasks}
          style={{
            padding: '6px 12px',
            border: '1px solid #007bff',
            borderRadius: '4px',
            background: '#007bff',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          最新データに更新
        </button>
        <select
          value={scale}
          onChange={(e) => setScale(e.target.value)}
          style={{
            padding: '6px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="small">3ヶ月表示</option>
          <option value="medium">1ヶ月表示</option>
          <option value="large">詳細表示</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
          {tasks.length}件のタスク（リアルタイム）
        </span>
      </div>

      {/* 以下、表示部分は前回と同じ... */}
      <div style={{
        display: 'flex',
        height: '500px'
      }}>
        <div style={{
          width: '350px',
          borderRight: '1px solid #e1e5e9',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            background: '#f8f9fa',
            borderBottom: '1px solid #e1e5e9',
            height: '40px',
            alignItems: 'center',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            <div style={{ width: '180px', padding: '0 8px' }}>タスク名</div>
            <div style={{ width: '80px', padding: '0 8px' }}>担当者</div>
            <div style={{ width: '90px', padding: '0 8px' }}>期間</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  height: '40px',
                  borderBottom: '1px solid #f1f3f4',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  width: '180px',
                  padding: '0 8px',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }} title={task.task_name}>
                  {task.task_name || ''}
                </div>
                <div style={{
                  width: '80px',
                  padding: '0 8px',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  {task.member || ''}
                </div>
                <div style={{
                  width: '90px',
                  padding: '0 8px',
                  fontSize: '12px',
                  color: '#888'
                }}>
                  {formatDateRange(task.start_date, task.end_date)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '40px',
            background: '#f8f9fa',
            borderBottom: '1px solid #e1e5e9',
            overflowX: 'auto',
            display: 'flex',
            alignItems: 'center'
          }}>
            {dateRange.map((date, index) => (
              <div
                key={index}
                style={{
                  minWidth: `${getColumnWidth()}px`,
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: '1px solid #e1e5e9',
                  fontSize: '12px',
                  fontWeight: '500',
                  ...getDateStyle(date)
                }}
              >
                {formatDateHeader(date)}
              </div>
            ))}
          </div>

          <div style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
            width: `${dateRange.length * getColumnWidth()}px`
          }}>
            {tasks.map((task) => {
              const barInfo = calculateBarPosition(task, dateRange);
              return (
                <div
                  key={task.id}
                  style={{
                    height: '40px',
                    position: 'relative',
                    borderBottom: '1px solid #f1f3f4'
                  }}
                >
                  {barInfo && (
                    <div
                      style={{
                        position: 'absolute',
                        height: '24px',
                        background: '#007bff',
                        borderRadius: '4px',
                        top: '8px',
                        left: `${barInfo.left}px`,
                        width: `${barInfo.width}px`,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '500',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        padding: '0 8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {task.task_name || ''}
                      </div>
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

export default DynamicGanttChart;