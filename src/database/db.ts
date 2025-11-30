import * as SQLite from 'expo-sqlite';

// Abre o banco de dados usando a nova API Síncrona (mais rápida e moderna)
const db = SQLite.openDatabaseSync('plantcare.db');

export const initDB = async () => {
  try {
    // Executa os comandos SQL em lote (batch) de forma síncrona
    db.execSync(`
      PRAGMA journal_mode = WAL;

      -- 1. Tabela de Plantas
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

      -- 2. Tabela de Tarefas
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY NOT NULL,
        plant_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        frequency_days INTEGER NOT NULL,
        last_performed TEXT,
        next_due TEXT,
        FOREIGN KEY (plant_id) REFERENCES plants (id) ON DELETE CASCADE
      );

      -- 3. Tabela de Histórico
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY NOT NULL,
        task_id INTEGER NOT NULL,
        date_performed TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      );
    `);
    console.log("Banco de dados inicializado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    throw error;
  }
};

// Helper para manter compatibilidade com os DAOs que criamos
// Ele decide automaticamente se usa runSync (INSERT/UPDATE) ou getAllSync (SELECT)
export const executeSql = async (sql: string, params: any[] = []) => {
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
        rows: {
          _array: [],
          length: 0,
          item: () => null
        }
      };
    }
  } catch (error) {
    console.error("Erro ao executar SQL:", sql, error);
    throw error;
  }
};