import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react';
import { db } from '../db'; // Local Database
import { useAccent } from '../AccentContext'; 

// --- DND-KIT IMPORTS ---
import { 
  DndContext, PointerSensor, useSensor, useSensors, 
  DragOverlay, defaultDropAnimationSideEffects, closestCorners
} from '@dnd-kit/core';
import { 
  SortableContext, arrayMove, verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ==========================================
// 1. SORTABLE TASK COMPONENT
// ==========================================
const SortableTask = ({ task, colorClass, handleTextChange, handleTextBlur, handleDeleteSlot }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div 
      ref={setNodeRef} style={style} 
      className={`group relative bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex overflow-hidden h-24 border-l-4 transition-all focus-within:shadow-md ${colorClass} ${isDragging ? 'ring-2 ring-indigo-500 z-10' : ''}`}
    >
      {/* DRAG HANDLE */}
      <div 
        {...attributes} {...listeners}
        className="w-6 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-grab active:cursor-grabbing border-r border-gray-100 dark:border-slate-800"
      >
        <GripVertical size={14} />
      </div>

      <div className="flex-1 p-2 relative">
        <textarea
          value={task.text}
          onChange={(e) => handleTextChange(task.id, e.target.value)}
          onBlur={(e) => handleTextBlur(task.id, e.target.value)} 
          placeholder="Plan here..." spellCheck="false"
          className="w-full h-full resize-none bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:font-medium pr-5 transition-colors"
        />
        <button 
          onClick={() => handleDeleteSlot(task.id)}
          title="Remove Slot"
          className="absolute top-1 right-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 rounded p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 2. MAIN WEEKLY PLANNER
// ==========================================
const WeeklyPlanner = () => {
  const { themeClasses } = useAccent(); 

  // --- DATE LOGIC ---
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    d.setDate(diff); // Fixed date calculation!
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    return d;
  });

  const prevWeek = () => { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d); };
  const nextWeek = () => { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d); };
  
  const formatYYYYMMDD = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const formatMonthDay = (date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const headerTitle = `${formatMonthDay(weekDates[0])} - ${formatMonthDay(weekDates[6])}, ${weekDates[6].getFullYear()}`;

  // --- STATE ---
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDragItem, setActiveDragItem] = useState(null);

  // --- LOAD DATA (DEXIE) ---
  useEffect(() => {
    const fetchWeeklyTasks = async () => {
      setLoading(true);
      const startDate = formatYYYYMMDD(weekDates[0]);
      const endDate = formatYYYYMMDD(weekDates[6]);

      // Fetch from local Dexie DB and sort by order
      const data = await db.tasks.where('date').between(startDate, endDate, true, true).toArray();
      setTasks(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    };
    fetchWeeklyTasks();
  }, [baseDate]); 

  // --- TASK ACTIONS ---
  const handleAddSlot = async (dateObj) => {
    const dateStr = formatYYYYMMDD(dateObj);
    const dayTasksCount = tasks.filter(t => t.date === dateStr).length;

    const newTask = { text: '', date: dateStr, order: dayTasksCount, status: 'Pending' };
    const id = await db.tasks.add(newTask);
    setTasks(prev => [...prev, { ...newTask, id }]);
  };

  const handleTextChange = (taskId, newText) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, text: newText } : t));
  };

  const handleTextBlur = async (taskId, finalText) => {
    await db.tasks.update(taskId, { text: finalText });
  };

  const handleDeleteSlot = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId)); 
    await db.tasks.delete(taskId);
  };

  // --- DND-KIT EVENT HANDLERS ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }) // Prevent accidental drags when clicking
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveDragItem(task);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Are we dragging over another task, or over an empty column?
    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Moving a task over another task
    if (isOverTask && activeId !== overId) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const overIndex = tasks.findIndex(t => t.id === overId);
        
        // If they are in different columns, update the active task's date to match the over task
        if (tasks[activeIndex].date !== tasks[overIndex].date) {
          const newTasks = [...tasks];
          newTasks[activeIndex].date = tasks[overIndex].date;
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Moving a task into an empty column
    if (isOverColumn) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        if (tasks[activeIndex].date !== overId) {
          const newTasks = [...tasks];
          newTasks[activeIndex].date = overId;
          return newTasks;
        }
        return tasks;
      });
    }
  };

  const handleDragEnd = async (event) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;

    // Identify which days were affected to recount their order indexes
    const affectedDates = new Set();
    const activeTask = tasks.find(t => t.id === active.id);
    if (activeTask) affectedDates.add(activeTask.date);

    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) affectedDates.add(overTask.date);
    else if (over.data.current?.type === 'Column') affectedDates.add(over.id);

    // 1. Recalculate order indexes for affected columns
    const updatedTasks = [...tasks];
    
    affectedDates.forEach(dateStr => {
      const dayTasks = updatedTasks.filter(t => t.date === dateStr);
      // Map over them exactly as they appear in the array right now to assign 0, 1, 2...
      dayTasks.forEach((t, index) => {
        const taskIndex = updatedTasks.findIndex(task => task.id === t.id);
        updatedTasks[taskIndex].order = index;
      });
    });

    setTasks(updatedTasks);

    // 2. Batch update the local Dexie database for the affected tasks
    const tasksToSave = updatedTasks.filter(t => affectedDates.has(t.date));
    await Promise.all(
      tasksToSave.map(t => db.tasks.update(t.id, { date: t.date, order: t.order }))
    );
  };

  const slotColors = ['border-slate-800 dark:border-slate-400', 'border-indigo-500', 'border-orange-500', 'border-red-500', 'border-emerald-500', 'border-purple-500'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  if (loading && tasks.length === 0) return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Weekly Plan...</div>;

  return (
    <div className="w-full pt-12 pb-16">
      
      {/* HEADER */}
      <header className="mb-10 transition-colors">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2 uppercase">Week at a glance</h2>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">{headerTitle}</h1>
          <div className="flex gap-2 ml-4">
            <button onClick={prevWeek} className={`p-1.5 bg-white dark:bg-slate-900 rounded-md shadow-sm border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:${themeClasses.text}`}><ChevronLeft size={20} /></button>
            <button onClick={nextWeek} className={`p-1.5 bg-white dark:bg-slate-900 rounded-md shadow-sm border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:${themeClasses.text}`}><ChevronRight size={20} /></button>
          </div>
        </div>
      </header>

      {/* DND CONTEXT WRAPPER */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners}
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-7 gap-4">
          
          {dayNames.map((dayName, dayIndex) => {
            const dateObj = weekDates[dayIndex];
            const todayFlag = isToday(dateObj);
            const dateStr = formatYYYYMMDD(dateObj);
            const dayTasks = tasks.filter(t => t.date === dateStr);
            const taskIds = dayTasks.map(t => t.id);

            return (
              <div key={dayName} className="flex flex-col gap-4">
                <div className={`py-3 text-center rounded-xl shadow-sm border font-bold text-sm transition-colors ${todayFlag ? `${themeClasses.primary} border-transparent text-white` : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-gray-100 dark:border-slate-800'}`}>
                  {dayName}
                  <div className={`text-[10px] font-medium mt-0.5 ${todayFlag ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>
                    {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* SORTABLE COLUMN CONTEXT */}
                <SortableContext id={dateStr} items={taskIds} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-4 min-h-[100px]">
                    {dayTasks.map((task, slotIndex) => (
                      <SortableTask 
                        key={task.id} 
                        task={{...task, type: 'Task'}} // Passing type for dragover logic
                        colorClass={slotColors[slotIndex % slotColors.length]}
                        handleTextChange={handleTextChange}
                        handleTextBlur={handleTextBlur}
                        handleDeleteSlot={handleDeleteSlot}
                      />
                    ))}
                  </div>
                </SortableContext>
                
                <button 
                  onClick={() => handleAddSlot(dateObj)}
                  className={`flex items-center justify-center w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-gray-400 dark:text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-slate-800 hover:${themeClasses.border} hover:${themeClasses.text} ${dayTasks.length === 0 ? 'opacity-100' : 'opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100'}`}
                >
                  <Plus size={18} />
                </button>
              </div>
            );
          })}

        </div>

        {/* GHOST ELEMENT FOR DRAGGING */}
        <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ sideEffects: ['opacity', 'scale'] })}>
          {activeDragItem ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-indigo-500 flex overflow-hidden h-24 opacity-90 scale-105">
              <div className="w-6 bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-indigo-500 border-r border-gray-100 dark:border-slate-600">
                <GripVertical size={14} />
              </div>
              <div className="flex-1 p-2">
                <textarea readOnly value={activeDragItem.text} className="w-full h-full resize-none bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200" />
              </div>
            </div>
          ) : null}
        </DragOverlay>

      </DndContext>
    </div>
  );
};

export default WeeklyPlanner;