const fs = require('fs');

fs.writeFileSync('./frontend/app/calendar/page.tsx', `'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

// ─── Meeting Kanban ────────────────────────────────────────────────────────────

function DraggableCard({ event }: { event: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const statusLabel: Record<string, string> = {
    pending: 'PENDING',
    confirmed: 'CONFIRMED',
    office_hour: 'OFFICE HOUR',
    completed: 'DONE',
  };
  const statusColor: Record<string, string> = {
    pending: 'bg-[#F7941D] text-white',
    confirmed: 'bg-[#003580] text-white',
    office_hour: 'bg-[#1C1C1C] text-white',
    completed: 'bg-[#888888] text-white',
  };
  const key = event.type === 'office_hour' ? 'office_hour' : event.status;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={\`bg-white border-2 border-[#1C1C1C] p-3 mb-2 cursor-grab active:cursor-grabbing \${isDragging ? 'opacity-50' : ''}\`}
    >
      <div className={\`\${F.space} font-bold text-[#1C1C1C] text-sm line-clamp-1\`}>{event.title}</div>
      <div className={\`\${F.space} text-[#888888] text-xs mt-1 truncate\`}>with {event.with}</div>
      <div className={\`\${F.space} inline-block mt-2 text-[10px] font-bold tracking-[0.15em] px-2 py-0.5 \${statusColor[key] || 'bg-[#888888] text-white'}\`}>
        {statusLabel[key] || key?.toUpperCase()}
      </div>
    </div>
  );
}

function DroppableLane({ id, title, events, accent }: { id: string; title: string; events: any[]; accent: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="mt-2">
      <div className={\`\${F.space} text-[10px] font-bold tracking-[0.2em] uppercase mb-2 \${accent}\`}>{title}</div>
      <div
        ref={setNodeRef}
        className={\`min-h-[80px] p-2 border-2 transition-colors \${isOver ? 'border-[#F7941D] bg-[#FFF8F0]' : 'border-dashed border-[#CCCCCC] bg-[#F5F4F0]'}\`}
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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const currentWeekDays = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1 + weekOffset * 7);
    return Array.from({ length: 7 }).map((_, i) => {
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
        await api.patch(\`/meetings/\${ev.original_data.id}/confirm\`, { confirmed_slot: slot });
        fetchEvents();
      } catch (err) { alert('Failed to confirm meeting.'); }
    }
  };

  if (loading) return (
    <div className={\`\${F.space} text-center py-20 text-[#F7941D] font-bold tracking-[0.2em] uppercase\`}>Loading Calendar...</div>
  );

  const days = currentWeekDays();

  return (
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center mb-6">
        <p className={\`\${F.space} text-[#888888] text-sm\`}>Drag pending meetings to Confirmed to lock them in.</p>
        <div className="flex border-2 border-[#1C1C1C]">
          <button onClick={() => setWeekOffset(v => v - 1)} className={\`\${F.space} px-4 py-2 text-sm font-bold text-[#1C1C1C] border-r-2 border-[#1C1C1C] hover:bg-[#F5F4F0] transition\`}>&lt; Prev</button>
          <button onClick={() => setWeekOffset(0)} className={\`\${F.space} px-4 py-2 text-sm font-bold text-[#1C1C1C] border-r-2 border-[#1C1C1C] hover:bg-[#F5F4F0] transition\`}>Today</button>
          <button onClick={() => setWeekOffset(v => v + 1)} className={\`\${F.space} px-4 py-2 text-sm font-bold text-[#1C1C1C] hover:bg-[#F5F4F0] transition\`}>Next &gt;</button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={e => setActiveEvent(e.active.data.current)} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-x-auto gap-4 pb-10">
          {days.map(d => (
            <div key={d.isoDate} className="flex-1 min-w-[240px] bg-white border-2 border-[#1C1C1C] flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b-2 border-[#1C1C1C] bg-[#1C1C1C] text-center">
                <div className={\`\${F.space} text-[10px] font-bold tracking-[0.25em] uppercase text-[#F7941D]\`}>{d.dayStr}</div>
                <div className={\`\${F.bebas} text-3xl text-white tracking-wider leading-tight\`}>{d.dateStr}</div>
              </div>
              <div className="flex flex-col flex-1 p-3 gap-3 overflow-y-auto bg-[#F5F4F0]">
                <DroppableLane id={\`\${d.isoDate}|pending\`} title="Pending" events={getEventsForLane(d.isoDate, 'pending')} accent="text-[#F7941D]" />
                <DroppableLane id={\`\${d.isoDate}|confirmed\`} title="Confirmed" events={getEventsForLane(d.isoDate, 'confirmed')} accent="text-[#003580]" />
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

const COLUMNS: { id: string; label: string; accent: string }[] = [
  { id: 'todo',        label: 'To Do',       accent: 'border-t-[#888888]'  },
  { id: 'in_progress', label: 'In Progress', accent: 'border-t-[#003580]'  },
  { id: 'review',      label: 'In Review',   accent: 'border-t-[#F7941D]'  },
  { id: 'done',        label: 'Done',        accent: 'border-t-[#1C1C1C]'  },
  { id: 'blocked',     label: 'Blocked',     accent: 'border-t-red-600'    },
];

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-600 text-white',
  high:   'bg-[#F7941D] text-white',
  medium: 'bg-[#003580] text-white',
  low:    'bg-[#888888] text-white',
};

function TaskCard({ task, onDelete, onEdit }: { task: any; onDelete: (id: number) => void; onEdit: (task: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: \`task-\${task.id}\`, data: task });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={\`bg-white border-2 border-[#1C1C1C] p-3 mb-2 cursor-grab active:cursor-grabbing \${isDragging ? 'opacity-50' : ''} transition\`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={\`\${F.space} text-sm font-bold text-[#1C1C1C] leading-snug flex-1\`}>{task.title}</p>
        <div className="flex gap-1 shrink-0" onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => onEdit(task)} className="p-1 text-[#888888] hover:text-[#F7941D] transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 text-[#888888] hover:text-red-600 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
      {task.description && (
        <p className={\`\${F.serif} text-xs text-[#888888] mt-1 line-clamp-2 mb-2\`}>{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
        <span className={\`\${F.space} text-[10px] font-bold px-2 py-0.5 capitalize \${PRIORITY_BADGE[task.priority] || 'bg-[#888888] text-white'}\`}>{task.priority}</span>
        {task.due_date && (
          <span className={\`\${F.space} text-[10px] text-[#888888] font-bold\`}>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        )}
      </div>
    </div>
  );
}

function TaskColumn({ col, tasks, onDelete, onEdit, onAdd }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div className={\`flex flex-col flex-1 min-w-[230px] bg-white border-2 border-[#1C1C1C] border-t-4 \${col.accent} overflow-hidden\`}>
      <div className="px-4 pt-3 pb-3 border-b-2 border-[#1C1C1C] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <h3 className={\`\${F.space} font-bold text-[#1C1C1C] text-sm\`}>{col.label}</h3>
          <span className={\`\${F.space} text-[10px] font-bold bg-[#F5F4F0] border border-[#1C1C1C] px-2 py-0.5\`}>{tasks.length}</span>
        </div>
        <button
          onClick={() => onAdd(col.id)}
          className={\`\${F.space} w-6 h-6 flex items-center justify-center border-2 border-[#1C1C1C] text-[#1C1C1C] hover:bg-[#F7941D] hover:text-white hover:border-[#F7941D] transition font-bold text-lg leading-none\`}
          title={\`Add task to \${col.label}\`}
        >+</button>
      </div>
      <div
        ref={setNodeRef}
        className={\`flex-1 p-3 overflow-y-auto min-h-[200px] transition-colors \${isOver ? 'bg-[#FFF8F0]' : 'bg-[#F5F4F0]'}\`}
      >
        {tasks.map((t: any) => (
          <TaskCard key={t.id} task={t} onDelete={onDelete} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && (
          <div className={\`\${F.space} text-[11px] text-[#888888] text-center mt-6 border-2 border-dashed border-[#CCCCCC] py-4\`}>Drop tasks here</div>
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

  const inputCls = \`\${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]\`;
  const labelCls = \`\${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5\`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-[#1C1C1C] w-full max-w-md">
        <div className="bg-[#1C1C1C] px-6 py-4 flex items-center justify-between">
          <div>
            <div className={\`\${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5\`}>Board</div>
            <h2 className={\`\${F.display} text-white font-bold text-lg\`}>{initial ? 'Edit Task' : 'New Task'}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-[#F7941D] transition text-2xl leading-none font-bold">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Add more details..." className={\`\${inputCls} resize-none\`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={\`\${F.space} flex-1 py-2.5 border-2 border-[#1C1C1C] text-[#1C1C1C] text-sm font-bold hover:bg-[#F5F4F0] transition\`}>Cancel</button>
            <button type="submit" className={\`\${F.space} flex-1 py-2.5 bg-[#F7941D] border-2 border-[#1C1C1C] text-white text-sm font-bold hover:bg-[#e8850e] transition\`}>{initial ? 'Update' : 'Create Task'}</button>
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
        await api.put(\`/calendar/tasks/\${modal.initial.id}\`, data);
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
      await api.delete(\`/calendar/tasks/\${id}\`);
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
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await api.patch(\`/calendar/tasks/\${task.id}/move\`, { status: newStatus });
    } catch (e) { console.error(e); fetchTasks(); }
  };

  if (loading) return (
    <div className={\`\${F.space} text-center py-20 text-[#F7941D] font-bold tracking-[0.2em] uppercase\`}>Loading tasks...</div>
  );

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between mb-5">
        <p className={\`\${F.space} text-sm text-[#888888]\`}>Drag cards between columns to update their status.</p>
        <button
          onClick={() => setModal({ open: true, defaultStatus: 'todo' })}
          className={\`\${F.space} px-5 py-2.5 bg-[#F7941D] border-2 border-[#1C1C1C] text-white font-bold text-sm hover:bg-[#e8850e] transition flex items-center gap-2\`}
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
              onDelete={handleDelete}
              onEdit={(t: any) => setModal({ open: true, initial: t })}
              onAdd={(status: string) => setModal({ open: true, defaultStatus: status })}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className={\`\${F.space} bg-white border-2 border-[#1C1C1C] p-3 text-sm font-bold text-[#1C1C1C] w-56 opacity-90\`}>
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
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col">
      {/* Header */}
      <div className="bg-[#1C1C1C] border-b-2 border-[#1C1C1C]">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className={\`\${F.space} text-[10px] tracking-[0.3em] uppercase text-[#F7941D] mb-0.5\`}>Workspace</div>
            <h1 className={\`\${F.display} text-white font-bold text-2xl\`}>Kanban Board</h1>
            <p className={\`\${F.space} text-[#888888] text-xs mt-0.5\`}>Manage your tasks and schedule meetings</p>
          </div>
          <div className="flex border-2 border-white self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('tasks')}
              className={\`\${F.space} px-5 py-2.5 text-sm font-bold border-r-2 border-white transition \${activeTab === 'tasks' ? 'bg-white text-[#1C1C1C]' : 'bg-transparent text-white hover:bg-white/10'}\`}
            >
              Task Board
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={\`\${F.space} px-5 py-2.5 text-sm font-bold transition \${activeTab === 'meetings' ? 'bg-[#F7941D] text-white' : 'bg-transparent text-white hover:bg-white/10'}\`}
            >
              Meeting Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {activeTab === 'tasks' ? <TaskKanban /> : <MeetingKanban />}
      </div>
    </div>
  );
}
`, 'utf8');

console.log('calendar/page.tsx rewritten');
