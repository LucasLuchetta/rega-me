// src/contexts/PlantContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { PlantDAO, Plant } from '../database/PlantDAO';
import { TaskDAO, Task } from '../database/TaskDAO';
import { executeSql } from '../database/db'; // Import direto para fotos
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
  anticipateTask: (taskId: number, frequency: number, plantName?: string) => Promise<void>; // Nova
  completeAllInRoom: (room: string) => Promise<void>;
  addTaskToPlant: (task: Task) => Promise<void>;
  getPlantTasks: (plantId: number) => Promise<any[]>;
  getHistory: () => Promise<any[]>;
  addPlantPhoto: (plantId: number, uri: string) => Promise<void>; // Nova
  getPlantPhotos: (plantId: number) => Promise<any[]>; // Nova
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
      // Busca todas as tarefas pendentes daquele quarto
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
      if (plantName) {
          const secondsUntilNext = frequency * 24 * 60 * 60;
          await NotificationService.scheduleWateringReminder(plantName, secondsUntilNext);
      }
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  // ANTECIPAR: Funciona igual completar, mas semanticamente diferente para o usuário
  const anticipateTask = async (taskId: number, frequency: number, plantName?: string) => {
      // Ao antecipar, resetamos o ciclo a partir de HOJE
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

  // --- FOTOS ---
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
    NotificationService.requestPermissions();
  }, []);

  return (
    <PlantContext.Provider value={{ 
      plants, dueTasks, loading, loadData, addNewPlant, removePlant,
      completeTask, snoozeTask, anticipateTask, completeAllInRoom,
      addTaskToPlant, getPlantTasks, getHistory,
      addPlantPhoto, getPlantPhotos
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