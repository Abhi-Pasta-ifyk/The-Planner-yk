import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Circle, Clock, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAccent } from '../AccentContext'; 
import ExportPDFButton from './ExportPDFButton';

const DailyPlanner = () => {
  const { themeClasses } = useAccent(); 

  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const prevDay = () => setCurrentDate(new Date(currentDate.getTime() - 86400000));
  const nextDay = () => setCurrentDate(new Date(currentDate.getTime() + 86400000));

  const isToday = () => {
    const today = new Date();
    return currentDate.getDate() === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const formatYYYYMMDD = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const dateKey = formatYYYYMMDD(currentDate);
  const displayDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const displayDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

  // 🚨 FIXED: Manual state completely sanitizes the UI and prevents stuttering
  const [tasks, setTasks] = useState([]); 
  const [schedule, setSchedule] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Load data securely when date changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const t = await db.tasks.where('date').equals(dateKey).toArray();
      const d = await db.dailyRecords.get(dateKey);
      setTasks(t || []);
      if (d) {
        setSchedule(d.schedule || []);
        setNotes(d.notes || '');
      } else {
        setSchedule([]);
        setNotes('');
      }
      setLoading(false);
    };
    loadData();
  }, [dateKey]);

  // --- ACTIONS: SCHEDULE & NOTES ---
  const syncDailyRecord = async (updatedSchedule, updatedNotes) => {
    await db.dailyRecords.put({ date: dateKey, schedule: updatedSchedule, notes: updatedNotes });
  };

  const handleScheduleChange = (id, field, value) => {
    setSchedule(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addScheduleBlock = async () => {
    const newBlock = { id: Date.now().toString(), time: '', task: '' };
    const updated = [...schedule, newBlock];
    setSchedule(updated);
    await syncDailyRecord(updated, notes);
  };

  const deleteScheduleBlock = async (id) => {
    const updated = schedule.filter(item => item.id !== id);
    setSchedule(updated);
    await syncDailyRecord(updated, notes);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(schedule);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSchedule(items);
    await syncDailyRecord(items, notes);
  };

  // --- ACTIONS: TODOS (🚨 FIXED `id` usage) ---
  const addTodo = async () => {
    const newTask = { text: '', date: dateKey, status: 'Pending' };
    const newId = await db.tasks.add(newTask);
    setTasks([...tasks, { ...newTask, id: newId }]); 
  };

  const handleTodoChange = (id, value) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text: value } : t));
  };

  const syncTodoBlur = async (id, value) => {
    await db.tasks.update(Number(id), { text: value });
  };

  const toggleTodo = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await db.tasks.update(Number(id), { status: newStatus });
  };

  const deleteTodo = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await db.tasks.delete(Number(id));
  };

  const completedTodos = tasks.filter(t => t.status === 'Completed').length;
  const totalTodos = tasks.length;

  if (loading) return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Daily Plan...</div>;

  return (
    <div className="w-full pt-12 pb-16">
      
      <header className="flex justify-between items-end mb-10 border-b-2 border-gray-200/50 dark:border-slate-800 pb-4">
        <div>
          <h2 className={`text-xs font-bold tracking-widest mb-1 uppercase transition-colors ${isToday() ? themeClasses.text : 'text-gray-400 dark:text-gray-500'}`}>
            {isToday() ? 'Today' : displayDay}
          </h2>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">{displayDate}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <ExportPDFButton targetId="daily-planner-content" filename={`Study-Plan-${dateKey}.pdf`} />
          <div className="flex gap-2">
            <button onClick={prevDay} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"><ChevronLeft size={22} /></button>
            <button onClick={nextDay} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"><ChevronRight size={22} /></button>
          </div>
        </div>
      </header>

      <div id="daily-planner-content" className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Clock size={18} className={themeClasses.text} /> Schedule</h3>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{schedule.length} Blocks</span>
          </div>

          <div className="flex flex-col gap-3">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="schedule-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-3">
                    {schedule.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} className={`group flex items-stretch bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden transition-all focus-within:ring-2 focus-within:border-transparent ${snapshot.isDragging ? 'border-indigo-500/50 ring-2 ring-indigo-500/20 scale-[1.01] z-10' : 'border-gray-100 dark:border-slate-800'}`}>
                            <div {...provided.dragHandleProps} className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 pl-3 pr-2 text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-grab active:cursor-grabbing"><GripVertical size={18} /></div>
                            <div className="w-28 bg-slate-50 dark:bg-slate-800/50 border-r border-gray-100 dark:border-slate-800 p-4 pl-2">
                              <input 
                                type="text" value={block.time} 
                                onChange={(e) => handleScheduleChange(block.id, 'time', e.target.value)}
                                onBlur={() => syncDailyRecord(schedule, notes)}
                                placeholder="00:00 - 00:00"
                                className="w-full bg-transparent outline-none text-xs font-bold text-slate-600 dark:text-slate-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 text-center"
                              />
                            </div>
                            <div className="flex-1 p-4 flex items-center relative">
                              <input 
                                type="text" value={block.task} 
                                onChange={(e) => handleScheduleChange(block.id, 'task', e.target.value)}
                                onBlur={() => syncDailyRecord(schedule, notes)}
                                placeholder="What are you studying?"
                                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 pr-8"
                              />
                              <button onClick={() => deleteScheduleBlock(block.id)} className="absolute right-4 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <button onClick={addScheduleBlock} className={`flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all ${themeClasses.text} ${schedule.length === 0 ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}><Plus size={18} /> Add Time Block</button>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Top Priorities</h3>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{completedTodos}/{totalTodos} Done</span>
            </div>
            <div className="flex flex-col gap-1 mb-4">
              {tasks.map(task => (
                <div key={task.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-gray-100 dark:hover:border-slate-800 transition-colors">
                  <button onClick={() => toggleTodo(task.id, task.status)} className={`${task.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'} transition-colors shrink-0`}>
                    {task.status === 'Completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <input 
                    type="text" value={task.text} 
                    onChange={(e) => handleTodoChange(task.id, e.target.value)}
                    onBlur={(e) => syncTodoBlur(task.id, e.target.value)}
                    placeholder="New priority..."
                    className={`flex-1 bg-transparent outline-none text-sm transition-all ${task.status === 'Completed' ? 'text-gray-400 dark:text-gray-500 line-through font-medium' : 'text-slate-700 dark:text-slate-200 font-semibold'}`}
                  />
                  <button onClick={() => deleteTodo(task.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <button onClick={addTodo} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors hover:opacity-80 ${themeClasses.bgLight} ${themeClasses.text} text-white`}><Plus size={16} /> Add Task</button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex-1 flex flex-col min-h-[250px] transition-colors">
             <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4">Brain Dump</h3>
             <textarea 
               value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => syncDailyRecord(schedule, notes)}
               placeholder="Jot down important formulas, thoughts, or things to review later..." spellCheck="false"
               className="flex-1 w-full resize-none bg-transparent outline-none text-sm font-medium text-slate-600 dark:text-slate-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 leading-relaxed"
             />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DailyPlanner;