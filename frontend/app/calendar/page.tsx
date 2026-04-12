'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/axios';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// ─── Meeting Kanban ────────────────────────────────────────────────────────────

function DraggableCard({ event }: { event: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });
  
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  
  const colorMap: any = {
    pending: 'bg-yellow-100 border-yellow-300',
    confirmed: 'bg-teal-100 border-teal-300',
    office_hour: 'bg-purple-100 border-purple-300',
    completed: 'bg-gray-100 border-gray-300',
  };

  const bg = event.type === 'office_hour' ? colorMap['office_hour'] : colorMap[event.status] || 'bg-white';

  return (
    <div 
      ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={`p-3 rounded-xl border ${bg} ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''} shadow-sm text-sm cursor-grab active:cursor-grabbing mb-2`}
    >
      <div className="font-bold text-gray-900 line-clamp-1">{event.title}</div>
      <div className="text-gray-600 font-medium mt-1 truncate">with {event.with}</div>
    </div>
  );
}

function DroppableLane({ id, title, events }: { id: string, title: string, events: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div className="flex-1 mt-2">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div 
        ref={setNodeRef} 
        className={`min-h-[100px] p-2 rounded-xl transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200' : 'bg-gray-50 dark:bg-gray-800'}`}
      >
        {events.map(ev => <DraggableCard key={ev.id} event={ev} />)}
      </div>
    </div>
  );
}

function MeetingKanban() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchEvents(); }, [weekOffset]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calendar/events');
      setEvents(res.data.data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const currentWeekDays = () => {
    const start = new Date();
    start.setHours(0,0,0,0);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1 + (weekOffset * 7));
    return Array.from({length: 7}).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      return { isoDate, dayStr: d.toLocaleDateString('en-US', { weekday: 'short' }), dateStr: d.getDate() };
    });
  };

  const getEventsForLane = (isoDate: string, status: string) => {
    return events.filter(e => {
      if (e.type === 'office_hour' && status === 'confirmed') return e.date.startsWith(isoDate);
      if (e.type === 'office_hour') return false;
      return e.date.startsWith(isoDate) && e.status === status;
    });
  };

  const handleDragEnd = async (e: any) => {
    setActiveEvent(null);
    const { active, over } = e;
    if (!over) return;
    const parts = (over.id as string).split('|');
    if (parts.length !== 2) return;
    const targetStatus = parts[1];
    const ev = active.data.current;
    if (ev.type === 'meeting' && ev.status !== targetStatus && targetStatus === 'confirmed' && ev.status === 'pending') {
      try {
        const slots = JSON.parse(ev.original_data.proposed_slots);
        const slot = slots.length > 0 ? slots[0] : new Date().toISOString();
        await api.patch(`/meetings/${ev.original_data.id}/confirm`, { confirmed_slot: slot });
        fetchEvents();
      } catch(err) { alert('Failed to confirm meeting.'); }
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-blue-600">Loading...</div>;
  const days = currentWeekDays();

  return (
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Drag pending meetings to 'Confirmed' to lock them in.</p>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          <button onClick={()=>setWeekOffset(v=>v-1)} className="px-4 py-2 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg dark:text-white text-sm">&lt; Prev</button>
          <button onClick={()=>setWeekOffset(0)} className="px-4 py-2 font-bold dark:text-white text-sm">Today</button>
          <button onClick={()=>setWeekOffset(v=>v+1)} className="px-4 py-2 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg dark:text-white text-sm">Next &gt;</button>
        </div>
      </div>
      <DndContext sensors={sensors} onDragStart={e => setActiveEvent(e.active.data.current)} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-x-auto gap-4 pb-10">
          {days.map(d => (
            <div key={d.isoDate} className="flex-1 min-w-[260px] bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl flex flex-col pt-4 border border-gray-100 dark:border-gray-700/50 overflow-hidden">
              <div className="px-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-center">
                <div className="text-xs font-bold text-gray-500 uppercase">{d.dayStr}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{d.dateStr}</div>
              </div>
              <div className="flex flex-col flex-1 p-2 gap-4 overflow-y-auto">
                <DroppableLane id={`${d.isoDate}|pending`} title="Pending" events={getEventsForLane(d.isoDate, 'pending')} />
                <DroppableLane id={`${d.isoDate}|confirmed`} title="Confirmed / Mentoring" events={getEventsForLane(d.isoDate, 'confirmed')} />
              </div>
            </div>
          ))}
        </div>
        <DragOverlay>{activeEvent ? <DraggableCard event={activeEvent} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── Task Kanban ───────────────────────────────────────────────────────────────

const COLUMNS: { id: string; label: string; color: string; dot: string }[] = [
  { id: 'todo',        label: 'To Do',       color: 'border-t-gray-400',   dot: 'bg-gray-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-t-blue-500',   dot: 'bg-blue-500' },
  { id: 'review',      label: 'In Review',   color: 'border-t-yellow-500', dot: 'bg-yellow-500' },
  { id: 'done',        label: 'Done',        color: 'border-t-green-500',  dot: 'bg-green-500' },
  { id: 'blocked',     label: 'Blocked',     color: 'border-t-red-500',    dot: 'bg-red-500' },
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  high:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  low:    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

function TaskCard({ task, onMove, onDelete, onEdit }: { task: any; onMove: (id: number, status: string) => void; onDelete: (id: number) => void; onEdit: (task: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `task-${task.id}`, data: task });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 shadow-sm cursor-grab active:cursor-grabbing mb-2 ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : 'hover:shadow-md'} transition`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug flex-1">{task.title}</p>
        <div className="flex gap-1 shrink-0" onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => onEdit(task)} className="p-1 text-gray-400 hover:text-blue-500 transition rounded">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500 transition rounded">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
        {task.due_date && (
          <span className="text-xs text-gray-400">{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        )}
      </div>
    </div>
  );
}

function TaskColumn({ col, tasks, onMove, onDelete, onEdit, onAdd }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div className={`flex flex-col flex-1 min-w-[240px] bg-white dark:bg-gray-800/60 rounded-2xl border-t-4 ${col.color} border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden`}>
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
          <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">{col.label}</h3>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAdd(col.id)}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-lg font-bold leading-none"
          title={`Add task to ${col.label}`}
        >
          +
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto min-h-[200px] transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      >
        {tasks.map((t: any) => (
          <TaskCard key={t.id} task={t} onMove={onMove} onDelete={onDelete} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && (
          <div className="text-xs text-gray-400 text-center mt-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl py-4">Drop tasks here</div>
        )}
      </div>
    </div>
  );
}

function TaskModal({ initial, onSave, onClose }: { initial?: any; onSave: (data: any) => void; onClose: () => void }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [priority, setPriority] = useState(initial?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initial?.due_date ? initial.due_date.split('T')[0] : '');
  const [status, setStatus] = useState(initial?.status || 'todo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() || null, priority, status, due_date: dueDate || null });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white">{initial ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none">
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition">{initial ? 'Update' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskKanban() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; initial?: any; defaultStatus?: string }>({ open: false });
  const [activeTask, setActiveTask] = useState<any>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calendar/tasks');
      setTasks(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async (data: any) => {
    try {
      if (modal.initial) {
        await api.put(`/calendar/tasks/${modal.initial.id}`, data);
      } else {
        await api.post('/calendar/tasks', { ...data, status: data.status || modal.defaultStatus || 'todo' });
      }
      await fetchTasks();
      setModal({ open: false });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/calendar/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleDragEnd = async (e: any) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const task = active.data.current;
    const newStatus = over.id as string;
    if (!COLUMNS.find(c => c.id === newStatus) || task.status === newStatus) return;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/calendar/tasks/${task.id}/move`, { status: newStatus });
    } catch (e) {
      console.error(e);
      fetchTasks(); // Revert on error
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-blue-600">Loading tasks...</div>;

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Drag cards between columns to update their status.</p>
        <button
          onClick={() => setModal({ open: true, defaultStatus: 'todo' })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> New Task
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={e => setActiveTask(e.active.data.current)} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-10">
          {COLUMNS.map(col => (
            <TaskColumn
              key={col.id}
              col={col}
              tasks={tasks.filter(t => t.status === col.id)}
              onMove={() => {}}
              onDelete={handleDelete}
              onEdit={(t: any) => setModal({ open: true, initial: t })}
              onAdd={(status: string) => setModal({ open: true, defaultStatus: status })}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 shadow-xl text-sm font-semibold text-gray-900 dark:text-white w-60 opacity-90">
              {activeTask.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {modal.open && (
        <TaskModal
          initial={modal.initial}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'meetings'>('tasks');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">📋 Kanban Board</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your tasks and schedule meetings</p>
          </div>
          {/* Tab switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'tasks' ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              📋 Task Board
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'meetings' ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              🗓️ Meeting Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
        {activeTab === 'tasks' ? <TaskKanban /> : <MeetingKanban />}
      </div>
    </div>
  );
}


// --- Subcomponents ---
function DraggableCard({ event }: { event: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });
  
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  
  const colorMap: any = {
    pending: 'bg-yellow-100 border-yellow-300',
    confirmed: 'bg-teal-100 border-teal-300',
    office_hour: 'bg-purple-100 border-purple-300',
    completed: 'bg-gray-100 border-gray-300',
  };

  const bg = event.type === 'office_hour' ? colorMap['office_hour'] : colorMap[event.status] || 'bg-white';

  return (
    <div 
      ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={`p-3 rounded-xl border \${bg} \${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''} shadow-sm text-sm cursor-grab active:cursor-grabbing mb-2`}
    >
      <div className="font-bold text-gray-900 line-clamp-1">{event.title}</div>
      <div className="text-gray-600 font-medium mt-1 truncate">with {event.with}</div>
    </div>
  );
}

function DroppableLane({ id, title, events }: { id: string, title: string, events: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div className="flex-1 mt-2">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div 
        ref={setNodeRef} 
        className={`min-h-[100px] p-2 rounded-xl transition-colors \${isOver ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200' : 'bg-gray-50 dark:bg-gray-800'}`}
      >
        {events.map(ev => <DraggableCard key={ev.id} event={ev} />)}
      </div>
    </div>
  );
}

export default function KanbanCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeEvent, setActiveEvent] = useState<any>(null);

  useEffect(() => {
    fetchEvents();
  }, [weekOffset]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calendar/events');
      setEvents(res.data.data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const currentWeekDays = () => {
    const start = new Date();
    start.setHours(0,0,0,0);
    const day = start.getDay() || 7; // Sunday is 0 -> 7
    start.setDate(start.getDate() - day + 1 + (weekOffset * 7)); // Shift to Monday
    
    return Array.from({length: 7}).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      return { 
        isoDate,
        dayStr: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.getDate()
      };
    });
  };

  const getEventsForLane = (isoDate: string, status: string) => {
    return events.filter(e => {
      if (e.type === 'office_hour' && status === 'confirmed') return e.date.startsWith(isoDate);
      if (e.type === 'office_hour') return false;
      return e.date.startsWith(isoDate) && e.status === status;
    });
  };

  const handleDragStart = (e: any) => {
    setActiveEvent(e.active.data.current);
  };

  const handleDragEnd = async (e: any) => {
    setActiveEvent(null);
    const { active, over } = e;
    if (!over) return;
    
    // id looks like `lane-YYYY-MM-DD-status`
    const laneId = over.id as string;
    const parts = laneId.split('|');
    if (parts.length !== 2) return;
    const targetStatus = parts[1];

    const ev = active.data.current;
    
    // Only support meeting status changes (pending -> confirmed)
    if (ev.type === 'meeting' && ev.status !== targetStatus) {
      if (targetStatus === 'confirmed' && ev.status === 'pending') {
        // Technically need a slot, we'll auto-pick the first proposed slot or the drag date for MVP
        try {
           const slots = JSON.parse(ev.original_data.proposed_slots);
           const slot = slots.length > 0 ? slots[0] : new Date().toISOString();
           await api.patch(`/meetings/\${ev.original_data.id}/confirm`, { confirmed_slot: slot });
           fetchEvents();
        } catch(err) { alert('Failed to confirm meeting.'); }
      }
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-blue-600">Loading Calendar...</div>;

  const days = currentWeekDays();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-800">
         <div>
           <h1 className="text-2xl font-bold dark:text-white">Kanban Calendar</h1>
           <p className="text-gray-500 text-sm">Drag pending meetings to 'Confirmed' to lock them in.</p>
         </div>
         <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
           <button onClick={()=>setWeekOffset(v=>v-1)} className="px-4 py-2 font-bold hover:bg-gray-200 rounded-lg dark:text-white">&lt; Prev</button>
           <button onClick={()=>setWeekOffset(0)} className="px-4 py-2 font-bold dark:text-white">Current Week</button>
           <button onClick={()=>setWeekOffset(v=>v+1)} className="px-4 py-2 font-bold hover:bg-gray-200 rounded-lg dark:text-white">Next &gt;</button>
         </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-x-auto p-4 gap-4 pb-20">
          {days.map(d => (
            <div key={d.isoDate} className="flex-1 min-w-[280px] bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl flex flex-col pt-4 border border-gray-100 dark:border-gray-700/50 overflow-hidden">
               <div className="px-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-center">
                 <div className="text-sm font-bold text-gray-500 uppercase">{d.dayStr}</div>
                 <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{d.dateStr}</div>
               </div>
               
               <div className="flex flex-col flex-1 p-2 gap-4 overflow-y-auto">
                 <DroppableLane id={`\${d.isoDate}|pending`} title="Pending" events={getEventsForLane(d.isoDate, 'pending')} />
                 <DroppableLane id={`\${d.isoDate}|confirmed`} title="Confirmed / Mentoring" events={getEventsForLane(d.isoDate, 'confirmed')} />
               </div>
            </div>
          ))}
        </div>
        
        <DragOverlay>
          {activeEvent ? <DraggableCard event={activeEvent} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
