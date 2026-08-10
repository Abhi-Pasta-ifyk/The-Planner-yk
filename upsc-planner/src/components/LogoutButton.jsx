import React from 'react';
import { LogOut } from 'lucide-react';

const LogoutButton = ({ onLogoutSuccess }) => {
  const handleLogout = () => {
    // For a local app, logging out just means resetting the React state
    // Refreshing the page achieves this instantly and securely returns to the Auth screen.
    if (onLogoutSuccess) onLogoutSuccess();
    window.location.reload(); 
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors w-full"
    >
      <LogOut size={18} />
      <span>Lock App</span>
    </button>
  );
};

export default LogoutButton;