import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';


const API = 'https://chinnapat-special-topics.onrender.com/tasks';
// const API = 'http://localhost:5000/tasks';


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
        title: '✓ task added',
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 1200,
        showConfirmButton: false,
        timerProgressBar: true,
        background: '#161b22',
        color: '#00ff41',
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
      title: 'confirm delete?',
      text: 'ต้องการลบข้อมูลนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4444',
      cancelButtonColor: '#30363d',
      confirmButtonText: 'delete',
      cancelButtonText: 'cancel',
      background: '#161b22',
      color: '#c9d1d9',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API}/${id}`);
        setTasks(tasks.filter(t => t._id !== id));
        Swal.fire({
          title: '✓ deleted',
          icon: 'success',
          toast: true,
          position: 'top-end',
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
          background: '#161b22',
          color: '#00ff41',
        });
      } catch (err) {
        console.error('ไม่สามารถลบงานได้:', err);
        Swal.fire({
          title: 'error',
          text: 'ไม่สามารถลบรายการได้',
          icon: 'error',
          background: '#161b22',
          color: '#ff4444',
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
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // ASCII progress bar
  const barLength = 20;
  const filledCount = Math.round((completionPct / 100) * barLength);
  const progressBar = '█'.repeat(filledCount) + '░'.repeat(barLength - filledCount);

  // Today's date
  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <h1 className="app-title">$ task.sh<span className="cursor-blink">_</span></h1>
        <p className="app-subtitle">{"> task management system v1.0"}</p>
      </div>

      {/* Date */}
      <p className="date-line">date: <span>{today}</span></p>

      {/* Stats */}
      <div className="stats-line">
        <div className="stat">total: <span className="stat-val total">{totalCount}</span></div>
        <div className="stat">pending: <span className="stat-val pending">{pendingCount}</span></div>
        <div className="stat">done: <span className="stat-val done">{doneCount}</span></div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <span className="progress-label">progress:</span>
        <span className="progress-bar-ascii">[{progressBar}]</span>
        <span className={`progress-pct ${completionPct === 100 ? 'complete' : ''}`}>{completionPct}%</span>
      </div>

      <div className="card">
        {/* Search */}
        <div className="search-bar">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="grep ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>all</button>
          <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>pending</button>
          <button className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>done</button>
        </div>

        {/* Add Task */}
        <form className="input-area" onSubmit={addTask}>
          <input
            type="text"
            placeholder="$ add new task ..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button type="submit" className="btn-add">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            add
          </button>
        </form>

        <div className="divider"></div>

        {/* Task List */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>loading...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">{tasks.length === 0 ? '>' : '?'}</span>
            <p>{tasks.length === 0 ? '> no tasks found. add your first task.' : '> no matching results.'}</p>
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
              >
                <button
                  className="task-checkbox"
                  onClick={() => toggleTask(task._id)}
                  aria-label={task.completed ? 'ยกเลิกเสร็จสิ้น' : 'ทำเครื่องหมายเสร็จสิ้น'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <span className="task-text" onClick={() => toggleTask(task._id)}>
                  {task.text || task.title || '(no title)'}
                </span>
                <button className="btn-delete" onClick={() => deleteTask(task._id)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  rm
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="app-footer">[user@task.sh ~]$ <span className="cursor-blink">_</span></p>
    </div>
  );
}

export default App;
