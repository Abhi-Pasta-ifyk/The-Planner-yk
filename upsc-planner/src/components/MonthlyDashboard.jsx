import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import HabitTracker from './HabitTracker';
import API from '../api'; 
import { useAccent } from '../AccentContext'; // <-- Import accent hook

const MonthlyDashboard = () => {
  const { themeClasses } = useAccent(); // <-- Destructure global theme

  // --- DYNAMIC DATE LOGIC ---
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }); 

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; 

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOffset = new Date(year, month, 1).getDay(); 

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  // --- DATABASE STATE ---
  const [objectives, setObjectives] = useState([]);
  const [calendarData, setCalendarData] = useState({ studiedDays: [], notes: {} });
  const [loading, setLoading] = useState(true);
  const [newObjective, setNewObjective] = useState('');

  // Fetch both Goals and Calendar Data when the month changes
  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      try {
        const [goalsRes, calendarRes] = await Promise.all([
          API.get('/goals'),
          API.get(`/monthly-records/${monthKey}`)
        ]);

        const monthGoals = goalsRes.data.filter(g => g.timeframe === 'Monthly' && g.period === monthKey);
        
        setObjectives(monthGoals);
        setCalendarData({
          studiedDays: calendarRes.data.studiedDays || [],
          notes: calendarRes.data.notes || {}
        });

      } catch (err) {
        console.error("Failed to fetch monthly data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMonthData();
  }, [monthKey]);

  // --- ACTIONS (CALENDAR) ---
  const toggleStudiedDay = async (day) => {
    const updatedDays = calendarData.studiedDays.includes(day)
      ? calendarData.studiedDays.filter(d => d !== day)
      : [...calendarData.studiedDays, day];
    
    setCalendarData(prev => ({ ...prev, studiedDays: updatedDays }));
    
    try {
      await API.put(`/monthly-records/${monthKey}`, { 
        studiedDays: updatedDays, 
        notes: calendarData.notes 
      });
    } catch (err) {
      console.error("Failed to sync calendar day:", err);
    }
  };

  const handleNoteChange = (day, text) => {
    setCalendarData(prev => ({
      ...prev,
      notes: { ...prev.notes, [day]: text }
    }));
  };

  const handleNoteBlur = async () => {
    try {
      await API.put(`/monthly-records/${monthKey}`, calendarData);
    } catch (err) {
      console.error("Failed to sync calendar notes:", err);
    }
  };

  // --- ACTIONS (OBJECTIVES / GOALS) ---
  const handleAddObjective = async (e) => {
    e.preventDefault();
    if (!newObjective.trim()) return;
    
    try {
      const response = await API.post('/goals', {
        title: newObjective,
        timeframe: 'Monthly',
        period: monthKey,
        status: 'Pending'
      });
      setObjectives([...objectives, response.data]);
      setNewObjective('');
    } catch (err) {
      console.error("Failed to add objective:", err);
    }
  };

  const toggleObjective = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Achieved' ? 'Pending' : 'Achieved';
    setObjectives(prev => prev.map(obj => obj._id === id ? { ...obj, status: newStatus } : obj));
    try {
      await API.put(`/goals/${id}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update objective status:", err);
    }
  };

  const deleteObjective = async (id) => {
    setObjectives(prev => prev.filter(obj => obj._id !== id));
    try {
      await API.delete(`/goals/${id}`);
    } catch (err) {
      console.error("Failed to delete objective:", err);
    }
  };

  // --- RENDER CALENDAR ---
  const renderCalendarDays = () => {
    const days = [];
    
    for (let i = 0; i < startDayOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isStudied = calendarData.studiedDays.includes(i);
      const todayFlag = isToday(i);
      const currentNote = calendarData.notes[i] || '';
      
      days.push(
        <div 
          key={i} 
          onClick={() => toggleStudiedDay(i)}
          className={`h-24 flex flex-col p-2.5 rounded-xl border cursor-pointer transition-all relative group ${
            isStudied ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50' : 'bg-white dark:bg-slate-800/30 border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600'
          } ${todayFlag ? 'ring-2 ring-slate-800 dark:ring-slate-400 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs font-bold ${isStudied ? 'text-green-700 dark:text-green-400' : todayFlag ? 'text-slate-800 dark:text-slate-200' : 'text-gray-400 dark:text-gray-500'}`}>
              {i}
            </span>
            {isStudied && <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm mt-0.5"></div>}
          </div>

          <textarea
             value={currentNote}
             onChange={(e) => handleNoteChange(i, e.target.value)}
             onBlur={handleNoteBlur} 
             onClick={(e) => e.stopPropagation()} 
             placeholder="Add note..."
             spellCheck="false"
             className={`w-full h-full resize-none bg-transparent outline-none text-[10px] font-medium leading-snug overflow-hidden 
              placeholder:opacity-0 group-hover:placeholder:opacity-100 focus:placeholder:opacity-100 transition-opacity
              ${isStudied ? 'text-green-800 dark:text-green-300 placeholder:text-green-600/40 dark:placeholder:text-green-500/40' : 'text-gray-600 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600'}`}
          />
        </div>
      );
    }
    return days;
  };

  const currentHours = calendarData.studiedDays.length * 8;
  const targetHours = 240;
  const hourPercent = Math.min(Math.round((currentHours / targetHours) * 100), 100);

  if (loading) return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Monthly Plan from database...</div>;

  return (
    <div className="w-full pt-12 pb-16">
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">{monthName} {year}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className={`p-2 bg-white dark:bg-slate-900 rounded-md shadow-sm border border-gray-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 hover:${themeClasses.text}`}><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className={`p-2 bg-white dark:bg-slate-900 rounded-md shadow-sm border border-gray-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 hover:${themeClasses.text}`}><ChevronRight size={20} /></button>
        </div>
      </header>

      {/* CALENDAR GRID */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 transition-colors">
         <div className="grid grid-cols-7 gap-4 mb-4 text-center text-xs font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">
           <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
         </div>
         <div className="grid grid-cols-7 gap-3">
            {renderCalendarDays()}
         </div>
      </div>

      {/* HABIT TRACKER */}
      <HabitTracker monthKey={monthKey} daysInMonth={daysInMonth} monthName={monthName} />

      <div className="grid grid-cols-3 gap-6 mt-6">
        
        {/* MONTHLY HOURS VISUAL */}
        <div className="col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Monthly Hours Goal</h3>
          <div className="flex items-end gap-2 mb-4 mt-auto">
            <span className="text-5xl font-extrabold text-green-600 dark:text-green-400">{currentHours}</span>
            <span className="text-gray-400 dark:text-gray-500 font-medium mb-1">/ {targetHours} hrs</span>
          </div>
          <div>
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 mb-2 transition-colors">
              <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${hourPercent}%` }}></div>
            </div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 text-right uppercase tracking-widest">{hourPercent}% Achieved</p>
          </div>
        </div>

        {/* DYNAMIC OBJECTIVES LIST */}
        <div className="col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Monthly Objectives</h3>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {objectives.filter(o => o.status === 'Achieved').length} / {objectives.length} Done
            </span>
          </div>
          
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 mb-4">
            {objectives.length > 0 ? objectives.map((obj) => (
              <div key={obj._id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-slate-800">
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => toggleObjective(obj._id, obj.status)}
                >
                  <button className={`transition-colors ${obj.status === 'Achieved' ? 'text-green-600 dark:text-green-500' : 'text-gray-300 dark:text-gray-600'}`}>
                    {obj.status === 'Achieved' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <p className={`text-sm font-medium transition-all ${obj.status === 'Achieved' ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                    {obj.title}
                  </p>
                </div>
                <button onClick={() => deleteObjective(obj._id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            )) : (
              <div className="text-center py-4 text-sm text-gray-400 dark:text-gray-500">No objectives set for this month.</div>
            )}
          </div>

          {/* Add Objective Form */}
          <form onSubmit={handleAddObjective} className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 transition-colors">
            <div className={`p-1.5 rounded transition-colors ${themeClasses.bgLight} ${themeClasses.text}`}><Plus size={16} /></div>
            <input 
              type="text" 
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-colors"
              placeholder="Add a new monthly objective..."
            />
            <button type="submit" disabled={!newObjective.trim()} className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors ${themeClasses.primary}`}>
              Save Goal
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default MonthlyDashboard;