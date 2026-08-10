import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { localAiService } from '../localAiService'; 
import { 
  CheckCircle2, Circle, AlertCircle, Play, Pause, X, 
  BookOpen, PenTool, Newspaper, Zap 
} from 'lucide-react';
import { useAccent } from '../AccentContext'; 

const DailyDashboard = ({ user }) => {
  const { themeClasses } = useAccent(); 

  const today = new Date();
  const currentDay = today.getDate();
  const currentHour = today.getHours();

  const formatYYYYMMDD = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  const dateKey = formatYYYYMMDD(today);

  let greeting = 'Good Evening';
  if (currentHour < 12) greeting = 'Good Morning';
  else if (currentHour < 18) greeting = 'Good Afternoon';

  const rawPlanner = useLiveQuery(() => db.planner.toArray());
  const rawHabits = useLiveQuery(() => db.habits.toArray());
  
  const loading = rawPlanner === undefined || rawHabits === undefined;

  const revisions = (rawPlanner || []).map(item => ({
    ...item,
    subjectName: item.subject || 'General' 
  }));
  const habits = rawHabits || [];

  const [activeTimerId, setActiveTimerId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(50 * 60); 
  const [isRunning, setIsRunning] = useState(false);

  const [brainDump, setBrainDump] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [nlpFeedback, setNlpFeedback] = useState('');
  const [nlpError, setNlpError] = useState('');

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startTimer = (id) => {
    if (activeTimerId !== id) {
      setActiveTimerId(id);
      setTimeLeft(50 * 60);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);
  const cancelTimer = () => {
    setIsRunning(false);
    setActiveTimerId(null);
    setTimeLeft(50 * 60);
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    const currentActionItems = getActionableRevisions();
    const completedItem = currentActionItems.find(item => item.id === activeTimerId);
    
    if (completedItem) {
      const updatedRevField = { ...completedItem[completedItem.dueRev], done: true };
      await db.planner.update(activeTimerId, { [completedItem.dueRev]: updatedRevField });
    }
    setActiveTimerId(null);
  };

  const toggleHabit = async (habitId) => {
    const targetHabit = habits.find(h => h.id === habitId || h._id === habitId);
    if (!targetHabit) return;

    const completedDays = targetHabit.completedDays || [];
    const updatedDays = completedDays.includes(currentDay)
      ? completedDays.filter(d => d !== currentDay)
      : [...completedDays, currentDay];

    await db.habits.update(targetHabit.id || targetHabit._id, { completedDays: updatedDays });
  };

  const getHabitIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('hindu') || lower.includes('news')) return <Newspaper size={18} />;
    if (lower.includes('write') || lower.includes('answer') || lower.includes('mains')) return <PenTool size={18} />;
    if (lower.includes('read') || lower.includes('book') || lower.includes('optional')) return <BookOpen size={18} />;
    return <Zap size={18} />;
  };

  const getActionableRevisions = () => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); 
    let dueItems = [];
    revisions.forEach(row => {
      ['rev1', 'rev2', 'rev3'].forEach(revKey => {
        if (row[revKey] && !row[revKey].done && row[revKey].date) {
          const revDate = new Date(row[revKey].date);
          if (revDate <= todayDate) {
            dueItems.push({
              ...row,
              dueRev: revKey,
              isOverdue: revDate < todayDate,
              subject: row.subjectName || 'General'
            });
          }
        }
      });
    });
    return dueItems;
  };

  const actionItems = getActionableRevisions();

  // 🚨 UPGRADED: AI Submission handles both Revisions & Daily Planner To-Dos
  const handleBrainDumpSubmit = async (e) => {
    e.preventDefault();
    if (!brainDump.trim()) return;

    setIsProcessing(true);
    setNlpFeedback('');
    setNlpError('');
    
    try {
      // 1. Fetch current Revisions AND Daily Tasks
      const currentRevisions = actionItems.map(item => ({ id: item.id, topic: item.topic }));
      const todaysTodos = await db.tasks.where('date').equals(dateKey).toArray();
      const currentTodos = todaysTodos.map(t => ({ id: t.id, task: t.text }));
      
      // 2. Call Gemini
      const aiResponse = await localAiService.processEndOfDayCommand(brainDump, currentTodos, currentRevisions);
      
      let updatedCount = 0;

      // 3. Execute Planner Updates (Move to Tomorrow)
      if (aiResponse.todosToMoveToTomorrow) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = formatYYYYMMDD(tomorrow);
        
        for (const taskId of aiResponse.todosToMoveToTomorrow) {
           await db.tasks.update(Number(taskId), { date: tomorrowKey });
           updatedCount++;
        }
      }

      // 4. Execute Planner Updates (Check Off)
      if (aiResponse.completedTodoIds) {
        for (const taskId of aiResponse.completedTodoIds) {
           await db.tasks.update(Number(taskId), { status: 'Completed' });
           updatedCount++;
        }
      }

      // 5. Execute Revision Updates (Check Off)
      if (aiResponse.completedRevisionIds) {
        for (const taskId of aiResponse.completedRevisionIds) {
          const item = actionItems.find(a => String(a.id) === String(taskId));
          if (item) {
             const updatedRevField = { ...item[item.dueRev], done: true };
             await db.planner.update(item.id, { [item.dueRev]: updatedRevField });
             updatedCount++;
          }
        }
      }

      setNlpFeedback(aiResponse.aiFeedback || `Success! ${updatedCount} tasks were checked off or moved by the AI.`);
      setBrainDump('');
    } catch (err) {
      console.error("AI Sync Failed:", err);
      setNlpError(err.message || "Failed to update schedule. Please check your Gemini API key in Settings.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => { setNlpFeedback(''); setNlpError(''); }, 7000);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium">Loading Daily Feed from local database...</div>;

  const displayName = localStorage.getItem('upsc_user_name') || user?.name?.split(' ')[0] || 'Scholar';

  return (
    <div className="max-w-5xl mx-auto pt-12 pb-16 px-4">
      
      <header className="mb-10">
        <h2 className={`text-sm font-bold tracking-widest uppercase mb-1 transition-colors ${themeClasses.text}`}>
          {greeting}, {displayName}
        </h2>
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">Today's Feed</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 transition-colors">Zero planning. Just execution. Let's clear the board.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Spaced Repetitions Due</h3>
              <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full transition-colors">
                {actionItems.length} Tasks
              </span>
            </div>

            {actionItems.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                <CheckCircle2 size={40} className="mx-auto text-green-400 mb-3" />
                <p className="text-slate-600 dark:text-slate-300 font-bold">You are completely caught up!</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">No revisions due today.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {actionItems.map((item) => {
                  const isThisTimerActive = activeTimerId === item.id;
                  return (
                    <div key={`${item.id}-${item.dueRev}`} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isThisTimerActive 
                        ? `${themeClasses.bgLight} border-transparent shadow-md scale-[1.02]` 
                        : item.isOverdue ? 'bg-red-50/30 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'
                    }`}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-700 border dark:border-slate-600 shadow-sm uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors">
                            {item.subject}
                          </span>
                          {item.isOverdue && !isThisTimerActive && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
                              <AlertCircle size={12} /> Overdue
                            </span>
                          )}
                        </div>
                        <h4 className={`font-bold transition-colors ${isThisTimerActive ? themeClasses.text : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.topic}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 transition-colors">Due for {item.dueRev.toUpperCase()}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isThisTimerActive ? (
                          <div className={`flex items-center gap-3 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border shadow-sm transition-colors ${themeClasses.border}`}>
                            <span className={`font-mono text-lg font-bold w-16 text-center ${themeClasses.text}`}>{formatTime(timeLeft)}</span>
                            <div className="flex items-center gap-1 border-l pl-2 border-slate-200 dark:border-slate-700">
                              {isRunning ? (
                                <button onClick={pauseTimer} className={`p-1.5 rounded-md transition-colors text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:${themeClasses.text}`}>
                                  <Pause size={16} fill="currentColor" />
                                </button>
                              ) : (
                                <button onClick={() => startTimer(item.id)} className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-slate-700 rounded-md transition-colors">
                                  <Play size={16} fill="currentColor" />
                                </button>
                              )}
                              <button onClick={cancelTimer} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md transition-colors">
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => startTimer(item.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${themeClasses.primary}`}>
                            <Play size={14} fill="currentColor" /> Start 50m
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-slate-900 dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-800 dark:border-slate-700/50 p-6 text-white transition-colors">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-100">Daily Non-Negotiables</h3>
            {habits.length > 0 ? (
              <div className="flex flex-col gap-4">
                {habits.map((habit) => {
                  const isDone = (habit.completedDays || []).includes(currentDay);
                  return (
                    <button 
                      key={habit.id || habit._id}
                      onClick={() => toggleHabit(habit.id || habit._id)}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isDone ? 'bg-slate-800/50 dark:bg-slate-700/30 opacity-50' : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600'}`}
                    >
                      <div className={`${isDone ? 'text-green-400' : 'text-slate-400'}`}>
                        {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </div>
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-slate-300">{getHabitIcon(habit.name)}</span>
                        <span className={`font-bold text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>{habit.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center py-4">Add habits in the Monthly Planner to see them here!</div>
            )}
          </section>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg transition-colors ${themeClasses.bgLight} ${themeClasses.text}`}>
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">End of Day Command</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Tell the system what you missed or need to change. The AI will handle your schedule.</p>
          </div>
        </div>

        <form onSubmit={handleBrainDumpSubmit} className="relative">
          <textarea
            value={brainDump}
            onChange={(e) => setBrainDump(e.target.value)}
            placeholder="e.g., I successfully finished my Math test revision but fell asleep before finishing my essay so push that to tomorrow."
            className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-transparent focus:ring-2 transition-all resize-none min-h-[100px] ${themeClasses.ring}`}
          />
          <button type="submit" disabled={isProcessing || !brainDump.trim()} className={`absolute bottom-4 right-4 px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 text-white ${themeClasses.primary}`}>
            {isProcessing ? <><span className="animate-pulse w-2 h-2 bg-white/70 rounded-full"></span> Thinking...</> : 'Sync Schedule'}
          </button>
        </form>

        {nlpFeedback && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-bold rounded-lg border border-green-200 dark:border-green-900/50 flex items-center gap-2 transition-colors">
            <CheckCircle2 size={16} />{nlpFeedback}
          </div>
        )}
        
        {nlpError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-bold rounded-lg border border-red-200 dark:border-red-900/50 flex items-center gap-2 transition-colors">
            <AlertCircle size={16} />{nlpError}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyDashboard;