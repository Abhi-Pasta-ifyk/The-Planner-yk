import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import API from '../api'; 
import { useAccent } from '../AccentContext'; // <-- Import the accent hook

const AnnualGoals = () => {
  const { themeClasses } = useAccent(); // <-- Destructure the dynamic classes

  // --- YEAR LOGIC ---
  const [currentYear, setCurrentYear] = useState(2026);

  const prevYear = () => setCurrentYear(prev => prev - 1);
  const nextYear = () => setCurrentYear(prev => prev + 1);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // --- DATABASE STATE ---
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await API.get('/goals');
        const annualGoals = response.data.filter(g => g.timeframe === 'Annual');
        setGoals(annualGoals);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch annual goals:", err);
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  // --- ACTIONS ---
  const handleAddSlot = async (month) => {
    const period = `${month}-${currentYear}`;
    try {
      const response = await API.post('/goals', {
        title: 'New Milestone', 
        timeframe: 'Annual',
        period: period,
        status: 'Pending'
      });
      setGoals([...goals, response.data]);
    } catch (err) {
      console.error("Failed to create goal:", err);
      alert("Failed to add milestone to database.");
    }
  };

  const handleTextChange = (id, newText) => {
    setGoals(prev => prev.map(g => g._id === id ? { ...g, title: newText } : g));
  };

  const handleTextBlur = async (id, finalTitle) => {
    try {
      await API.put(`/goals/${id}`, { title: finalTitle });
    } catch (err) {
      console.error("Failed to sync goal update:", err);
    }
  };

  const handleDeleteSlot = async (id) => {
    setGoals(prev => prev.filter(g => g._id !== id));
    try {
      await API.delete(`/goals/${id}`);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const slotColors = ['border-slate-800 dark:border-slate-500', 'border-indigo-500', 'border-orange-500', 'border-red-500', 'border-emerald-500', 'border-purple-500'];

  const isCurrentMonth = (monthName, year) => {
    const today = new Date();
    const currentMonthName = today.toLocaleString('default', { month: 'long' });
    return monthName === currentMonthName && year === today.getFullYear();
  };

  if (loading) return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Annual Goals from database...</div>;

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
                  ? `${themeClasses.primary} border-transparent` 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-gray-100 dark:border-slate-800'
              }`}>
                {month}
              </div>

              {/* Dynamic Editable Blocks */}
              {monthGoals.map((goal, slotIndex) => {
                const colorClass = slotColors[slotIndex % slotColors.length];

                return (
                  <div 
                    key={goal._id} 
                    className={`group relative bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 h-24 border-l-4 transition-all focus-within:shadow-md ${colorClass}`}
                  >
                    <textarea
                      value={goal.title}
                      onChange={(e) => handleTextChange(goal._id, e.target.value)}
                      onBlur={(e) => handleTextBlur(goal._id, e.target.value)} 
                      onFocus={(e) => e.target.select()} 
                      placeholder="Add milestone..."
                      spellCheck="false"
                      className="w-full h-full resize-none bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:font-medium pr-5 transition-colors"
                    />
                    
                    {/* Hover Delete Button */}
                    <button 
                      onClick={() => handleDeleteSlot(goal._id)}
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