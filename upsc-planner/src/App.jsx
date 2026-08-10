import React, { useState, useEffect, useRef } from 'react';
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

export default function App() {
  // --- SPLASH SCREEN STATE ---
  const [showSplash, setShowSplash] = useState(true);
  const videoRef = useRef(null); // Added useRef for the video

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); 
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); 

  const [activeView, setActiveView] = useState(localStorage.getItem('landingPage') || 'Daily Feed');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- SPLASH SCREEN TIMER & VIDEO AUTOPLAY ---
  useEffect(() => {
    // Force play video on mount (fixes Electron video loading delays)
    if (showSplash && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Autoplay failed:", err);
      });
    }

    // Fades out the splash screen after 3.5 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(splashTimer);
  }, [showSplash]);

  // --- THEME SYNC ---
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

  // --- LOCAL AUTHENTICATION CHECK ---
  useEffect(() => {
    const verifyLocalSession = () => {
      const masterLock = localStorage.getItem('upsc_app_lock');
      const isSessionActive = sessionStorage.getItem('upsc_session_active');

      if (!masterLock || isSessionActive) {
        setUser({ name: localStorage.getItem('upsc_user_name') || 'Abhi' });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingAuth(false);
    };

    verifyLocalSession();
  }, []);

  const handleAuthSuccess = () => {
    sessionStorage.setItem('upsc_session_active', 'true');
    setUser({ name: localStorage.getItem('upsc_user_name') || 'Abhi' });
    setIsAuthenticated(true);
  };

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
      <div className="relative w-full h-screen bg-[#eae6df] dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
        
        {/* ==========================================
            1. THE SPLASH SCREEN OVERLAY
            ========================================== */}
        <div 
          className={`absolute inset-0 z-50 flex items-center justify-center bg-[#eae6df] dark:bg-slate-950 transition-opacity duration-1000 ease-in-out ${
            showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* mix-blend-multiply magically removes the video's gray background! */}
          <video 
            ref={videoRef}
            src="./work-fool.webm" 
            autoPlay 
            muted 
            playsInline 
            className="w-full max-w-md object-contain mix-blend-multiply dark:mix-blend-screen scale-110"
          />
        </div>

        {/* ==========================================
            2. THE SLIDE-IN APP / LOGIN SCREEN
            ========================================== */}
        <div 
          className={`w-full h-full transition-all duration-1000 ease-out transform ${
            showSplash ? 'translate-y-12 opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'
          }`}
        >
          {isCheckingAuth ? null : !isAuthenticated ? (
            <Auth onAuthSuccess={handleAuthSuccess} />
          ) : (
            <div className="flex h-full w-full">
              {/* Sidebar */}
              <div className={`transition-all duration-300 ease-in-out shrink-0 bg-[#1e232d] z-40 overflow-hidden shadow-2xl ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
                <div className="w-64 h-full relative">
                  <Sidebar activeView={activeView} setActiveView={setActiveView} />
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 h-screen overflow-y-auto relative scroll-smooth">
                <div className="sticky top-0 z-50 p-6 bg-gradient-to-b from-[#eae6df] dark:from-slate-950 to-transparent pointer-events-none transition-colors duration-300">
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="pointer-events-auto p-2.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl shadow-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-800 hover:shadow transition-all border border-gray-200/50 dark:border-slate-700/50"
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
        </div>

      </div>
    </AccentProvider>
  );
}