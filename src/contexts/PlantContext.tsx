import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react'; // Importação explícita de tipo
import { Alert } from 'react-native';
import { PlantDAO, Plant } from '../database/PlantDAO';
import { TaskDAO } from '../database/TaskDAO';

// Definição do tipo do Contexto
interface PlantContextData {
  plants: Plant[];
  dueTasks: any[];
  loading: boolean;
  loadData: () => Promise<void>;
  addNewPlant: (plant: Plant) => Promise<void>;
  removePlant: (id: number) => Promise<void>;
  completeTask: (taskId: number, frequency: number) => Promise<void>;
}

const PlantContext = createContext<PlantContextData>({} as PlantContextData);

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Carrega todos os dados do banco para a memória
  const loadData = async () => {
    setLoading(true);
    try {
      const plantsData = await PlantDAO.getPlants();
      const tasksData = await TaskDAO.getDueTasks();
      
      setPlants(plantsData);
      // @ts-ignore: Ajuste de compatibilidade para diferentes versões do expo-sqlite
      setDueTasks(tasksData.rows?._array || []); 
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      Alert.alert("Erro", "Não foi possível carregar seu jardim.");
    } finally {
      setLoading(false);
    }
  };

  // Adicionar Planta e Recarregar Lista
  const addNewPlant = async (plant: Plant) => {
    try {
      const result = await PlantDAO.addPlant(plant);
      
      if (result.insertId) {
        await TaskDAO.addTask({
          plant_id: result.insertId,
          type: 'water',
          frequency_days: 7, // Default caso não venha no objeto
          next_due: new Date().toISOString()
        });
      }
      
      await loadData();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao adicionar planta.");
    }
  };

  const removePlant = async (id: number) => {
    try {
      await PlantDAO.deletePlant(id);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const completeTask = async (taskId: number, frequency: number) => {
    try {
      await TaskDAO.completeTask(taskId, frequency);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <PlantContext.Provider value={{ 
      plants, 
      dueTasks, 
      loading, 
      loadData, 
      addNewPlant, 
      removePlant,
      completeTask 
    }}>
      {children}
    </PlantContext.Provider>
  );
};

export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlants deve ser usado dentro de um PlantProvider');
  }
  return context;
};