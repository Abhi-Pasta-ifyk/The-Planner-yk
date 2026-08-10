import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useAccent } from '../AccentContext'; 

const AnnualGoals = () => {
  const { themeClasses } = useAccent(); 

  // --- YEAR LOGIC ---
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  const prevYear = () => setCurrentYear(prev => prev - 1);
  const nextYear = () => setCurrentYear(prev => prev + 1);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // --- REACTIVE LOCAL STATE ---
  const rawGoals = useLiveQuery(() => db.goals.toArray());
  const loading = rawGoals === undefined;

  // We use local state for the inputs to prevent UI stutter while typing
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    if (rawGoals) {
      setGoals(rawGoals.filter(g => g.timeframe === 'Annual'));
    }
  }, [rawGoals]);

  // --- ACTIONS ---
  const handleAddSlot = async (month) => {
    const period = `${month}-${currentYear}`;
    const newId = await db.goals.add({
      title: '', 
      timeframe: 'Annual',
      period: period,
      status: 'Pending'
    });
    
    // Optimistically add to UI so user can start typing immediately
    setGoals(prev => [...prev, { id: newId, title: '', timeframe: 'Annual', period, status: 'Pending' }]);
  };

  const handleTextChange = (id, newText) => {
    // Update local state instantly for smooth typing
    setGoals(prev => prev.map(g => g.id === id ? { ...g, title: newText } : g));
  };

  const handleTextBlur = async (id, finalTitle) => {
    // Sync to Dexie when the user clicks away
    await db.goals.update(id, { title: finalTitle });
  };

  const handleDeleteSlot = async (id) => {
    // Optimistic UI update
    setGoals(prev => prev.filter(g => g.id !== id));
    await db.goals.delete(id);
  };

  const slotColors = ['border-slate-800 dark:border-slate-500', 'border-indigo-500', 'border-orange-500', 'border-red-500', 'border-emerald-500', 'border-purple-500'];

  const isCurrentMonth = (monthName, year) => {
    const today = new Date();
    const currentMonthName = today.toLocaleString('default', { month: 'long' });
    return monthName === currentMonthName && year === today.getFullYear();
  };

  if (loading && goals.length === 0) return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Annual Goals...</div>;

  return (
    <div className="w-full pt-12 pb-16">
      
      {/* HEADER */}
      <header className="mb-10 transition-colors">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2 uppercase">Macro Planning</h2>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">Annual Goals</h1>
          
          {/* Year Toggler */}
          <div className="flex items-center gap-3 ml-6 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
            <button 
              onClick={prevYear} 
              className={`p-1.5 rounded-md bg-transparent opacity-50 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all ${themeClasses.text}`}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-extrabold text-slate-800 dark:text-slate-100 text-lg w-16 text-center transition-colors">{currentYear}</span>
            <button 
              onClick={nextYear} 
              className={`p-1.5 rounded-md bg-transparent opacity-50 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all ${themeClasses.text}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* 4-COLUMN GRID */}
      <div className="grid grid-cols-4 gap-6">
        
        {months.map((month) => {
          const todayFlag = isCurrentMonth(month, currentYear);
          const periodKey = `${month}-${currentYear}`;
          const monthGoals = goals.filter(g => g.period === periodKey);

          return (
            <div key={month} className="flex flex-col gap-4">
              
              {/* Month Header Pill */}
              <div className={`py-3 text-center rounded-xl shadow-sm border font-bold text-sm transition-colors ${
                todayFlag 
                  ? `${themeClasses.primary} border-transparent text-white` 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-gray-100 dark:border-slate-800'
              }`}>
                {month}
              </div>

              {/* Dynamic Editable Blocks */}
              {monthGoals.map((goal, slotIndex) => {
                const colorClass = slotColors[slotIndex % slotColors.length];

                return (
                  <div 
                    key={goal.id} 
                    className={`group relative bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 h-24 border-l-4 transition-all focus-within:shadow-md ${colorClass}`}
                  >
                    <textarea
                      value={goal.title}
                      onChange={(e) => handleTextChange(goal.id, e.target.value)}
                      onBlur={(e) => handleTextBlur(goal.id, e.target.value)} 
                      onFocus={(e) => e.target.select()} 
                      placeholder="Add milestone..."
                      spellCheck="false"
                      className="w-full h-full resize-none bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:font-medium pr-5 transition-colors"
                    />
                    
                    {/* Hover Delete Button */}
                    <button 
                      onClick={() => handleDeleteSlot(goal.id)}
                      title="Remove Slot"
                      className="absolute top-2 right-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 rounded p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              
              {/* Add New Container Button */}
              <button 
                onClick={() => handleAddSlot(month)}
                className={`group flex items-center justify-center w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 transition-all ${
                  monthGoals.length === 0 ? 'opacity-100' : 'opacity-0 hover:opacity-100 focus:opacity-100'
                }`}
              >
                <Plus size={18} className={`opacity-40 group-hover:opacity-100 transition-opacity ${themeClasses.text}`} />
              </button>

            </div>
          );
        })}

      </div>
    </div>
  );
};

export default AnnualGoals;