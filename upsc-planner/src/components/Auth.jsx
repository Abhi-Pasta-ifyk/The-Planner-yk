import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAccent } from '../AccentContext';

const Auth = ({ onAuthSuccess }) => {
  const { themeClasses } = useAccent();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const userName = localStorage.getItem('upsc_user_name') || 'Abhi';

  const handleUnlock = (e) => {
    e.preventDefault();
    const masterLock = localStorage.getItem('upsc_app_lock');
    
    // If somehow they don't have a lock set, let them in
    if (!masterLock) {
      onAuthSuccess();
      return;
    }

    // Check against obfuscated lock
    if (btoa(password) === masterLock) {
      onAuthSuccess();
    } else {
      setError('Incorrect Master Password');
      setPassword('');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#eae6df] dark:bg-slate-950 p-4">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-800 p-10 relative z-10">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${themeClasses.bgLight} ${themeClasses.text}`}>
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Welcome Back, {userName}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
            Enter your master password to unlock your planner.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6">
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2 pl-1">
              Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(''); // Clear error when typing
                }}
                className={`w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-slate-800 border-2 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 ${
                  error ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' : 'border-gray-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                }`}
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Error Message Space */}
            <div className="h-6 mt-2 pl-1">
              {error && (
                <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
                  {error}
                </p>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!password}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white ${themeClasses.primary} hover:scale-[1.02] active:scale-[0.98]`}
          >
            Unlock Application <ArrowRight size={18} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default Auth;