import React, { useState, useEffect } from 'react';
import { 
  User, Palette, Bell, Shield, Moon, Sun, Monitor, Check, 
  Sparkles, Download, AlertTriangle, Trash2, Clock, CalendarDays, LayoutDashboard
} from 'lucide-react';
import API from '../api'; 
import { useAccent } from '../AccentContext'; // <-- Import useAccent hook

const Settings = () => {
  const [activeTab, setActiveTab] = useState('appearance');
  
  // --- ACCENT HOOK ---
  const { accent, setAccent } = useAccent();

  // --- STATE: APPEARANCE ---
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [compactMode, setCompactMode] = useState(false);

  // --- STATE: PREFERENCES ---
  const [notifications, setNotifications] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [timerDuration, setTimerDuration] = useState('50');
  const [startOfWeek, setStartOfWeek] = useState('Monday');
  const [targetDate, setTargetDate] = useState('2027-05-28');
  const [landingPage, setLandingPage] = useState('Daily Feed');

  // --- STATE: AI INTEGRATION ---
  const [apiKey, setApiKey] = useState('');
  const [aiMode, setAiMode] = useState('Balanced');

  // --- STATE: SECURITY & DATA ---
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  // --- THEME LOGIC ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Accent Colors Map
  const accentColors = [
    { id: 'indigo', hex: 'bg-indigo-500' },
    { id: 'emerald', hex: 'bg-emerald-500' },
    { id: 'rose', hex: 'bg-rose-500' },
    { id: 'amber', hex: 'bg-amber-500' },
    { id: 'cyan', hex: 'bg-cyan-500' },
  ];

  // --- SETTINGS ACTIONS ---
  const handleUpdatePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      return alert("Please fill out all password fields.");
    }
    if (passwordData.new !== passwordData.confirm) {
      return alert("New passwords do not match!");
    }
    try {
      await API.put('/users/update-password', { 
        currentPassword: passwordData.current, 
        newPassword: passwordData.new 
      });
      alert("Password updated successfully!");
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update password");
    }
  };

  const handleExportData = async () => {
    try {
      const response = await API.get('/users/export');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "upsc_planner_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (err) {
      alert("Failed to export data.");
    }
  };

  const handleWipeData = async () => {
    if (window.confirm("WARNING: This will permanently delete all your tracking data. Proceed?")) {
      try {
        await API.delete('/users/wipe-data');
        alert("All tracking data has been wiped. Refresh the page for a clean slate.");
        window.location.reload();
      } catch (err) {
        alert("Failed to wipe data.");
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("FINAL WARNING: This will permanently delete your account and all data. Proceed?")) {
      try {
        await API.delete('/users/delete-account');
        window.location.reload(); 
      } catch (err) {
        alert("Failed to delete account.");
      }
    }
  };

  // --- UI RENDERERS ---
  const renderAppearance = () => (
    <div className="space-y-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 transition-colors">Theme Preferences</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 transition-colors">Choose how the application looks for you.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
              theme === 'light' 
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' 
                : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center mb-2">
              <Sun size={24} />
            </div>
            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Light Mode</span>
            {theme === 'light' && <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400"><Check size={18} /></div>}
          </button>

          <button 
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all relative ${
              theme === 'dark' 
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' 
                : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 dark:bg-slate-800/80 text-indigo-400 flex items-center justify-center mb-2">
              <Moon size={24} />
            </div>
            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Dark Mode</span>
            {theme === 'dark' && <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400"><Check size={18} /></div>}
          </button>

          <button 
            onClick={() => setTheme('system')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all relative ${
              theme === 'system' 
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' 
                : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 flex items-center justify-center mb-2">
              <Monitor size={24} />
            </div>
            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">System Sync</span>
            {theme === 'system' && <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400"><Check size={18} /></div>}
          </button>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">UI Customization</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tweak colors and spacing to your liking.</p>

        <div className="space-y-6 max-w-lg">
          {/* Accent Color Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Accent Color</label>
            <div className="flex gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setAccent(color.id)} // <-- Updates global accent state
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${color.hex} ${accent === color.id ? 'ring-4 ring-offset-2 ring-gray-200 dark:ring-slate-700 dark:ring-offset-slate-900' : 'opacity-80 hover:opacity-100'}`}
                >
                  {accent === color.id && <Check size={18} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm transition-colors">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Compact Mode</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reduce padding across all tables and lists for denser data.</p>
            </div>
            <button 
              onClick={() => setCompactMode(!compactMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${compactMode ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${compactMode ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Account Details</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your public profile and personal information.</p>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
            <input 
              type="text" 
              defaultValue="Abhishek"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              defaultValue="abhishek@example.com"
              disabled
              className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-600 cursor-not-allowed"
            />
          </div>
          <button className="px-6 py-2.5 bg-slate-800 dark:bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-slate-900 dark:hover:bg-indigo-700 transition-colors mt-4">
            Save Changes
          </button>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Data Management</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Export your data or permanently delete your records.</p>
        
        <div className="space-y-4 max-w-lg">
          <button 
            onClick={handleExportData}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                <Download size={18} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Export Data</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Download a JSON file of all your plans and trackers.</p>
              </div>
            </div>
          </button>

          <div className="mt-6 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-5 relative overflow-hidden">
            <h4 className="font-bold text-red-700 dark:text-red-400 text-sm flex items-center gap-2 mb-2">
              <AlertTriangle size={16} /> Danger Zone
            </h4>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-4">
              These actions are permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleWipeData}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                Wipe All Tracker Data
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Workflow & Productivity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Customize your tracking and planning variables.</p>
        
        <div className="space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><LayoutDashboard size={14}/> Default Landing Page</label>
            <select 
              value={landingPage} onChange={e => setLandingPage(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-all cursor-pointer"
            >
              <option value="Daily Feed" className="dark:bg-slate-800">Daily Feed (Execution Focus)</option>
              <option value="Dashboard" className="dark:bg-slate-800">Main Dashboard (Overview Focus)</option>
              <option value="Cover" className="dark:bg-slate-800">Cover / Mission Page</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CalendarDays size={14}/> Target Exam Date</label>
            <input 
              type="date" 
              value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-all cursor-pointer"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This updates the countdown widget on your Cover and Dashboard.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock size={14}/> Default Timer Block</label>
            <select 
              value={timerDuration} onChange={e => setTimerDuration(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-all cursor-pointer"
            >
              <option value="25" className="dark:bg-slate-800">25 Minutes (Pomodoro)</option>
              <option value="45" className="dark:bg-slate-800">45 Minutes</option>
              <option value="50" className="dark:bg-slate-800">50 Minutes (Standard)</option>
              <option value="60" className="dark:bg-slate-800">60 Minutes</option>
              <option value="90" className="dark:bg-slate-800">90 Minutes (Deep Dive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CalendarDays size={14}/> Start of the Week</label>
            <div className="flex gap-3">
              <button 
                onClick={() => setStartOfWeek('Monday')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${startOfWeek === 'Monday' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                Monday
              </button>
              <button 
                onClick={() => setStartOfWeek('Sunday')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${startOfWeek === 'Sunday' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                Sunday
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Focus & Alerts</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage how the system interrupts you.</p>
        
        <div className="space-y-4 max-w-lg">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm transition-colors">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Push Notifications</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive daily reminders and goal alerts.</p>
            </div>
            <button 
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm transition-colors">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Deep Focus Mode</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hide non-essential UI elements during study sessions.</p>
            </div>
            <button 
              onClick={() => setFocusMode(!focusMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${focusMode ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${focusMode ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAI = () => (
    <div className="space-y-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={20} /> AI Assistant Settings
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Configure how the NLP brain-dump and syllabus generator functions.</p>
        
        <div className="space-y-6 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Gemini API Key</label>
            <input 
              type="password" 
              value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-all font-mono"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Required for processing the 'End of Day Command' and generating 'Smart Syllabus' structures.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Auto-Scheduling Aggressiveness</label>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-1 flex">
              {['Strict', 'Balanced', 'Flexible'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAiMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    aiMode === mode 
                      ? 'bg-slate-800 dark:bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {aiMode === 'Strict' && "Strict: AI will force all missed tasks to tomorrow, stacking your workload."}
              {aiMode === 'Balanced' && "Balanced: AI will distribute missed tasks evenly across the next 3 days."}
              {aiMode === 'Flexible' && "Flexible: AI will push missed tasks to the next weekend."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
          <Shield className="text-indigo-500" size={20} /> Security Settings
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your password and secure your account.</p>
        
        <div className="space-y-6 max-w-md">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Current Password</label>
              <input 
                type="password" 
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                placeholder="Enter current password"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">New Password</label>
              <input 
                type="password" 
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Confirm New Password</label>
              <input 
                type="password" 
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-all"
              />
            </div>
            <button 
              onClick={handleUpdatePassword}
              className="px-6 py-2.5 bg-slate-800 dark:bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-slate-900 dark:hover:bg-indigo-700 transition-colors mt-2"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full pt-12 pb-16">
      <header className="mb-8">
        <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">Settings</h2>
      </header>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              activeTab === 'appearance' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Palette size={18} /> Appearance
          </button>
          
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              activeTab === 'preferences' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Bell size={18} /> Preferences
          </button>

          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              activeTab === 'ai' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sparkles size={18} /> AI Assistant
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors mt-4 ${
              activeTab === 'profile' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <User size={18} /> Profile & Data
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors mt-1 ${
              activeTab === 'security' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-slate-700' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        <div className="flex-1 w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-gray-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm min-h-[400px] transition-colors duration-300">
          {activeTab === 'appearance' && renderAppearance()}
          {activeTab === 'preferences' && renderPreferences()}
          {activeTab === 'ai' && renderAI()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'security' && renderSecurity()}
        </div>
      </div>
    </div>
  );
};

export default Settings;