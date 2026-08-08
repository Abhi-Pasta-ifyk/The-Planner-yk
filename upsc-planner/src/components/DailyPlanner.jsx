import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import API from '../api'; 
import { useAccent } from '../AccentContext'; // <-- Import accent hook

const DailyPlanner = () => {
  const { themeClasses } = useAccent(); // <-- Destructure global theme

  // --- DATE LOGIC ---
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

  // --- DATABASE STATE ---
  const [tasks, setTasks] = useState([]); 
  const [dailyData, setDailyData] = useState({ schedule: [], notes: '' }); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyData = async () => {
      setLoading(true);
      try {
        const [tasksRes, dailyRes] = await Promise.all([
          API.get(`/tasks?date=${dateKey}`),
          API.get(`/daily-records/${dateKey}`)
        ]);

        setTasks(tasksRes.data);
        setDailyData({
          schedule: dailyRes.data.schedule || [],
          notes: dailyRes.data.notes || ''
        });
      } catch (err) {
        console.error("Failed to fetch daily data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDailyData();
  }, [dateKey]);

  // --- ACTIONS: SCHEDULE & NOTES ---
  const syncDailyRecord = async (updatedData) => {
    try {
      await API.put(`/daily-records/${dateKey}`, updatedData);
    } catch (err) {
      console.error("Failed to sync daily record:", err);
    }
  };

  const handleScheduleChange = (id, field, value) => {
    setDailyData(prev => ({
      ...prev,
      schedule: prev.schedule.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addScheduleBlock = () => {
    const newBlock = { id: Date.now().toString(), time: '', task: '' };
    const updatedData = { ...dailyData, schedule: [...dailyData.schedule, newBlock] };
    setDailyData(updatedData);
    syncDailyRecord(updatedData);
  };

  const deleteScheduleBlock = (id) => {
    const updatedData = { ...dailyData, schedule: dailyData.schedule.filter(item => item.id !== id) };
    setDailyData(updatedData);
    syncDailyRecord(updatedData);
  };

  const handleNotesChange = (e) => {
    setDailyData(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleDailyRecordBlur = () => {
    syncDailyRecord(dailyData);
  };

  // --- ACTIONS: TODOS ---
  const handleTodoChange = (id, value) => {
    setTasks(prev => prev.map(t => t._id === id ? { ...t, text: value } : t));
  };

  const syncTodoBlur = async (id, value) => {
    try {
      await API.put(`/tasks/${id}`, { text: value });
    } catch (err) {
      console.error("Failed to sync todo text:", err);
    }
  };

  const toggleTodo = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
    try {
      await API.put(`/tasks/${id}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to sync todo status:", err);
    }
  };

  const addTodo = async () => {
    try {
      const response = await API.post('/tasks', { 
        text: '', 
        date: dateKey,
        status: 'Pending'
      });
      setTasks([...tasks, response.data]);
    } catch (err) {
      console.error("Failed to add todo:", err);
    }
  };

  const deleteTodo = async (id) => {
    setTasks(prev => prev.filter(t => t._id !== id));
    try {
      await API.delete(`/tasks/${id}`);
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  const completedTodos = tasks.filter(t => t.status === 'Completed').length;
  const totalTodos = tasks.length;

  if (loading) return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Daily Plan from database...</div>;

  return (
    <div className="w-full pt-12 pb-16">
      
      {/* HEADER WITH TIME TRAVEL */}
      <header className="flex justify-between items-end mb-10 border-b-2 border-gray-200/50 dark:border-slate-800 pb-4">
        <div>
          <h2 className={`text-xs font-bold tracking-widest mb-1 uppercase transition-colors ${isToday() ? themeClasses.text : 'text-gray-400 dark:text-gray-500'}`}>
            {isToday() ? 'Today' : displayDay}
          </h2>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">{displayDate}</h1>
        </div>
        
        <div className="flex gap-2">
          <button onClick={prevDay} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200">
            <ChevronLeft size={22} />
          </button>
          <button onClick={nextDay} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200">
            <ChevronRight size={22} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* LEFT COLUMN: TIME BLOCKING (60%) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock size={18} className={themeClasses.text} /> Schedule
            </h3>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{dailyData.schedule.length} Blocks</span>
          </div>

          <div className="flex flex-col gap-3">
            {dailyData.schedule.map((block) => (
              <div key={block.id} className="group flex items-stretch bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-all focus-within:ring-2 focus-within:border-transparent">
                {/* Time Input */}
                <div className="w-32 bg-slate-50 dark:bg-slate-800/50 border-r border-gray-100 dark:border-slate-800 p-4">
                  <input 
                    type="text" 
                    value={block.time} 
                    onChange={(e) => handleScheduleChange(block.id, 'time', e.target.value)}
                    onBlur={handleDailyRecordBlur}
                    placeholder="00:00 - 00:00"
                    className="w-full bg-transparent outline-none text-xs font-bold text-slate-600 dark:text-slate-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 text-center"
                  />
                </div>
                {/* Task Input */}
                <div className="flex-1 p-4 flex items-center relative">
                  <input 
                    type="text" 
                    value={block.task} 
                    onChange={(e) => handleScheduleChange(block.id, 'task', e.target.value)}
                    onBlur={handleDailyRecordBlur}
                    placeholder="What are you studying?"
                    className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 pr-8"
                  />
                  <button 
                    onClick={() => deleteScheduleBlock(block.id)}
                    className="absolute right-4 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={addScheduleBlock}
              className={`flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all ${themeClasses.text} ${dailyData.schedule.length === 0 ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <Plus size={18} /> Add Time Block
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PRIORITIES & NOTES (40%) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* TO-DO LIST */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Top Priorities</h3>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{completedTodos}/{totalTodos} Done</span>
            </div>

            <div className="flex flex-col gap-1 mb-4">
              {tasks.map(task => (
                <div key={task._id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-gray-100 dark:hover:border-slate-800 transition-colors">
                  <button onClick={() => toggleTodo(task._id, task.status)} className={`${task.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'} transition-colors shrink-0`}>
                    {task.status === 'Completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <input 
                    type="text" 
                    value={task.text} 
                    onChange={(e) => handleTodoChange(task._id, e.target.value)}
                    onBlur={(e) => syncTodoBlur(task._id, e.target.value)}
                    placeholder="New priority..."
                    className={`flex-1 bg-transparent outline-none text-sm transition-all ${task.status === 'Completed' ? 'text-gray-400 dark:text-gray-500 line-through font-medium' : 'text-slate-700 dark:text-slate-200 font-semibold'}`}
                  />
                  <button onClick={() => deleteTodo(task._id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={addTodo}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors hover:opacity-80 ${themeClasses.bgLight} ${themeClasses.text}`}
            >
              <Plus size={16} /> Add Task
            </button>
          </div>

          {/* BRAIN DUMP / NOTES */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex-1 flex flex-col min-h-[250px] transition-colors">
             <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4">Brain Dump</h3>
             <textarea 
               value={dailyData.notes}
               onChange={handleNotesChange}
               onBlur={handleDailyRecordBlur}
               placeholder="Jot down important formulas, thoughts, or things to review later..."
               spellCheck="false"
               className="flex-1 w-full resize-none bg-transparent outline-none text-sm font-medium text-slate-600 dark:text-slate-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 leading-relaxed"
             />
          </div>

        </div>

      </div>
    </div>
  );
};

export default DailyPlanner;