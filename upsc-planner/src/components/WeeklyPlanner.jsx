import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import API from '../api'; 
import { useAccent } from '../AccentContext'; // <-- Import accent hook

const WeeklyPlanner = () => {
  const { themeClasses } = useAccent(); // <-- Destructure global theme

  // --- DATE LOGIC ---
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setHours(0, 0, 0, 0));
  });

  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    return d;
  });

  const prevWeek = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() - 7);
    setBaseDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + 7);
    setBaseDate(newDate);
  };

  const formatYYYYMMDD = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatMonthDay = (date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const headerTitle = `${formatMonthDay(weekDates[0])} - ${formatMonthDay(weekDates[6])}, ${weekDates[6].getFullYear()}`;

  // --- DATABASE STATE ---
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks for this specific week range
  useEffect(() => {
    const fetchWeeklyTasks = async () => {
      setLoading(true);
      const startDate = formatYYYYMMDD(weekDates[0]);
      const endDate = formatYYYYMMDD(weekDates[6]);

      try {
        const response = await API.get(`/tasks?startDate=${startDate}&endDate=${endDate}`);
        setTasks(response.data);
      } catch (err) {
        console.error("Failed to fetch weekly tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeeklyTasks();
  }, [baseDate]); 

  // --- ACTIONS ---
  const handleAddSlot = async (dateObj) => {
    const dateStr = formatYYYYMMDD(dateObj);
    const dayTasksCount = tasks.filter(t => t.date === dateStr).length;

    try {
      const response = await API.post('/tasks', { 
        text: '', 
        date: dateStr,
        order: dayTasksCount
      });
      setTasks([...tasks, response.data]);
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleTextChange = (taskId, newText) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, text: newText } : t));
  };

  const handleTextBlur = async (taskId, finalText) => {
    try {
      await API.put(`/tasks/${taskId}`, { text: finalText });
    } catch (err) {
      console.error("Failed to save task update:", err);
    }
  };

  const handleDeleteSlot = async (taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId)); 
    try {
      await API.delete(`/tasks/${taskId}`);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Slot colors modified slightly for dark mode contrast
  const slotColors = ['border-slate-800 dark:border-slate-400', 'border-indigo-500', 'border-orange-500', 'border-red-500', 'border-emerald-500', 'border-purple-500'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  if (loading) return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Weekly Plan from database...</div>;

  return (
    <div className="w-full pt-12 pb-16">
      
      {/* HEADER */}
      <header className="mb-10 transition-colors">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2 uppercase">Week at a glance</h2>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">{headerTitle}</h1>
          <div className="flex gap-2 ml-4">
            <button onClick={prevWeek} className={`p-1.5 bg-white dark:bg-slate-900 rounded-md shadow-sm border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:${themeClasses.text}`}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextWeek} className={`p-1.5 bg-white dark:bg-slate-900 rounded-md shadow-sm border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:${themeClasses.text}`}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* 7-COLUMN GRID */}
      <div className="grid grid-cols-7 gap-4">
        
        {dayNames.map((dayName, dayIndex) => {
          const dateObj = weekDates[dayIndex];
          const todayFlag = isToday(dateObj);
          const dateStr = formatYYYYMMDD(dateObj);
          
          const dayTasks = tasks.filter(t => t.date === dateStr);

          return (
            <div key={dayName} className="flex flex-col gap-4">
              
              {/* Day Header Pill */}
              <div className={`py-3 text-center rounded-xl shadow-sm border font-bold text-sm transition-colors ${
                todayFlag 
                  ? `${themeClasses.primary} border-transparent` 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-gray-100 dark:border-slate-800'
              }`}>
                {dayName}
                <div className={`text-[10px] font-medium mt-0.5 ${todayFlag ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>
                  {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>

              {/* Dynamic Editable Blocks */}
              {dayTasks.map((task, slotIndex) => {
                const colorClass = slotColors[slotIndex % slotColors.length];

                return (
                  <div 
                    key={task._id} 
                    className={`group relative bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-3 h-24 border-l-4 transition-all focus-within:shadow-md ${colorClass}`}
                  >
                    <textarea
                      value={task.text}
                      onChange={(e) => handleTextChange(task._id, e.target.value)}
                      onBlur={(e) => handleTextBlur(task._id, e.target.value)} 
                      onFocus={(e) => e.target.select()}
                      placeholder="Plan here..."
                      spellCheck="false"
                      className="w-full h-full resize-none bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:font-medium pr-5 transition-colors"
                    />
                    
                    {/* Hover Delete Button */}
                    <button 
                      onClick={() => handleDeleteSlot(task._id)}
                      title="Remove Slot"
                      className="absolute top-2 right-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-900/80 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
              
              {/* Add New Container Button */}
              <button 
                onClick={() => handleAddSlot(dateObj)}
                className={`flex items-center justify-center w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-gray-400 dark:text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-slate-800 hover:${themeClasses.border} hover:${themeClasses.text} ${
                  dayTasks.length === 0 ? 'opacity-100' : 'opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100'
                }`}
              >
                <Plus size={18} />
              </button>

            </div>
          );
        })}

      </div>
    </div>
  );
};

export default WeeklyPlanner;