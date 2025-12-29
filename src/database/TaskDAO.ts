import { executeSql } from './db';

export type TaskType = 'water' | 'fertilize' | 'mist' | 'prune' | 'repot';

export interface Task {
  id?: number;
  plant_id: number;
  type: TaskType;
  frequency_days: number;
  last_performed?: string;
  next_due: string;
}

export const TaskDAO = {
  addTask: async (task: Task) => {
    const sql = `
      INSERT INTO tasks (plant_id, type, frequency_days, last_performed, next_due)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      task.plant_id,
      task.type,
      task.frequency_days,
      task.last_performed || null,
      task.next_due
    ];
    return await executeSql(sql, params);
  },

  getDueTasks: async () => {
    const today = new Date().toISOString().split('T')[0]; 
    const sql = `
      SELECT t.*, p.name as plant_name, p.photo_uri, p.room 
      FROM tasks t
      JOIN plants p ON t.plant_id = p.id
      WHERE date(t.next_due) <= date(?)
      ORDER BY t.next_due ASC
    `;
    return await executeSql(sql, [today]);
  },

  getTasksByPlantId: async (plantId: number) => {
    const sql = `SELECT * FROM tasks WHERE plant_id = ? ORDER BY next_due ASC`;
    return await executeSql(sql, [plantId]);
  },

  snoozeTask: async (taskId: number, days: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    const sql = `UPDATE tasks SET next_due = ? WHERE id = ?`;
    return await executeSql(sql, [newDate.toISOString(), taskId]);
  },

  getFutureTasks: async (days = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const sql = `
      SELECT t.*, p.name as plant_name 
      FROM tasks t
      JOIN plants p ON t.plant_id = p.id
      WHERE date(t.next_due) BETWEEN date(?) AND date(?)
      ORDER BY t.next_due ASC
    `;
    return await executeSql(sql, [today.toISOString(), futureDate.toISOString()]);
  },

  completeTask: async (taskId: number, frequencyDays: number) => {
    const now = new Date();
    const nextDue = new Date();
    nextDue.setDate(now.getDate() + frequencyDays);

    await executeSql(
      `UPDATE tasks SET last_performed = ?, next_due = ? WHERE id = ?`,
      [now.toISOString(), nextDue.toISOString(), taskId]
    );

    await executeSql(
      `INSERT INTO history (task_id, date_performed) VALUES (?, ?)`,
      [taskId, now.toISOString()]
    );
  },

  // Histórico Global (Perfil)
  getHistory: async () => {
    const sql = `
      SELECT h.id, h.date_performed, t.type, p.name as plant_name
      FROM history h
      JOIN tasks t ON h.task_id = t.id
      JOIN plants p ON t.plant_id = p.id
      ORDER BY h.date_performed DESC
    `;
    return await executeSql(sql);
  },

  // CORREÇÃO DO BUG: Histórico filtrado EXCLUSIVAMENTE pela planta atual
  getHistoryByPlantId: async (plantId: number) => {
    const sql = `
      SELECT h.id, h.date_performed, t.type
      FROM history h
      JOIN tasks t ON h.task_id = t.id
      WHERE t.plant_id = ?
      ORDER BY h.date_performed DESC
    `;
    return await executeSql(sql, [plantId]);
  },

  updateTaskFrequency: async (plantId: number, type: string, newFrequency: number) => {
    const sql = `UPDATE tasks SET frequency_days = ? WHERE plant_id = ? AND type = ?`;
    return await executeSql(sql, [newFrequency, plantId, type]);
  }
};