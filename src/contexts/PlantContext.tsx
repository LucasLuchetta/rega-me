import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { PlantDAO, Plant } from '../database/PlantDAO';
import { TaskDAO, Task } from '../database/TaskDAO';
import { executeSql } from '../database/db';
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
  completeTask: (taskId: number, frequency: number, plantName?: string) => Promise<void>;
  snoozeTask: (taskId: number, days: number, plantName?: string) => Promise<void>;
  anticipateTask: (taskId: number, frequency: number, plantName?: string) => Promise<void>;
  completeAllInRoom: (room: string) => Promise<void>;
  addTaskToPlant: (task: Task) => Promise<void>;
  getPlantTasks: (plantId: number) => Promise<any[]>;
  getHistory: () => Promise<any[]>;
  getPlantHistory: (plantId: number) => Promise<any[]>; // Correção: Função exposta
  addPlantPhoto: (plantId: number, uri: string) => Promise<void>;
  removePlantPhoto: (photoId: number) => Promise<void>;
  getPlantPhotos: (plantId: number) => Promise<any[]>;
  updatePlant: (plant: Plant, frequency?: number) => Promise<void>;
}

const PlantContext = createContext<PlantContextData>({} as PlantContextData);

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const plantsData = await PlantDAO.getPlants();
      const tasksData = await TaskDAO.getDueTasks();
      setPlants(plantsData);
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

        // Agenda notificação (com tratamento de erro interno)
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

  const updatePlant = async (plant: Plant, frequency?: number) => {
    try {
      await PlantDAO.updatePlant(plant);
      if (frequency && plant.id) {
          // Assuming 'water' is the main task type we want to update the frequency for
          await TaskDAO.updateTaskFrequency(plant.id, 'water', frequency);
      }
      await loadData();
    } catch (error) {
      console.error("Erro ao atualizar planta:", error);
      Alert.alert("Erro", "Falha ao atualizar planta.");
    }
  };

  const addTaskToPlant = async (task: Task) => {
    try {
      await TaskDAO.addTask(task);
      if (task.next_due) {
          const now = new Date().getTime();
          const due = new Date(task.next_due).getTime();
          const diffSeconds = (due - now) / 1000;
          if (diffSeconds > 0) {
             const plant = plants.find(p => p.id === task.plant_id);
             if(plant) await NotificationService.scheduleWateringReminder(plant.name, diffSeconds);
          }
      }
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

  const snoozeTask = async (taskId: number, days: number, plantName?: string) => {
    try {
      await TaskDAO.snoozeTask(taskId, days);
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
      if (plantName && frequency > 0) {
          const secondsUntilNext = frequency * 24 * 60 * 60;
          await NotificationService.scheduleWateringReminder(plantName, secondsUntilNext);
      }
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const anticipateTask = async (taskId: number, frequency: number, plantName?: string) => {
      await completeTask(taskId, frequency, plantName);
  };

  const getHistory = async () => {
    try {
      const result: any = await TaskDAO.getHistory();
      return result.rows?._array || []; 
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
    }
  };

  // Correção: Buscando histórico específico
  const getPlantHistory = async (plantId: number) => {
    try {
      const result: any = await TaskDAO.getHistoryByPlantId(plantId);
      return result.rows?._array || [];
    } catch (error) {
      console.error("Erro ao buscar histórico da planta:", error);
      return [];
    }
  };

  const addPlantPhoto = async (plantId: number, uri: string) => {
    try {
      await executeSql(
        `INSERT INTO plant_photos (plant_id, photo_uri, created_at) VALUES (?, ?, ?)`,
        [plantId, uri, new Date().toISOString()]
      );
    } catch (error) {
      console.error("Erro ao salvar foto", error);
    }
  };

  const removePlantPhoto = async (photoId: number) => {
    try {
      await executeSql(`DELETE FROM plant_photos WHERE id = ?`, [photoId]);
    } catch (error) {
      console.error("Erro ao excluir foto", error);
    }
  };

  const getPlantPhotos = async (plantId: number) => {
    try {
      const result: any = await executeSql(
        `SELECT * FROM plant_photos WHERE plant_id = ? ORDER BY created_at DESC`,
        [plantId]
      );
      return result.rows._array || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  useEffect(() => {
    loadData();
    // Tentativa segura de pedir permissão
    NotificationService.requestPermissions();
  }, []);

  return (
    <PlantContext.Provider value={{ 
      plants, dueTasks, loading, loadData, addNewPlant, removePlant,
      completeTask, snoozeTask, anticipateTask, completeAllInRoom,
      addTaskToPlant, getPlantTasks, getHistory, getPlantHistory,
      addPlantPhoto, removePlantPhoto, getPlantPhotos,
      updatePlant
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