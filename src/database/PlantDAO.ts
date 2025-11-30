import { executeSql } from './db';

export interface Plant {
  id?: number;
  name: string;
  species?: string;
  photo_uri?: string;
  room: string;
  pot_size?: string;
  pot_material?: string;
  drainage?: number;
}

export const PlantDAO = {
  // Adicionar nova planta
  addPlant: async (plant: Plant) => {
    const sql = `
      INSERT INTO plants (name, species, photo_uri, room, pot_size, pot_material, drainage, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      plant.name,
      plant.species || '',
      plant.photo_uri || '',
      plant.room,
      plant.pot_size || 'Médio',
      plant.pot_material || 'Plástico',
      plant.drainage ? 1 : 0,
      new Date().toISOString()
    ];
    
    return await executeSql(sql, params);
  },

  // Listar todas as plantas
  getPlants: async () => {
    const result: any = await executeSql('SELECT * FROM plants ORDER BY created_at DESC');
    return result.rows._array;
  },

  // Pegar detalhes de uma planta específica
  getPlantById: async (id: number) => {
    const result: any = await executeSql('SELECT * FROM plants WHERE id = ?', [id]);
    return result.rows.item(0);
  },

  // Deletar planta (e por cascata, suas tarefas)
  deletePlant: async (id: number) => {
    return await executeSql('DELETE FROM plants WHERE id = ?', [id]);
  }
};