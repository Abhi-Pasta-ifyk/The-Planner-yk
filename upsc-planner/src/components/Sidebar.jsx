import React from 'react';
import { 
  LayoutDashboard, CalendarDays, Calendar as CalIcon, Clock, 
  BookOpen, Bookmark, FileText, BarChart2, TrendingUp, 
  CheckCircle2, Circle, Droplet, Star, Check, Flame, Award, 
  Zap, Target, Crosshair, Map, Settings 
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { 
      category: 'OVERVIEW', 
      items: [
        { name: 'Cover', icon: <Map size={18} /> }, 
        { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Daily Feed', icon: <Zap size={18} /> }
      ] 
    },
    { 
      category: 'PLANNING', 
      items: [
        { name: 'Annual Goals', icon: <Target size={18} /> }, 
        { name: 'Monthly Planner', icon: <CalendarDays size={18} /> }, 
        { name: 'Weekly Planner', icon: <CalIcon size={18} /> }, 
        { name: 'Daily Planner', icon: <Clock size={18} /> }
      ] 
    },
    { 
      category: 'TRACKERS', 
      items: [
        { name: 'Subject Tracker', icon: <BookOpen size={18} /> } 
      ] 
    },
    { 
      category: 'ANALYTICS', 
      items: [
        { name: 'Revision Tracker', icon: <TrendingUp size={18} /> }, 
        { name: 'Progress Dashboard', icon: <Crosshair size={18} /> }
      ] 
    },
    { 
      category: 'SYSTEM',
      items: [
        { name: 'Settings', icon: <Settings size={18} /> }
      ] 
    }
  ];

  return (
    <aside className="w-64 bg-[#1e232d] dark:bg-slate-900 border-r-0 dark:border-r border-slate-800 text-gray-300 dark:text-slate-300 flex flex-col h-screen overflow-y-auto transition-colors duration-300">
      <div className="p-6">
        <h1 className="text-white dark:text-slate-100 text-lg font-bold tracking-wider transition-colors">UPSC</h1>
        <p className="text-xs text-gray-500 dark:text-slate-500 mb-6 transition-colors">PLANNER 2025</p>
        
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-500 mb-2 px-3 transition-colors">{section.category}</h2>
            <ul>
              {section.items.map((item, i) => {
                const isActive = activeView === item.name;
                return (
                  <li 
                    key={i} 
                    onClick={() => setActiveView(item.name)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm mb-1 transition-colors ${
                      isActive 
                        ? 'bg-gray-700 dark:bg-indigo-500/20 text-white dark:text-indigo-400 font-semibold' 
                        : 'hover:bg-gray-800 dark:hover:bg-slate-800/80 text-gray-300 dark:text-slate-400'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;