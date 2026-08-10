import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db'; // <-- Import local Dexie DB
import { Flame, Target, Zap, Activity, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAccent } from '../AccentContext'; 

const Dashboard = ({ user }) => { 
  const { themeClasses, accent } = useAccent(); 

  const accentHex = { 
    indigo: '#6366f1', emerald: '#10b981', rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4' 
  }[accent] || '#6366f1';

  // --- REACTIVE LOCAL DATABASE QUERIES ---
  const rawSubjects = useLiveQuery(() => db.subjects.toArray());
  const rawMonthlyRecords = useLiveQuery(() => db.monthlyRecords.toArray());
  const rawPlannerItems = useLiveQuery(() => db.planner.toArray());
  
  const loading = rawSubjects === undefined || rawMonthlyRecords === undefined || rawPlannerItems === undefined;

  const subjects = rawSubjects || [];
  const monthlyRecords = rawMonthlyRecords || [];
  const plannerItems = rawPlannerItems || [];

  const targetExamDate = new Date(localStorage.getItem('targetDate') || '2027-05-28'); 

  // --- DATA PROCESSING ---
  const studiedSet = new Set();
  monthlyRecords.forEach(record => {
    if (record.studiedDays) {
      record.studiedDays.forEach(day => {
        studiedSet.add(`${record.dateKey || record.monthKey}-${String(day).padStart(2, '0')}`);
      });
    }
  });

  let currentStreak = 0;
  let tempDate = new Date();
  while (true) {
    const dStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
    // Support both format mappings depending on how they were saved in the monthly tracker
    const alternateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
    
    if (studiedSet.has(dStr) || studiedSet.has(alternateStr)) {
      currentStreak++;
      tempDate.setDate(tempDate.getDate() - 1);
    } else {
      if (currentStreak === 0 && tempDate.toDateString() === new Date().toDateString()) {
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  let chaptersDone = 0;
  subjects.forEach(sub => {
    sub.books?.forEach(book => {
      chaptersDone += book.chapters?.filter(c => c.status === 'Done').length || 0;
    });
  });
  
  const totalFocusHours = studiedSet.size * 8;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const allDueActions = [];
  plannerItems.forEach(item => {
    ['rev1', 'rev2', 'rev3'].forEach(rev => {
      if (item[rev] && !item[rev].done && item[rev].date) {
        const revDate = new Date(item[rev].date);
        if (revDate <= today) {
          allDueActions.push({ 
            ...item, 
            dueRev: rev, 
            dateObj: revDate,
            subject: item.subject || 'General' 
          });
        }
      }
    });
  });
  
  allDueActions.sort((a, b) => a.dateObj - b.dateObj);
  const nextActions = allDueActions.slice(0, 3);
  const pendingTasksTotal = allDueActions.length;

  const daysUntilExam = Math.ceil((targetExamDate - new Date()) / (1000 * 60 * 60 * 24));

  const generateHeatmap = () => {
    const weeks = [];
    const heatmapStart = new Date();
    heatmapStart.setDate(heatmapStart.getDate() - 364);
    heatmapStart.setDate(heatmapStart.getDate() - heatmapStart.getDay());

    let iterDate = new Date(heatmapStart);
    const rightNow = new Date();

    for (let w = 0; w < 52; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = `${iterDate.getFullYear()}-${String(iterDate.getMonth() + 1).padStart(2, '0')}-${String(iterDate.getDate()).padStart(2, '0')}`;
        const isStudied = studiedSet.has(dateStr);
        const isFuture = iterDate > rightNow;

        let color = isFuture ? 'bg-transparent' : 'bg-gray-200 dark:bg-slate-800';
        if (isStudied) color = 'bg-green-500'; 

        days.push(
          <div 
            key={`${w}-${d}`} 
            className={`w-3 h-3 rounded-sm ${color} transition-all ${isStudied ? 'hover:ring-2 hover:ring-green-700 cursor-pointer shadow-sm' : ''}`} 
            title={isFuture ? '' : dateStr}
          />
        );
        iterDate.setDate(iterDate.getDate() + 1);
      }
      weeks.push(<div key={w} className="flex flex-col gap-1">{days}</div>);
    }
    return weeks;
  };

  const colorMap = {
    'bg-red-500': '#ef4444', 'bg-blue-500': '#3b82f6', 'bg-green-500': '#22c55e',
    'bg-indigo-500': '#6366f1', 'bg-purple-500': '#a855f7', 'bg-orange-500': '#f97316',
    'bg-yellow-500': '#eab308', 'bg-pink-500': '#ec4899', 'bg-teal-500': '#14b8a6'
  };

  const donutData = subjects
    .map(sub => {
      let done = 0;
      sub.books?.forEach(b => { done += b.chapters?.filter(c => c.status === 'Done').length || 0; });
      return { name: sub.name, value: done, fill: colorMap[sub.color] || '#cbd5e1' };
    })
    .filter(item => item.value > 0);

  if (loading) return <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium">Booting Command Center...</div>;

  const displayName = localStorage.getItem('upsc_user_name') || user?.name?.split(' ')[0] || 'Scholar';

  return (
    <div className="w-full pt-12 pb-16">
      
      {/* HEADER */}
      <header className="flex justify-between items-end mb-8 border-b-2 border-gray-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-1 uppercase">Overview</h2>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight transition-colors">
            Welcome back, {displayName}.
          </h1>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#f4f1eb] dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex items-center gap-4 hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl"><Flame size={24} /></div>
          <div>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-slate-100">{currentStreak} Days</p>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Streak</p>
          </div>
        </div>
        
        <div className="bg-[#f4f1eb] dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Target size={24} /></div>
          <div>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-slate-100">{chaptersDone}</p>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chapters Done</p>
          </div>
        </div>
        
        <div className="bg-[#f4f1eb] dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex items-center gap-4 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl"><Zap size={24} /></div>
          <div>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-slate-100">{totalFocusHours} hrs</p>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Focus Time</p>
          </div>
        </div>
        
        <div className={`bg-[#f4f1eb] dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex items-center gap-4 transition-colors hover:${themeClasses.border}`}>
          <div className={`p-3 rounded-xl ${themeClasses.bgLight} ${themeClasses.text}`}><Activity size={24} /></div>
          <div>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-slate-100">{pendingTasksTotal}</p>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Actions</p>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: Heatmap & Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        
        {/* HEATMAP */}
        <div className="lg:col-span-3 bg-[#f4f1eb] dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Consistency Heatmap</h3>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{studiedSet.size} days logged</span>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-4 hide-scrollbar">
            {generateHeatmap()}
          </div>
          <div className="flex justify-end items-center gap-2 mt-2 text-xs font-semibold text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-slate-800"></div>
            <div className="w-3 h-3 rounded-sm bg-green-500 opacity-50"></div>
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            <span>More</span>
          </div>
        </div>

        {/* EXAM COUNTDOWN */}
        <div className="lg:col-span-1 bg-slate-800 dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-700 dark:border-slate-800 text-white flex flex-col justify-center items-center text-center relative overflow-hidden transition-colors">
          <div 
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-40 transition-colors"
            style={{ backgroundColor: accentHex }}
          ></div>
          <Calendar size={32} className={`mb-4 transition-colors ${themeClasses.text}`} />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Target Exam</h3>
          <p className="text-5xl font-black mb-2">{Math.max(0, daysUntilExam)}</p>
          <p className="text-sm font-medium text-slate-400">Days Remaining</p>
        </div>

      </div>

      {/* BOTTOM ROW: Analytics & Mini-Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DONUT CHART */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6">Subject Distribution</h3>
          {donutData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie 
                    data={donutData} 
                    innerRadius={70} 
                    outerRadius={90} 
                    paddingAngle={5} 
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                    itemStyle={{ fontWeight: 'bold', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 font-medium text-center mt-4">Based on chapters completed</p>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-sm text-gray-400 text-center">
               Complete some chapters to see your breakdown.
             </div>
          )}
        </div>

        {/* NEXT ACTIONS FEED */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Zap size={20} className="text-orange-500" /> Immediate Actions
            </h3>
            <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full uppercase tracking-wider transition-colors">
              High Priority
            </span>
          </div>

          {nextActions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {nextActions.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-gray-200 dark:border-slate-600 flex items-center justify-center font-bold text-sm transition-colors ${themeClasses.text}`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 transition-colors ${themeClasses.text}`}>{item.subject}</p>
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{item.topic}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400 font-medium uppercase">Task Type</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.dueRev.toUpperCase()} Revision</p>
                    </div>
                    <button className="p-2 text-gray-300 dark:text-gray-600 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all group-hover:translate-x-1">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={48} className="text-green-400 mb-4" />
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">All caught up!</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">You have no pending revisions due today.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;