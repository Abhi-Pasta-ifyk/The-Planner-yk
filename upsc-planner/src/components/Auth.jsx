import React, { useState } from 'react';
import { Lock, Mail, User, ArrowRight, Loader } from 'lucide-react';
import API from '../api';
import { useAccent } from '../AccentContext';

const Auth = ({ onAuthSuccess }) => {
  // Safely grab the context with fallbacks to prevent undefined/ReferenceError crashes
  const accentContext = useAccent();
  const accent = accentContext?.accent || 'indigo';
  const themeClasses = accentContext?.themeClasses || {
    primary: 'bg-indigo-600',
    ring: 'focus:ring-indigo-500'
  };

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Map accent to hex color for background glow effects
  const accentHex = { 
    indigo: '#6366f1', 
    emerald: '#10b981', 
    rose: '#f43f5e', 
    amber: '#f59e0b', 
    cyan: '#06b6d4' 
  }[accent] || '#6366f1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await API.post('/auth/login', { email, password });
        onAuthSuccess(response.data.user);
      } else {
        const response = await API.post('/auth/register', { name, email, password });
        onAuthSuccess(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#eae6df] dark:bg-slate-950 p-6 transition-colors duration-300 relative overflow-hidden">
      
      {/* Dynamic Accent Background Glows */}
      <div 
        className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-20 transition-colors pointer-events-none"
        style={{ backgroundColor: accentHex }}
      ></div>
      <div 
        className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20 transition-colors pointer-events-none"
        style={{ backgroundColor: accentHex }}
      ></div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md p-8 relative border border-gray-100 dark:border-slate-800 transition-colors z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wider">
            {isLogin ? 'Log in to access your study command center' : 'Start tracking your academic journey'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
              <div className={`flex items-center gap-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 transition-colors focus-within:ring-2 focus-within:border-transparent ${themeClasses.ring}`}>
                <User size={18} className="text-gray-400 shrink-0" />
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Student Name"
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
            <div className={`flex items-center gap-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 transition-colors focus-within:ring-2 focus-within:border-transparent ${themeClasses.ring}`}>
              <Mail size={18} className="text-gray-400 shrink-0" />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
            <div className={`flex items-center gap-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 transition-colors focus-within:ring-2 focus-within:border-transparent ${themeClasses.ring}`}>
              <Lock size={18} className="text-gray-400 shrink-0" />
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold shadow-md transition-all hover:opacity-90 disabled:opacity-50 text-white ${themeClasses.primary}`}
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;