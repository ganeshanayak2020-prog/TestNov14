import React, { useEffect, useMemo, useState } from 'react';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const dateFromISO = (s) => {
  if (!s) return null;
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
};
const prettyDate = (s, options={ day:'numeric', month:'short', year:'numeric' }) => {
  const d = dateFromISO(s);
  return d ? d.toLocaleDateString(undefined, options) : 'No due date';
};
const initialTasks = [
  { id: 1, title: 'Plan the week', description: 'Review priorities and set a clear focus for the week.', dueDate: todayISO(), priority: 'High', completed: false, createdAt: Date.now() },
  { id: 2, title: 'Review project updates', description: 'Collect updates and identify blockers.', dueDate: '', priority: 'Medium', completed: false, createdAt: Date.now() },
  { id: 3, title: 'Organise your task list', description: 'A little organisation goes a long way.', dueDate: todayISO(), priority: 'Low', completed: true, createdAt: Date.now() }
];
const loadTasks = () => {
  try {
    const saved = localStorage.getItem('taskflow-tasks-v1');
    return saved ? JSON.parse(saved) : initialTasks;
  } catch { return initialTasks; }
};
const statusOf = (task) => {
  if (task.completed) return 'Completed';
  if (!task.dueDate) return 'No due date';
  if (task.dueDate < todayISO()) return 'Overdue';
  if (task.dueDate === todayISO()) return 'Due today';
  return 'Upcoming';
};

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [view, setView] = useState('Overview');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({ title:'', description:'', dueDate:todayISO(), priority:'Medium' });
  const [toast, setToast] = useState('');

  useEffect(() => localStorage.setItem('taskflow-tasks-v1', JSON.stringify(tasks)), [tasks]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => {
    const active = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    const overdue = active.filter(t => t.dueDate && t.dueDate < todayISO());
    const dueToday = active.filter(t => t.dueDate === todayISO());
    const upcoming = active.filter(t => t.dueDate && t.dueDate > todayISO());
    const noDate = active.filter(t => !t.dueDate);
    const total = tasks.length;
    return { total, completed:completed.length, pending:active.length, overdue:overdue.length, dueToday:dueToday.length, upcoming:upcoming.length, noDate:noDate.length, rate: total ? Math.round(completed.length/total*100) : 0 };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return tasks.filter(t => {
      const s = statusOf(t);
      const matchesFilter = filter === 'All' || (filter === 'Pending' ? !t.completed : filter === 'Completed' ? t.completed : filter === 'Overdue' ? s === 'Overdue' : filter === 'Due today' ? s === 'Due today' : s === 'Upcoming');
      const matchesSearch = `${t.title} ${t.description}`.toLowerCase().includes(search.toLowerCase());
      const matchesDate = view === 'Calendar' && selectedDate ? t.dueDate === selectedDate : true;
      return matchesFilter && matchesSearch && matchesDate;
    }).sort((a,b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, filter, search, view, selectedDate]);

  const openNew = (date='') => {
    setEditing(null);
    setForm({ title:'', description:'', dueDate:date || todayISO(), priority:'Medium' });
    setModalOpen(true);
  };
  const openEdit = (task) => {
    setEditing(task);
    setForm({ title:task.title, description:task.description || '', dueDate:task.dueDate || '', priority:task.priority || 'Medium' });
    setModalOpen(true);
  };
  const saveTask = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editing) {
      setTasks(prev => prev.map(t => t.id === editing.id ? { ...t, ...form, title:form.title.trim() } : t));
      setToast('Task updated');
    } else {
      setTasks(prev => [{ ...form, title:form.title.trim(), id:Date.now(), completed:false, createdAt:Date.now() }, ...prev]);
      setToast('Task added');
    }
    setModalOpen(false);
  };
  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed:!t.completed, completedAt:!t.completed ? Date.now() : null } : t));
  };
  const deleteTask = (id) => {
    if (window.confirm('Delete this task? This cannot be undone.')) {
      setTasks(prev => prev.filter(t => t.id !== id));
      setToast('Task deleted');
    }
  };
  const changeMonth = (delta) => setMonth(new Date(month.getFullYear(), month.getMonth()+delta, 1));
  const monthLabel = month.toLocaleDateString(undefined, { month:'long', year:'numeric' });
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const calendarCells = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth}, (_,i)=>i+1)];
  const tasksForDay = (day) => {
    const key = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return tasks.filter(t => t.dueDate === key);
  };
  const selectedLabel = selectedDate ? prettyDate(selectedDate, { weekday:'long', day:'numeric', month:'long' }) : '';

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">✓</div><span>taskflow</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {[['Overview','▦'],['My tasks','☷'],['Calendar','▦']].map(([name,icon]) =>
          <button key={name} className={`nav-item ${view===name?'active':''}`} onClick={()=>{setView(name);setSelectedDate('');setFilter('All');}}>
            <span className="nav-icon">{icon}</span>{name}
            {name==='My tasks' && <span className="nav-count">{stats.pending}</span>}
          </button>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="tip-card"><div className="tip-icon">✦</div><strong>Small steps add up.</strong><p>Stay focused, finish what matters, and celebrate your progress.</p></div>
        <div className="profile"><div className="avatar">Y</div><div><strong>Your workspace</strong><span>Personal account</span></div><span className="dots">···</span></div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="breadcrumb">Workspace <span>/</span> <strong>{view}</strong></div>
        <div className="top-actions"><span className="today-chip">◷ &nbsp;{prettyDate(todayISO(),{weekday:'short',day:'numeric',month:'short'})}</span><button className="primary-btn small" onClick={()=>openNew()}>＋ <span>New task</span></button></div>
      </header>

      <section className="page">
        {view === 'Overview' && <>
          <div className="page-heading"><div><div className="eyebrow">YOUR PERSONAL DASHBOARD</div><h1>Good things happen when you get things done.</h1><p>Here's a snapshot of your tasks and progress.</p></div><button className="primary-btn" onClick={()=>openNew()}>＋ Add a task</button></div>
          <div className="stats-grid">
            <StatCard label="Total tasks" value={stats.total} sub="All tasks in your list" icon="▤" tone="blue"/>
            <StatCard label="Due today" value={stats.dueToday} sub="Need your attention today" icon="◷" tone="amber"/>
            <StatCard label="Overdue" value={stats.overdue} sub="Past their due date" icon="↗" tone="rose"/>
            <StatCard label="Completed" value={stats.completed} sub={`${stats.rate}% completion rate`} icon="✓" tone="green"/>
          </div>
          <div className="overview-grid">
            <section className="panel progress-panel">
              <div className="panel-heading"><div><h2>Your progress</h2><p>A little progress each day adds up.</p></div><span className="period-tag">ALL TIME</span></div>
              <div className="progress-main"><div className="progress-ring" style={{'--progress':`${stats.rate*3.6}deg`}}><div><strong>{stats.rate}%</strong><span>complete</span></div></div><div className="progress-copy"><strong>{stats.completed} of {stats.total} tasks completed</strong><p>{stats.rate===100 && stats.total ? 'Amazing work — everything is complete!' : stats.rate>=70 ? 'You’re making great progress. Keep it up!' : 'Keep moving forward, one task at a time.'}</p></div></div>
              <div className="progress-breakdown"><ProgressRow label="Completed" value={stats.completed} total={stats.total} color="green"/><ProgressRow label="Pending" value={stats.pending} total={stats.total} color="blue"/><ProgressRow label="Overdue" value={stats.overdue} total={stats.total} color="rose"/></div>
            </section>
            <section className="panel attention-panel">
              <div className="panel-heading"><div><h2>Task breakdown</h2><p>Know what needs your attention.</p></div><span className="sparkle">✧</span></div>
              <BreakdownRow color="amber" label="Due today" value={stats.dueToday}/>
              <BreakdownRow color="rose" label="Overdue" value={stats.overdue}/>
              <BreakdownRow color="blue" label="Upcoming" value={stats.upcoming}/>
              <BreakdownRow color="gray" label="No due date" value={stats.noDate}/>
            </section>
          </div>
          <section className="panel task-panel">
            <div className="panel-heading"><div><h2>Tasks to focus on</h2><p>Your open tasks, ordered by due date.</p></div><button className="text-btn" onClick={()=>{setView('My tasks');setFilter('Pending');}}>View all tasks →</button></div>
            <TaskList tasks={tasks.filter(t=>!t.completed).sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')).slice(0,5)} onToggle={toggleTask} onEdit={openEdit} onDelete={deleteTask} empty="You're all caught up. Add a task to get started."/>
          </section>
        </>}

        {view === 'My tasks' && <>
          <div className="page-heading"><div><div className="eyebrow">STAY ON TOP OF IT</div><h1>My tasks</h1><p>Organise your work and keep things moving.</p></div><button className="primary-btn" onClick={()=>openNew()}>＋ Add a task</button></div>
          <div className="list-toolbar"><div className="filter-tabs">{['All','Pending','Completed','Overdue','Due today','Upcoming'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f}{f==='All'&&<span>{stats.total}</span>}</button>)}</div><div className="search-box"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks..."/></div></div>
          <section className="panel task-panel"><div className="panel-heading"><div><h2>{filter} tasks</h2><p>{visibleTasks.length} {visibleTasks.length===1?'task':'tasks'} found</p></div></div><TaskList tasks={visibleTasks} onToggle={toggleTask} onEdit={openEdit} onDelete={deleteTask} empty="No tasks here. Try another filter or add a new task."/></section>
        </>}

        {view === 'Calendar' && <>
          <div className="page-heading"><div><div className="eyebrow">PLAN AHEAD</div><h1>Calendar</h1><p>See your deadlines and plan your time.</p></div><button className="primary-btn" onClick={()=>openNew(selectedDate)}>＋ Add a task</button></div>
          <div className="calendar-layout">
            <section className="panel calendar-panel">
              <div className="calendar-head"><div><h2>{monthLabel}</h2><p>Select a date to see its tasks.</p></div><div className="month-nav"><button onClick={()=>changeMonth(-1)} aria-label="Previous month">‹</button><button onClick={()=>setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1))}>Today</button><button onClick={()=>changeMonth(1)} aria-label="Next month">›</button></div></div>
              <div className="calendar-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div className="weekday" key={d}>{d}</div>)}
                {calendarCells.map((day,i)=>{
                  if(!day) return <div className="calendar-cell blank" key={`b${i}`}/>;
                  const key=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const dayTasks=tasksForDay(day);
                  const isToday=key===todayISO();
                  return <button key={key} className={`calendar-cell ${isToday?'today':''} ${selectedDate===key?'chosen':''}`} onClick={()=>setSelectedDate(selectedDate===key?'':key)}>
                    <span className="day-number">{day}</span>{dayTasks.slice(0,2).map(t=><span key={t.id} className={`calendar-event ${t.completed?'done':''}`}>{t.title}</span>)}{dayTasks.length>2&&<span className="more-events">+{dayTasks.length-2} more</span>}
                  </button>;
                })}
              </div>
              <div className="calendar-legend"><span><i className="legend-dot blue-dot"/> Tasks</span><span><i className="legend-dot green-dot"/> Completed</span><span><i className="legend-dot amber-dot"/> Today</span></div>
            </section>
            <section className="panel agenda-panel"><div className="panel-heading"><div><h2>{selectedDate?selectedLabel:'Upcoming deadlines'}</h2><p>{selectedDate?'Tasks scheduled for this day':'Your next tasks with a due date'}</p></div></div>
              <TaskList tasks={(selectedDate?visibleTasks:tasks.filter(t=>!t.completed&&t.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,7))} onToggle={toggleTask} onEdit={openEdit} onDelete={deleteTask} empty={selectedDate?'No tasks due on this date.':'No upcoming deadlines.'}/>
              {selectedDate&&<button className="clear-date" onClick={()=>setSelectedDate('')}>Clear date selection</button>}
            </section>
          </div>
        </>}
        <footer>TaskFlow <span>•</span> Your tasks stay on this device <span>•</span> Made for getting things done</footer>
      </section>
    </main>

    {modalOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModalOpen(false);}}>
      <form className="task-modal" onSubmit={saveTask}>
        <div className="modal-top"><div><div className="eyebrow">{editing?'MAKE AN UPDATE':'MAKE IT HAPPEN'}</div><h2>{editing?'Edit task':'Create a task'}</h2><p>{editing?'Update the details of your task.':'Add a task and give it a deadline.'}</p></div><button type="button" className="close-btn" onClick={()=>setModalOpen(false)}>×</button></div>
        <label>Task name <span className="required">*</span><input autoFocus required maxLength="100" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Prepare project status report"/></label>
        <label>Description <span className="optional">OPTIONAL</span><textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Add a few details to help you later..."/></label>
        <div className="form-row"><label>Due date<input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/><span className="field-hint">Leave blank if this task has no deadline.</span></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label></div>
        <div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setModalOpen(false)}>Cancel</button><button className="primary-btn" type="submit">{editing?'Save changes':'Create task'}</button></div>
      </form>
    </div>}
    {toast&&<div className="toast">✓ &nbsp;{toast}</div>}
  </div>;
}

function StatCard({label,value,sub,icon,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div>; }
function ProgressRow({label,value,total,color}) { return <div className="progress-row"><div><span>{label}</span><strong>{value}</strong></div><div className="mini-track"><i className={color} style={{width:`${total?value/total*100:0}%`}}/></div></div>; }
function BreakdownRow({color,label,value}) { return <div className="breakdown-row"><span className={`breakdown-dot ${color}`}/><span>{label}</span><strong>{value}</strong></div>; }
function TaskList({tasks,onToggle,onEdit,onDelete,empty}) {
  if(!tasks.length) return <div className="empty-state"><div className="empty-icon">✓</div><strong>Nothing to show</strong><p>{empty}</p></div>;
  return <div className="task-list">{tasks.map(task=>{
    const status=statusOf(task);
    return <div className={`task-row ${task.completed?'is-complete':''}`} key={task.id}>
      <button className={`check-button ${task.completed?'checked':''}`} onClick={()=>onToggle(task.id)} aria-label={task.completed?'Mark as pending':'Mark as complete'}>{task.completed?'✓':''}</button>
      <div className="task-info"><strong>{task.title}</strong>{task.description&&<p>{task.description}</p>}<div className="task-meta"><span className={`priority ${task.priority?.toLowerCase()||'medium'}`}>{task.priority||'Medium'} priority</span>{task.dueDate&&<span className="due-meta">◷ {prettyDate(task.dueDate,{day:'numeric',month:'short'})}</span>}<span className={`status-pill ${status.toLowerCase().replaceAll(' ','-')}`}>{status}</span></div></div>
      <div className="task-actions"><button onClick={()=>onEdit(task)} title="Edit task" aria-label="Edit task">✎</button><button onClick={()=>onDelete(task.id)} title="Delete task" aria-label="Delete task">⌫</button></div>
    </div>;
  })}</div>;
}

export default App;