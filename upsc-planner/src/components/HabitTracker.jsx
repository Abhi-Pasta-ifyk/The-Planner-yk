import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useAccent } from '../AccentContext'; 

const HabitTracker = ({ monthKey, daysInMonth, monthName }) => {
  const { themeClasses } = useAccent(); 

  // --- REACTIVE LOCAL STATE ---
  // Fetch all habits and filter by the current monthKey. 
  // (Filtering in JS prevents needing to upgrade the Dexie database schema version)
  const rawHabits = useLiveQuery(() => db.habits.toArray());
  const loading = rawHabits === undefined;
  const habits = (rawHabits || []).filter(h => h.monthKey === monthKey);

  const [newHabitName, setNewHabitName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // --- ACTIONS ---
  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    await db.habits.add({
      monthKey,
      name: newHabitName,
      completedDays: []
    });
    
    setNewHabitName('');
  };

  const toggleDay = async (habitId, day) => {
    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    const completedDays = targetHabit.completedDays || [];
    const updatedDays = completedDays.includes(day)
      ? completedDays.filter(d => d !== day)
      : [...completedDays, day];

    await db.habits.update(habitId, { completedDays: updatedDays });
  };

  const deleteHabit = async (habitId) => {
    await db.habits.delete(habitId);
  };

  const startEditing = (habit) => {
    setEditingId(habit.id);
    setEditingText(habit.name);
  };

  const saveEdit = async (habitId) => {
    if (!editingText.trim()) return;
    
    await db.habits.update(habitId, { name: editingText });
    setEditingId(null);
  };

  // Generate array [1, 2, ..., daysInMonth]
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  if (loading) return <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-center text-gray-400 dark:text-gray-500 text-xs transition-colors">Loading habits...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 transition-colors">Habit Tracker — <span className="text-gray-400 dark:text-gray-500">{monthName}</span></h3>
        
        {/* Inline Add Form */}
        <form onSubmit={handleAddHabit} className="flex items-center gap-2">
          <input 
            type="text" 
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className={`text-xs bg-transparent text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-md px-3 py-1.5 outline-none w-48 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors focus:ring-2 focus:border-transparent ${themeClasses.ring}`}
            placeholder="Add new habit..."
          />
          <button type="submit" disabled={!newHabitName.trim()} className={`p-1.5 rounded-md disabled:opacity-50 transition-colors ${themeClasses.primary} text-white`}>
            <Plus size={14} />
          </button>
        </form>
      </div>

      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr>
              <th className="py-2 px-4 font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest w-48 transition-colors">Habit</th>
              {daysArray.map(day => (
                <th key={day} className="py-2 px-1 font-bold text-[9px] text-gray-400 dark:text-gray-500 text-center w-6 transition-colors">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.length > 0 ? habits.map((habit) => (
              <tr key={habit.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-50 dark:border-slate-800/50 last:border-0">
                
                {/* Habit Name Column with Edit/Delete */}
                <td className="py-3 px-4 flex items-center justify-between w-56 pr-6">
                  {editingId === habit.id ? (
                    <input 
                      autoFocus
                      type="text" 
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => saveEdit(habit.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(habit.id)}
                      className={`text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 outline-none w-full mr-2 transition-colors focus:ring-2 focus:border-transparent ${themeClasses.ring}`}
                    />
                  ) : (
                    <span 
                      onDoubleClick={() => startEditing(habit)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate cursor-text transition-colors"
                      title="Double-click to edit"
                    >
                      {habit.name}
                    </span>
                  )}
                  
                  {/* Action Icons (Show on hover) */}
                  <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${editingId === habit.id ? 'hidden' : ''}`}>
                    <button onClick={() => startEditing(habit)} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 p-0.5 transition-colors"><Edit2 size={12} /></button>
                    <button onClick={() => deleteHabit(habit.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-0.5 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </td>

                {/* Day Checkboxes */}
                {daysArray.map(day => {
                  const isDone = (habit.completedDays || []).includes(day);
                  return (
                    <td key={day} className="py-3 px-1 text-center">
                      <button 
                        onClick={() => toggleDay(habit.id, day)}
                        className={`w-4 h-4 rounded-[4px] transition-all mx-auto block border ${
                          isDone 
                            ? 'bg-green-600 dark:bg-green-500 border-green-600 dark:border-green-500 shadow-sm' 
                            : 'bg-gray-100/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            )) : (
              <tr>
                <td colSpan={daysInMonth + 1} className="py-8 text-center text-gray-400 dark:text-gray-500 text-xs transition-colors">No habits tracked for this month.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HabitTracker;