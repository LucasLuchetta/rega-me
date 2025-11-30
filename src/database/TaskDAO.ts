import { executeSql } from './db';

// Tipos de tarefas suportadas
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
  // Criar uma tarefa para uma planta
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

  // Buscar tarefas do dia (Dashboard)
  // Retorna tarefas onde 'next_due' é hoje ou anterior (atrasadas)
  getDueTasks: async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sql = `
      SELECT t.*, p.name as plant_name, p.photo_uri, p.room 
      FROM tasks t
      JOIN plants p ON t.plant_id = p.id
      WHERE date(t.next_due) <= date(?)
      ORDER BY t.next_due ASC
    `;
    return await executeSql(sql, [today]);
  },

  // Buscar projeção futura (Para o Orakul)
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

  // Marcar tarefa como feita ("Check Rápido")
  completeTask: async (taskId: number, frequencyDays: number) => {
    const now = new Date();
    const nextDue = new Date();
    nextDue.setDate(now.getDate() + frequencyDays);

    // 1. Atualiza a tarefa com a nova data
    await executeSql(
      `UPDATE tasks SET last_performed = ?, next_due = ? WHERE id = ?`,
      [now.toISOString(), nextDue.toISOString(), taskId]
    );

    // 2. Registra no histórico (Para gamificação: Streaks e XP)
    await executeSql(
      `INSERT INTO history (task_id, date_performed) VALUES (?, ?)`,
      [taskId, now.toISOString()]
    );
  }
};