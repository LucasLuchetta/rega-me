// src/contexts/PlantContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { PlantDAO, Plant } from '../database/PlantDAO';
import { TaskDAO, Task } from '../database/TaskDAO';
import { NotificationService } from '../services/NotificationService';

// Interface para dados do formulário de adição (estende a interface do banco)
interface PlantData extends Plant {
  frequencyDays: number;
}

interface PlantContextData {
  plants: Plant[];
  dueTasks: any[];
  loading: boolean;
  loadData: () => Promise<void>;
  addNewPlant: (plantData: PlantData) => Promise<void>;
  removePlant: (id: number) => Promise<void>;
  completeTask: (taskId: number, frequency: number, plantName?: string) => Promise<void>;
  // Novas funcionalidades avançadas
  snoozeTask: (taskId: number, days: number, plantName?: string) => Promise<void>;
  completeAllInRoom: (room: string) => Promise<void>;
  addTaskToPlant: (task: Task) => Promise<void>;
  getPlantTasks: (plantId: number) => Promise<any[]>;
  getHistory: () => Promise<any[]>;
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
    } finally {
      setLoading(false);
    }
  };

  // Adicionar Planta e Recarregar Lista
  const addNewPlant = async (plantData: PlantData) => {
    try {
      // 1. Salvar Planta no Banco
      const result = await PlantDAO.addPlant({
        name: plantData.name,
        species: plantData.species,
        room: plantData.room,
        photo_uri: plantData.photo_uri,
        pot_size: plantData.pot_size,
        pot_material: plantData.pot_material,
        drainage: plantData.drainage
      });
      
      // 2. Criar Tarefa de Rega Inicial automaticamente
      if (result.insertId) {
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + plantData.frequencyDays);

        await TaskDAO.addTask({
          plant_id: result.insertId,
          type: 'water',
          frequency_days: plantData.frequencyDays,
          next_due: nextDueDate.toISOString()
        });

        // 3. Agendar Notificação
        // Nota: frequencyDays * 24 * 60 * 60 converte dias em segundos
        const secondsUntilNotify = plantData.frequencyDays * 24 * 60 * 60; 
        await NotificationService.scheduleWateringReminder(plantData.name, secondsUntilNotify);
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

  // --- MULTITAREFA ---
  
  const addTaskToPlant = async (task: Task) => {
    try {
      await TaskDAO.addTask(task);
      await loadData();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao adicionar tarefa extra.");
    }
  };

  const getPlantTasks = async (plantId: number) => {
    try {
      const result: any = await TaskDAO.getTasksByPlantId(plantId);
      return result.rows._array || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  // --- AÇÕES DO DASHBOARD (SNOOZE, COMPLETAR, QUARTO) ---

  const snoozeTask = async (taskId: number, days: number, plantName?: string) => {
    try {
      await TaskDAO.snoozeTask(taskId, days);
      
      // Reagendar notificação para a nova data
      if (plantName) {
         const secondsUntilNext = days * 24 * 60 * 60;
         await NotificationService.scheduleWateringReminder(plantName, secondsUntilNext);
      }
      
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const completeAllInRoom = async (room: string) => {
    try {
      const tasksInRoom = dueTasks.filter(t => t.room === room);
      
      // Executa todas as atualizações em paralelo
      const promises = tasksInRoom.map(t => 
        completeTask(t.id, t.frequency_days, t.plant_name)
      );
      
      await Promise.all(promises);
      Alert.alert("Sucesso", `Todas as plantas da ${room} foram cuidadas! 🌱`);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível atualizar o ambiente.");
    }
  };

  const completeTask = async (taskId: number, frequency: number, plantName?: string) => {
    try {
      await TaskDAO.completeTask(taskId, frequency);
      
      // Reagendar notificação para o próximo ciclo
      if (plantName) {
          const secondsUntilNext = frequency * 24 * 60 * 60;
          await NotificationService.scheduleWateringReminder(plantName, secondsUntilNext);
      }
      
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  // --- HISTÓRICO PARA GAMIFICAÇÃO ---
  const getHistory = async () => {
    try {
      const result: any = await TaskDAO.getHistory();
      return result.rows?._array || []; 
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
    }
  };

  useEffect(() => {
    loadData();
    // Solicita permissão de notificação ao iniciar o app
    NotificationService.requestPermissions();
  }, []);

  return (
    <PlantContext.Provider value={{ 
      plants, 
      dueTasks, 
      loading, 
      loadData, 
      addNewPlant, 
      removePlant,
      completeTask,
      snoozeTask,
      completeAllInRoom,
      addTaskToPlant,
      getPlantTasks,
      getHistory
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