import Dexie from 'dexie';

// Initialize the local IndexedDB database
export const db = new Dexie('UPSCPlannerDB');

// Define table schemas and indexed fields for fast querying
db.version(1).stores({
  tasks: '++id, date, status, text',
  dailyRecords: 'date, schedule, notes',
  subjects: '++id, name, priority',
  goals: '++id, title, targetDate',
  planner: '++id, rowKey',
  monthlyRecords: 'dateKey',
  habits: '++id, name'
});