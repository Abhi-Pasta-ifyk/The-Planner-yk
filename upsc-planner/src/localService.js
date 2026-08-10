import { db } from './db';

export const localService = {
  // --- TASKS ---
  getTasksByDate: async (dateKey) => {
    return await db.tasks.where('date').equals(dateKey).toArray();
  },
  addTask: async (taskData) => {
    const id = await db.tasks.add({
      text: taskData.text || '',
      date: taskData.date,
      status: taskData.status || 'Pending',
      createdAt: new Date()
    });
    return { _id: id, ...taskData };
  },
  updateTask: async (id, changes) => {
    await db.tasks.update(Number(id), changes);
  },
  deleteTask: async (id) => {
    await db.tasks.delete(Number(id));
  },

  // --- DAILY RECORDS (Schedule & Notes) ---
  getDailyRecord: async (dateKey) => {
    const record = await db.dailyRecords.get(dateKey);
    return record || { date: dateKey, schedule: [], notes: '' };
  },
  saveDailyRecord: async (dateKey, data) => {
    await db.dailyRecords.put({
      date: dateKey,
      schedule: data.schedule || [],
      notes: data.notes || ''
    });
  },

  // --- EXPORT & IMPORT ---
  exportAllData: async () => {
    const [tasks, dailyRecords, subjects, goals, habits] = await Promise.all([
      db.tasks.toArray(),
      db.dailyRecords.toArray(),
      db.subjects.toArray(),
      db.goals.toArray(),
      db.habits.toArray()
    ]);
    return { exportDate: new Date(), tasks, dailyRecords, subjects, goals, habits };
  },
  wipeAllData: async () => {
    await Promise.all([
      db.tasks.clear(),
      db.dailyRecords.clear(),
      db.subjects.clear(),
      db.goals.clear(),
      db.habits.clear()
    ]);
  }
};