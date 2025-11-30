import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';
import { PlantDAO, Plant } from '../database/PlantDAO';
import { TaskDAO, Task } from '../database/TaskDAO';

// Definição do tipo do Contexto
interface PlantContextData {
  plants: Plant[];
  dueTasks: any[]; // Tarefas para hoje/atrasadas
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
  const [loading, setLoading] = useState(true);

  // Carrega todos os dados do banco para a memória
  const loadData = async () => {
    setLoading(true);
    try {
      const plantsData = await PlantDAO.getPlants();
      const tasksData = await TaskDAO.getDueTasks();
      
      setPlants(plantsData);
      setDueTasks(tasksData.rows._array); // Ajuste para formato do expo-sqlite antigo/novo
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
      
      // Se tivermos ID (inserção sucesso), criamos tarefas padrão (Ex: Rega)
      // Nível 1: Cria uma tarefa de rega padrão de 7 dias
      if (result.insertId) {
        await TaskDAO.addTask({
          plant_id: result.insertId,
          type: 'water',
          frequency_days: 7, // Default inicial
          next_due: new Date().toISOString()
        });
      }
      
      await loadData(); // Atualiza a UI
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao adicionar planta.");
    }
  };

  // Remover Planta
  const removePlant = async (id: number) => {
    try {
      await PlantDAO.deletePlant(id);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  // Marcar Tarefa como Feita
  const completeTask = async (taskId: number, frequency: number) => {
    try {
      await TaskDAO.completeTask(taskId, frequency);
      await loadData(); // Atualiza a lista de tarefas pendentes
    } catch (error) {
      console.error(error);
    }
  };

  // Carregar dados na montagem do provider
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

// Hook personalizado para usar o contexto facilmente
export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlants deve ser usado dentro de um PlantProvider');
  }
  return context;
};