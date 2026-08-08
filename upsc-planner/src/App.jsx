import React, { useState, useEffect } from 'react';
import { Menu, X, Loader } from 'lucide-react'; 
import { AccentProvider } from './AccentContext';
import Sidebar from './components/Sidebar';
import Cover from './components/Cover';
import Dashboard from './components/Dashboard';
import AnnualGoals from './components/AnnualGoals';
import WeeklyPlanner from './components/WeeklyPlanner';
import ProgressDashboard from './components/ProgressDashboard';
import MonthlyDashboard from './components/MonthlyDashboard';
import DailyPlanner from './components/DailyPlanner';
import SubjectTracker from './components/SubjectTracker';
import RevisionTracker from './components/RevisionTracker';
import DailyDashboard from './components/DailyDashboard'; 
import CheerUp from './components/CheerUp';
import Auth from './components/Auth'; 
import Settings from './components/Settings'; 
import API from './api'; 

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); 
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); 

  const [activeView, setActiveView] = useState('Daily Feed');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'system';
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await API.get('/auth/me'); 
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifySession();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  if (isCheckingAuth) {
    return (
      <AccentProvider>
        <div className="flex h-screen w-full items-center justify-center bg-[#eae6df] dark:bg-slate-950 transition-colors duration-300">
          <div className="flex flex-col items-center gap-4 text-indigo-600 dark:text-indigo-400">
            <Loader size={40} className="animate-spin" />
            <p className="text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Verifying Secure Session...</p>
          </div>
        </div>
      </AccentProvider>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'Cover': return <Cover />;
      case 'Dashboard': return <Dashboard user={user} />;
      case 'Daily Feed': return <DailyDashboard user={user} />; 
      case 'Annual Goals': return <AnnualGoals />;
      case 'Weekly Planner': return <WeeklyPlanner />;
      case 'Progress Dashboard': return <ProgressDashboard />;
      case 'Daily Planner': return <DailyPlanner />;
      case 'Monthly Planner': return <MonthlyDashboard />;
      case 'Subject Tracker': return <SubjectTracker />; 
      case 'Revision Tracker': return <RevisionTracker />;
      case 'Settings': return <Settings />; 
      default: return <DailyDashboard user={user} />;
    }
  };

  return (
    <AccentProvider>
      {/* AccentProvider is now at the root so Auth and App both have access */}
      {!isAuthenticated ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : (
        <div className="flex h-screen bg-[#eae6df] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
          
          <div 
            className={`transition-all duration-300 ease-in-out shrink-0 bg-[#1e232d] z-40 overflow-hidden shadow-2xl ${
              isSidebarOpen ? 'w-64' : 'w-0'
            }`}
          >
            <div className="w-64 h-full relative">
              <Sidebar activeView={activeView} setActiveView={setActiveView} />
            </div>
          </div>

          <div className="flex-1 h-screen overflow-y-auto relative scroll-smooth">
            
            <div className="sticky top-0 z-50 p-6 bg-gradient-to-b from-[#eae6df] dark:from-slate-950 to-transparent pointer-events-none transition-colors duration-300">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="pointer-events-auto p-2.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl shadow-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-800 hover:shadow transition-all border border-gray-200/50 dark:border-slate-700/50"
                title="Toggle Menu"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12 lg:px-24 pb-24 -mt-10">
              {renderContent()}
            </div>
            
          </div>
          
          <CheerUp />
          
        </div>
      )}
    </AccentProvider>
  );
}