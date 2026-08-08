import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Target, Activity 
} from 'lucide-react';
import API from '../api'; 
import { useAccent } from '../AccentContext'; // <-- Import accent hook

const Cover = () => {
  const { themeClasses } = useAccent(); // <-- Destructure global theme classes

  const [daysRemaining, setDaysRemaining] = useState(0);
  const [stats, setStats] = useState({ totalChapters: 0, doneChapters: 0, totalHours: 0, percent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Calculate Countdown
    const targetDate = new Date('2027-05-30T00:00:00');
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays > 0 ? diffDays : 0);

    // 2. Fetch Global Database Stats
    const fetchGlobalStats = async () => {
      try {
        const response = await API.get('/subjects');
        const subjects = response.data;
        
        let tChapters = 0;
        let dChapters = 0;
        let tHours = 0;

        subjects.forEach(sub => {
          tHours += sub.hours || 0;
          sub.books?.forEach(book => {
            tChapters += book.chapters?.length || 0;
            dChapters += book.chapters?.filter(c => c.status === 'Done').length || 0;
          });
        });

        const percent = tChapters === 0 ? 0 : Math.round((dChapters / tChapters) * 100);
        
        setStats({ totalChapters: tChapters, doneChapters: dChapters, totalHours: tHours, percent });
      } catch (err) {
        console.error("Failed to fetch global stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalStats();
  }, []);

  return (
    <main className="flex-1 bg-transparent h-full pb-16 transition-colors duration-300">
      <div className="h-72 w-full bg-cover bg-center relative rounded-t-3xl overflow-hidden" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1506744626753-1401305415c6?q=80&w=2000&auto=format&fit=crop")'}}>
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50 transition-colors duration-300"></div>
      </div>
      
      <div className="max-w-5xl mx-auto px-10 relative -mt-20">
        <div className="w-40 h-40 bg-[#f4f1eb] dark:bg-slate-900 rounded-2xl shadow-lg border-4 border-[#eae6df] dark:border-slate-950 flex items-center justify-center mb-6 transition-colors duration-300">
          <span className="text-6xl">🏛️</span>
        </div>
        
        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-8 transition-colors">Mission UPSC Civil Services Examination</p>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2 bg-[#f4f1eb] dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-4 transition-colors">The Manifesto</h3>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed font-medium italic transition-colors">
              "Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita Bhashita"
            </p>
          </div>
          
          <div className="col-span-1 bg-[#1e232d] dark:bg-slate-800/80 p-8 rounded-2xl shadow-sm border border-transparent dark:border-slate-700 flex flex-col justify-center items-center text-center transition-colors">
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2 transition-colors">Countdown to Prelims '27</h3>
            <span className="text-5xl font-extrabold text-white mb-1 transition-colors">{daysRemaining}</span>
            <span className="text-sm text-gray-400 transition-colors">Days Remaining</span>
          </div>
        </div>

        {/* --- GLOBAL CONTROL CENTER STATS --- */}
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-4 flex items-center gap-2 transition-colors">
          <Activity size={18} /> Global Progress
        </h2>
        
        <div className="grid grid-cols-3 gap-6">
          
          {/* Card 1: Chapters Completed */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-5 transition-all hover:-translate-y-1">
            <div className={`p-4 rounded-xl transition-colors ${themeClasses.bgLight} ${themeClasses.text}`}>
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">Chapters Mastered</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{isLoading ? '-' : stats.doneChapters}</span>
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-1 transition-colors">/ {isLoading ? '-' : stats.totalChapters}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Hours Logged */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-5 transition-all hover:-translate-y-1">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 rounded-xl transition-colors">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">Deep Work Logged</p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{isLoading ? '-' : stats.totalHours}</span>
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-1 transition-colors">hrs</span>
              </div>
            </div>
          </div>

          {/* Card 3: Syllabus Completion % */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-5 transition-all hover:-translate-y-1">
            <div className={`p-4 rounded-xl shrink-0 transition-colors ${themeClasses.bgLight} ${themeClasses.text}`}>
              <Target size={28} />
            </div>
            <div className="w-full">
              <div className="flex justify-between items-end mb-1">
                 <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Syllabus Progress</p>
                 <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 transition-colors">{isLoading ? '-' : stats.percent}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 mt-2 transition-colors">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ease-out ${themeClasses.primary}`} 
                  style={{ width: `${isLoading ? 0 : stats.percent}%` }}
                ></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
};

export default Cover;