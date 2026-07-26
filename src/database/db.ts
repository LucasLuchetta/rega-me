// src/database/db.ts
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: any;

if (Platform.OS !== 'web') {
  db = SQLite.openDatabaseSync('plantcare.db');
}

export const initDB = async () => {
  if (Platform.OS === 'web') {
    if (__DEV__) console.log("Web environment detected: Skipping SQLite initialization.");
    return;
  }
  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS plants (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        species TEXT,
        photo_uri TEXT,
        room TEXT,
        pot_size TEXT,
        pot_material TEXT,
        drainage INTEGER,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY NOT NULL,
        plant_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        frequency_days INTEGER NOT NULL,
        last_performed TEXT,
        next_due TEXT,
        FOREIGN KEY (plant_id) REFERENCES plants (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY NOT NULL,
        task_id INTEGER NOT NULL,
        date_performed TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      );

      -- NOVA TABELA DE FOTOS
      CREATE TABLE IF NOT EXISTS plant_photos (
        id INTEGER PRIMARY KEY NOT NULL,
        plant_id INTEGER NOT NULL,
        photo_uri TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (plant_id) REFERENCES plants (id) ON DELETE CASCADE
      );

      -- INDICES
      CREATE INDEX IF NOT EXISTS idx_tasks_plant_id ON tasks(plant_id);
      CREATE INDEX IF NOT EXISTS idx_history_task_id ON history(task_id);
      CREATE INDEX IF NOT EXISTS idx_photos_plant_id ON plant_photos(plant_id);
    `);
    if (__DEV__) console.log("Banco de dados inicializado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    throw error;
  }
};

// In-memory store for web simulation
const webStore: any = {
  plants: [],
  tasks: [],
  history: [],
  plant_photos: []
};

let plantIdCounter = 1;
let taskIdCounter = 1;

export const executeSql = async (sql: string, params: any[] = []) => {
  if (Platform.OS === 'web') {
    if (__DEV__) console.warn("Web environment: SQL execution simulated with in-memory store.");
    const sqlUpper = sql.trim().toUpperCase();

    // Simple parser for web simulation
    if (sqlUpper.startsWith('INSERT INTO PLANTS')) {
       // Assumes params order matches table schema roughly: name, species, room, etc.
       // Current addPlant params: name, species, room, photo_uri, pot_size, pot_material, drainage
       const newPlant = {
           id: plantIdCounter++,
           name: params[0],
           species: params[1],
           room: params[2],
           photo_uri: params[3],
           pot_size: params[4],
           pot_material: params[5],
           drainage: params[6],
           created_at: new Date().toISOString()
       };
       webStore.plants.push(newPlant);
       return { insertId: newPlant.id, rowsAffected: 1, rows: { _array: [], length: 0, item: () => null } };
    }

    if (sqlUpper.startsWith('INSERT INTO TASKS')) {
        const newTask = {
            id: taskIdCounter++,
            plant_id: params[0],
            type: params[1],
            frequency_days: params[2],
            last_performed: params[3],
            next_due: params[4]
        };
        webStore.tasks.push(newTask);
        return { insertId: newTask.id, rowsAffected: 1, rows: { _array: [], length: 0, item: () => null } };
    }

    if (sqlUpper.startsWith('SELECT * FROM PLANTS')) {
        // Handle sort if needed, but for now just return all
        return { rows: { _array: [...webStore.plants], length: webStore.plants.length, item: (i:number) => webStore.plants[i] } };
    }

    if (sqlUpper.startsWith('SELECT * FROM TASKS WHERE PLANT_ID')) {
        const pid = params[0];
        const tasks = webStore.tasks.filter((t: any) => t.plant_id === pid);
        return { rows: { _array: tasks, length: tasks.length, item: (i:number) => tasks[i] } };
    }

    if (sqlUpper.startsWith('DELETE FROM TASKS WHERE ID')) {
        const tid = params[0];
        const initialLen = webStore.tasks.length;
        webStore.tasks = webStore.tasks.filter((t: any) => t.id !== tid);
        return { rowsAffected: initialLen - webStore.tasks.length, rows: { _array: [], length: 0, item: () => null } };
    }

    // Default empty for unhandled queries
    return {
      rows: {
        _array: [],
        length: 0,
        item: () => null
      },
      insertId: 1,
      rowsAffected: 0
    };
  }
  try {
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    if (isSelect) {
      const allRows = await db.getAllAsync(sql, params);
      return {
        rows: {
          _array: allRows,
          length: allRows.length,
          item: (index: number) => allRows[index]
        }
      };
    } else {
      const result = await db.runAsync(sql, params);
      return {
        insertId: result.lastInsertRowId,
        rowsAffected: result.changes,
        rows: { _array: [], length: 0, item: () => null }
      };
    }
  } catch (error) {
    console.error("Erro ao executar SQL:", sql, error);
    throw error;
  }
};
