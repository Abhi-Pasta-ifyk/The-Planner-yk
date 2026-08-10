import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks'; // <-- Import Dexie hook
import { db } from '../db'; // <-- Import local database
import { Target, BookOpen, Clock, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAccent } from '../AccentContext'; 

const ProgressDashboard = () => {
  const { themeClasses, accent } = useAccent(); 

  const accentHex = { 
    indigo: '#6366f1', 
    emerald: '#10b981', 
    rose: '#f43f5e', 
    amber: '#f59e0b', 
    cyan: '#06b6d4' 
  }[accent] || '#6366f1';

  // --- LOCAL DATABASE REACTIVE QUERIES ---
  // These will automatically update the UI whenever data is saved to Dexie!
  const subjects = useLiveQuery(() => db.subjects.toArray());
  const monthlyRecords = useLiveQuery(() => db.monthlyRecords.toArray());
  const revisions = useLiveQuery(() => db.planner.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());

  // Dexie returns undefined while loading the initial chunk of data
  const loading = subjects === undefined || monthlyRecords === undefined || revisions === undefined || tasks === undefined;

  if (loading) {
    return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Crunching your local data...</div>;
  }

  // --- CALCULATIONS ---
  
  // 1. Syllabus Math
  let totalChapters = 0;
  let doneChapters = 0;
  let totalBooks = 0;

  subjects.forEach(sub => {
    totalBooks += sub.books?.length || 0;
    sub.books?.forEach(book => {
      totalChapters += book.chapters?.length || 0;
      doneChapters += book.chapters?.filter(c => c.status === 'Done').length || 0;
    });
  });

  const syllabusProgress = totalChapters === 0 ? 0 : Math.round((doneChapters / totalChapters) * 100);

  // 2. Study Time Math
  let totalStudiedDays = 0;
  monthlyRecords.forEach(record => {
    if (record.studiedDays) {
      totalStudiedDays += record.studiedDays.length;
    }
  });
  
  const estimatedHours = totalStudiedDays * 8; 

  // 3. Revision Math
  let pendingRevisions = 0;
  let doneRevisions = 0;
  revisions.forEach(row => {
    ['rev1', 'rev2', 'rev3'].forEach(rev => {
      if (row[rev]?.done) doneRevisions++;
      else pendingRevisions++;
    });
  });

  // Keep Mock data for Weekly Chart until daily aggregation is fully built
  const weeklyData = [
    { day: 'Mon', hours: 4.5, tasks: 5 },
    { day: 'Tue', hours: 6.0, tasks: 7 },
    { day: 'Wed', hours: 3.5, tasks: 4 },
    { day: 'Thu', hours: 5.0, tasks: 6 },
    { day: 'Fri', hours: 7.5, tasks: 8 },
    { day: 'Sat', hours: 2.0, tasks: 2 },
    { day: 'Sun', hours: 6.5, tasks: 6 },
  ];

  return (
    <div className="w-full pt-12 pb-16">
      <header className="mb-8 border-b-2 border-gray-200/50 dark:border-slate-800 pb-4 transition-colors">
        <h2 className={`text-xs font-bold tracking-widest mb-1 uppercase transition-colors ${themeClasses.text}`}>Analytics</h2>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">Performance Dashboard</h1>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors hover:shadow-md">
           <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4"><Target size={20} /></div>
           <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{syllabusProgress}%</p>
           <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Overall Syllabus</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors hover:shadow-md">
           <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4"><BookOpen size={20} /></div>
           <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{doneChapters}<span className="text-sm text-gray-400 dark:text-gray-500">/{totalChapters}</span></p>
           <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Chapters Completed</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors hover:shadow-md">
           <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-4"><Clock size={20} /></div>
           <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{estimatedHours}h</p>
           <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Estimated Hours</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors hover:shadow-md">
           <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4"><Activity size={20} /></div>
           <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{doneRevisions}<span className="text-sm text-gray-400 dark:text-gray-500">/{doneRevisions + pendingRevisions}</span></p>
           <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Revisions Done</p>
        </div>
      </div>

      {/* RECHARTS INTERACTIVE GRAPH */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-8 transition-colors">
        <div className="mb-6">
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Weekly Performance</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Study hours vs completed tasks</p>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dx={-10} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dx={10} />
              <Tooltip cursor={{ fill: '#94a3b8', opacity: 0.1 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar yAxisId="left" dataKey="hours" name="Study Hours" fill={accentHex} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="tasks" name="Tasks Done" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SUBJECT BREAKDOWN */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 transition-colors">
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-6 transition-colors">Subject Breakdown</h3>
          
          <div className="flex flex-col gap-6">
            {subjects.length > 0 ? subjects.map(sub => {
              let subTotal = 0;
              let subDone = 0;
              sub.books?.forEach(b => {
                subTotal += b.chapters?.length || 0;
                subDone += b.chapters?.filter(c => c.status === 'Done').length || 0;
              });
              const subPercent = subTotal === 0 ? 0 : Math.round((subDone / subTotal) * 100);

              return (
                <div key={sub.id}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${sub.color}`}></div>
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm transition-colors">{sub.name}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-400 dark:text-gray-500 transition-colors">
                      {subDone}/{subTotal} Ch. <span className={`ml-2 ${sub.textColor}`}>{subPercent}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 transition-colors">
                    <div className={`h-2 rounded-full ${sub.color} transition-all duration-1000`} style={{ width: `${subPercent}%` }}></div>
                  </div>
                </div>
              )
            }) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No subjects added to the local tracker yet.</p>
            )}
          </div>
        </div>

        {/* QUICK INSIGHTS */}
        <div className="col-span-1 flex flex-col gap-6">
           <div className="bg-slate-800 dark:bg-slate-900 border border-transparent dark:border-slate-800 p-8 rounded-2xl shadow-sm text-white relative overflow-hidden transition-colors">
              <div 
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 transition-colors"
                style={{ backgroundColor: accentHex }}
              ></div>
              <h3 className="text-sm font-bold text-slate-300 dark:text-slate-400 mb-1">Total Books Tracked</h3>
              <p className="text-5xl font-black">{totalBooks}</p>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex-1 transition-colors">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-widest transition-colors">Active Priority</h3>
              {subjects.filter(s => s.priority === 'High').length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {subjects.filter(s => s.priority === 'High').map(sub => (
                    <li key={sub.id} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full ${sub.color}`}></div>
                      {sub.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">No high priority subjects set locally.</p>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default ProgressDashboard;