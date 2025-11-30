import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { PlantDAO, Plant } from '../database/PlantDAO';
import { TaskDAO, Task } from '../database/TaskDAO';
import { NotificationService } from '../services/NotificationService';

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
  completeTask: (taskId: number, frequency: number, plantName: string) => Promise<void>;
  snoozeTask: (taskId: number, days: number, plantName: string) => Promise<void>;
  completeAllInRoom: (room: string) => Promise<void>;
  addTaskToPlant: (task: Task) => Promise<void>;
  getPlantTasks: (plantId: number) => Promise<any[]>;
}

const PlantContext = createContext<PlantContextData>({} as PlantContextData);

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const plantsData = await PlantDAO.getPlants();
      const tasksData = await TaskDAO.getDueTasks();
      
      setPlants(plantsData);
      // @ts-ignore
      setDueTasks(tasksData.rows?._array || []); 
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNewPlant = async (plantData: PlantData) => {
    try {
      const result = await PlantDAO.addPlant({
        name: plantData.name,
        species: plantData.species,
        room: plantData.room,
        photo_uri: plantData.photo_uri,
        pot_size: plantData.pot_size,
        pot_material: plantData.pot_material,
        drainage: plantData.drainage
      });
      
      if (result.insertId) {
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + plantData.frequencyDays);

        await TaskDAO.addTask({
          plant_id: result.insertId,
          type: 'water',
          frequency_days: plantData.frequencyDays,
          next_due: nextDueDate.toISOString()
        });

        const secondsUntilNotify = plantData.frequencyDays * 24 * 60 * 60; 
        await NotificationService.scheduleWateringReminder(plantData.name, secondsUntilNotify);
      }
      
      await loadData();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao adicionar planta.");
    }
  };

  // Adicionar tarefa extra (Multitarefa)
  const addTaskToPlant = async (task: Task) => {
    try {
      await TaskDAO.addTask(task);
      await loadData();
      
      // Opcional: Agendar notificação para essa nova tarefa também
      // await NotificationService.schedule...
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao adicionar tarefa.");
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

  const removePlant = async (id: number) => {
    try {
      await PlantDAO.deletePlant(id);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const completeTask = async (taskId: number, frequency: number, plantName: string) => {
    try {
      await TaskDAO.completeTask(taskId, frequency);
      const secondsUntilNext = frequency * 24 * 60 * 60;
      await NotificationService.scheduleWateringReminder(plantName, secondsUntilNext);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  // NOVO: Snooze
  const snoozeTask = async (taskId: number, days: number, plantName: string) => {
    try {
      await TaskDAO.snoozeTask(taskId, days);
      
      // Reagendar notificação para daqui a X dias
      const secondsUntilNext = days * 24 * 60 * 60;
      await NotificationService.scheduleWateringReminder(plantName, secondsUntilNext);
      
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  // NOVO: Completar todas do ambiente
  const completeAllInRoom = async (room: string) => {
    try {
      // Filtra tarefas atrasadas desse ambiente
      const tasksInRoom = dueTasks.filter(t => t.room === room);
      
      // Executa tudo em paralelo
      const promises = tasksInRoom.map(t => 
        completeTask(t.id, t.frequency_days, t.plant_name)
      );
      
      await Promise.all(promises);
      Alert.alert("Sucesso", `Todas as plantas da ${room} foram cuidadas! 🌱`);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao concluir tarefas do ambiente.");
    }
  };

  useEffect(() => {
    loadData();
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
      getPlantTasks
    }}>
      {children}
    </PlantContext.Provider>
  );
};

export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) throw new Error('usePlants deve ser usado dentro de um PlantProvider');
  return context;
};