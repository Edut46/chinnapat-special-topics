import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API = 'http://localhost:5000/tasks';

/* ========== SVG Donut Progress Ring ========== */
function ProgressRing({ percent, size = 120, strokeWidth = 10, label, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="progress-ring-wrapper">
      <svg width={size} height={size} className="progress-ring-svg">
        {/* Glow filter */}
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color === 'cyan' ? '#00f0ff' : color === 'purple' ? '#ff2a6d' : '#fcee09'} />
            <stop offset="100%" stopColor={color === 'cyan' ? '#39ff14' : color === 'purple' ? '#fcee09' : '#00f0ff'} />
          </linearGradient>
          <filter id={`glow-${color}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#grad-${color})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#glow-${color})`}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />

        {/* Center text */}
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="central"
          className="progress-ring-percent"
        >
          {Math.round(percent)}%
        </text>
        <text
          x="50%"
          y="64%"
          textAnchor="middle"
          dominantBaseline="central"
          className="progress-ring-label"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ========== Mini Bar Chart ========== */
function MiniBarChart({ pending, done, total }) {
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;
  const donePct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="mini-bar-chart">
      <div className="bar-row">
        <span className="bar-label">ค้างอยู่</span>
        <div className="bar-track">
          <div className="bar-fill pending" style={{ width: `${pendingPct}%` }}></div>
        </div>
        <span className="bar-value">{pending}</span>
      </div>
      <div className="bar-row">
        <span className="bar-label">เสร็จแล้ว</span>
        <div className="bar-track">
          <div className="bar-fill done" style={{ width: `${donePct}%` }}></div>
        </div>
        <span className="bar-value">{done}</span>
      </div>
    </div>
  );
}

/* ========== Main App ========== */
function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API);
      setTasks(res.data);
    } catch (err) {
      console.error('ไม่สามารถโหลดข้อมูลได้:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const res = await axios.post(API, { text: newTask.trim() });
      setTasks([res.data, ...tasks]);
      setNewTask('');
      Swal.fire({
        title: 'TASK UPLOADED',
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 1200,
        showConfirmButton: false,
        timerProgressBar: true,
        background: '#0a0a0f',
        color: '#00f0ff',
      });
    } catch (err) {
      console.error('ไม่สามารถเพิ่มงานได้:', err);
    }
  };

  const toggleTask = async (id) => {
    try {
      const res = await axios.put(`${API}/${id}`);
      setTasks(tasks.map(t => t._id === id ? res.data : t));
    } catch (err) {
      console.error('ไม่สามารถอัปเดตสถานะได้:', err);
    }
  };

  const deleteTask = async (id) => {
    const result = await Swal.fire({
      title: 'CONFIRM DELETION',
      text: 'ต้องการลบข้อมูลนี้จากระบบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff2a6d',
      cancelButtonColor: '#00f0ff',
      confirmButtonText: 'DELETE',
      cancelButtonText: 'CANCEL',
      background: '#0a0a0f',
      color: '#00f0ff',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API}/${id}`);
        setTasks(tasks.filter(t => t._id !== id));
        Swal.fire({
          title: 'DATA PURGED',
          text: 'รายการถูกลบออกจากระบบแล้ว',
          icon: 'success',
          toast: true,
          position: 'top-end',
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
          background: '#0a0a0f',
          color: '#00f0ff',
        });
      } catch (err) {
        console.error('ไม่สามารถลบงานได้:', err);
        Swal.fire({
          title: 'SYSTEM ERROR',
          text: 'ไม่สามารถลบรายการได้',
          icon: 'error',
          background: '#0a0a0f',
          color: '#ff2a6d',
        });
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    const text = task.text || task.title || '';
    const matchSearch = text.toLowerCase().includes(search.toLowerCase());
    if (filter === 'pending') return !task.completed && matchSearch;
    if (filter === 'completed') return task.completed && matchSearch;
    return matchSearch;
  });

  // Stats
  const totalCount = tasks.length;
  const pendingCount = tasks.filter(t => !t.completed).length;
  const doneCount = tasks.filter(t => t.completed).length;
  const completionPercent = useMemo(
    () => (totalCount > 0 ? (doneCount / totalCount) * 100 : 0),
    [totalCount, doneCount]
  );
  const pendingPercent = useMemo(
    () => (totalCount > 0 ? (pendingCount / totalCount) * 100 : 0),
    [totalCount, pendingCount]
  );

  // Today's date
  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="app-layout">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="sidebar sidebar-left">
        <div className="sidebar-card">
          <h3 className="sidebar-title">ความคืบหน้า</h3>
          <ProgressRing
            percent={completionPercent}
            size={140}
            strokeWidth={12}
            label="เสร็จสิ้น"
            color="cyan"
          />
          <div className="sidebar-stat-row">
            <div className="sidebar-stat">
              <span className="sidebar-stat-value done-text">{doneCount}</span>
              <span className="sidebar-stat-label">เสร็จแล้ว</span>
            </div>
            <div className="sidebar-stat-divider"></div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-value total-text">{totalCount}</span>
              <span className="sidebar-stat-label">ทั้งหมด</span>
            </div>
          </div>
        </div>

        <div className="sidebar-card">
          <h3 className="sidebar-title">📅 วันนี้</h3>
          <p className="sidebar-date">{today}</p>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="app-container">
        <h1 className="app-title">CYBER//TASK</h1>
        <p className="app-subtitle">// NEURAL TASK MANAGEMENT SYSTEM v2.077</p>

        <div className="card">
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item total">
              ทั้งหมด <span className="stat-number">{totalCount}</span>
            </div>
            <div className="stat-item pending">
              ค้างอยู่ <span className="stat-number">{pendingCount}</span>
            </div>
            <div className="stat-item done">
              เสร็จแล้ว <span className="stat-number">{doneCount}</span>
            </div>
          </div>

          {/* Search */}
          <div className="search-bar">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหางาน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>ทั้งหมด</button>
            <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>ค้างอยู่</button>
            <button className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>เสร็จแล้ว</button>
          </div>

          {/* Add Task */}
          <form className="input-area" onSubmit={addTask}>
            <input
              type="text"
              placeholder="เพิ่มงานใหม่..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <button type="submit" className="btn-add">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              เพิ่มงาน
            </button>
          </form>

          <div className="divider"></div>

          {/* Task List */}
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>กำลังโหลด...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">{tasks.length === 0 ? '⚡' : '🔍'}</span>
              <p>{tasks.length === 0 ? '// NO TASKS IN QUEUE — INITIALIZE YOUR FIRST PROTOCOL' : '// NO MATCHING RECORDS FOUND'}</p>
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task, index) => (
                <div
                  key={task._id}
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    className="task-checkbox"
                    onClick={() => toggleTask(task._id)}
                    aria-label={task.completed ? 'ยกเลิกเสร็จสิ้น' : 'ทำเครื่องหมายเสร็จสิ้น'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <span className="task-text" onClick={() => toggleTask(task._id)}>
                    {task.text || task.title || '(ไม่มีชื่องาน)'}
                  </span>
                  <button className="btn-delete" onClick={() => deleteTask(task._id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    ลบ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="app-footer">CYBERTASK v2.077 — NEURAL NETWORK PROTOCOL · MERN STACK</p>
      </main>

      {/* ===== RIGHT SIDEBAR ===== */}
      <aside className="sidebar sidebar-right">
        <div className="sidebar-card">
          <h3 className="sidebar-title">งานที่เหลือ</h3>
          <ProgressRing
            percent={pendingPercent}
            size={140}
            strokeWidth={12}
            label="ค้างอยู่"
            color="purple"
          />
          <MiniBarChart pending={pendingCount} done={doneCount} total={totalCount} />
        </div>

        <div className="sidebar-card">
          <h3 className="sidebar-title">💡 เคล็ดลับ</h3>
          <p className="sidebar-tip">คลิกที่ checkbox หรือข้อความเพื่อทำเครื่องหมายเสร็จสิ้น</p>
        </div>
      </aside>
    </div>
  );
}

export default App;
