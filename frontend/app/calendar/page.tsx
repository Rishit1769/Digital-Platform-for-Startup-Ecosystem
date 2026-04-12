'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

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
