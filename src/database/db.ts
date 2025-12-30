// src/database/db.ts
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: any;

if (Platform.OS !== 'web') {
  db = SQLite.openDatabaseSync('plantcare.db');
}

export const initDB = async () => {
  if (Platform.OS === 'web') {
    console.log("Web environment detected: Skipping SQLite initialization.");
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
    `);
    console.log("Banco de dados inicializado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    throw error;
  }
};

export const executeSql = async (sql: string, params: any[] = []) => {
  if (Platform.OS === 'web') {
    console.warn("Web environment: SQL execution simulated.");
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
