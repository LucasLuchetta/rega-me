import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { PlantDAO, Plant } from '../database/PlantDAO';
import { TaskDAO, Task } from '../database/TaskDAO';
import { executeSql } from '../database/db';
import { NotificationService } from '../services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@plantcare_notification_settings';

interface PlantData extends Plant {
  frequencyDays: number;
  fertilizeFrequency?: number;
  pruneFrequency?: number;
  mistFrequency?: number;
  pesticideFrequency?: number;
  repotFrequency?: number;
}

interface NotificationSettings {
  times: string[];
}

interface PlantContextData {
  plants: Plant[];
  dueTasks: any[];
  loading: boolean;
  notificationSettings: NotificationSettings;
  loadData: () => Promise<void>;
  updateNotificationSettings: (times: string[]) => Promise<void>;
  addNewPlant: (plantData: PlantData) => Promise<void>;
  removePlant: (id: number) => Promise<void>;
  completeTask: (taskId: number, frequency: number, plantName?: string, type?: string) => Promise<void>;
  snoozeTask: (taskId: number, days: number, plantName?: string, taskType?: string) => Promise<void>;
  anticipateTask: (taskId: number, frequency: number, plantName?: string) => Promise<void>;
  completeAllInRoom: (room: string) => Promise<void>;
  addTaskToPlant: (task: Task) => Promise<void>;
  getPlantTasks: (plantId: number) => Promise<any[]>;
  getHistory: () => Promise<any[]>;
  getPlantHistory: (plantId: number) => Promise<any[]>;
  addPlantPhoto: (plantId: number, uri: string) => Promise<void>;
  removePlantPhoto: (photoId: number) => Promise<void>;
  getPlantPhotos: (plantId: number) => Promise<any[]>;
  updatePlant: (plant: Plant, frequency?: number) => Promise<void>;
  removeTask: (taskId: number) => Promise<void>;
}

const PlantContext = createContext<PlantContextData>({} as PlantContextData);

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
      times: ['08:00']
  });

  const loadNotificationSettings = async () => {
      try {
          const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
          if (savedSettings) {
              const parsed = JSON.parse(savedSettings);
              // Migration logic: check if it's the old format (object with 'time' and 'frequency')
              if (parsed.times && Array.isArray(parsed.times)) {
                  setNotificationSettings({ times: parsed.times });
              } else if (parsed.time) {
                  // Migrate old single time
                  const times = [parsed.time];
                  // If old frequency was 2, we could add a second time, but simplified to just primary time is safer
                  // or: if (parsed.frequency > 1) times.push('17:00'); // arbitrary logic
                  setNotificationSettings({ times });
              }
          }
      } catch (e) {
          console.log("Error loading notification settings", e);
      }
  };

  const updateNotificationSettings = async (times: string[]) => {
      try {
          const newSettings = { times };
          await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
          setNotificationSettings(newSettings);
          // Resync notifications when user changes preferred times
          await resyncNotifications();
      } catch (e) {
          console.error("Failed to save notification settings", e);
      }
  };

  // Helper to calculate target notification date based on user settings
  const calculateTargetDate = (days: number): Date[] => {
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);

      const dates: Date[] = [];
      const times = notificationSettings.times || ['08:00'];

      times.forEach(timeStr => {
          const [h, m] = timeStr.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) {
              const date = new Date(targetDate);
              date.setHours(h, m, 0, 0);
              dates.push(date);
          }
      });

      return dates;
  };

  const resyncNotifications = async () => {
    try {
      console.log('Resyncing notifications...');
      await NotificationService.cancelAll();
      const result: any = await TaskDAO.getAllFutureTasks();
      const tasks = result.rows?._array || [];

      for (const task of tasks) {
        if (!task.next_due) continue;

        // Use the due date but apply the user's preferred times
        const dueDate = new Date(task.next_due);
        const times = notificationSettings.times || ['08:00'];

        for (const timeStr of times) {
           const [h, m] = timeStr.split(':').map(Number);
           const triggerDate = new Date(dueDate);
           triggerDate.setHours(h, m, 0, 0);

           if (triggerDate > new Date()) {
               await NotificationService.scheduleWateringReminder(task.plant_name, triggerDate, task.type);
           }
        }
      }
    } catch (error) {
      console.error("Error resyncing notifications:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await loadNotificationSettings();
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
        const plantId = result.insertId;

        // Mapeamento dos campos vindos do formulário para os tipos de tarefa
        const careTasks = [
          { type: 'water', freq: plantData.frequencyDays },
          { type: 'fertilize', freq: plantData.fertilizeFrequency },
          { type: 'prune', freq: plantData.pruneFrequency },
          { type: 'mist', freq: plantData.mistFrequency },
          { type: 'pesticide', freq: plantData.pesticideFrequency },
          { type: 'repot', freq: plantData.repotFrequency },
        ];

        // Itera sobre cada cuidado e salva no banco se houver frequência definida
        for (const task of careTasks) {
          if (task.freq && task.freq > 0) {
            const nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + task.freq);

            // Salva a tarefa no Banco de Dados
            await TaskDAO.addTask({
              plant_id: plantId,
              type: task.type as any,
              frequency_days: task.freq,
              next_due: nextDue.toISOString()
            });
          }
        }
      }
      await loadData();
      // Resync notifications AFTER data is loaded to reflect new tasks
      await resyncNotifications();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao adicionar planta.");
    }
  };

  const removePlant = async (id: number) => {
    try {
      await PlantDAO.deletePlant(id);
      await loadData();
      // Resync notifications AFTER plant is deleted
      await resyncNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const updatePlant = async (plant: Plant, frequency?: number) => {
    try {
      await PlantDAO.updatePlant(plant);
      if (frequency && plant.id) {
          await TaskDAO.updateTaskFrequency(plant.id, 'water', frequency);
      }
      await loadData();
      // Resync notifications AFTER plant is updated
      await resyncNotifications();
    } catch (error) {
      console.error("Erro ao atualizar planta:", error);
      Alert.alert("Erro", "Falha ao atualizar planta.");
    }
  };

  const removeTask = async (taskId: number) => {
    try {
      await TaskDAO.deleteTask(taskId);
      await loadData();
      // Resync notifications AFTER data is updated
      await resyncNotifications();
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
      Alert.alert("Erro", "Falha ao deletar tarefa.");
    }
  };

  const addTaskToPlant = async (task: Task) => {
    try {
      await TaskDAO.addTask(task);
      await loadData();
      // Resync notifications AFTER data is loaded
      await resyncNotifications();
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

  const snoozeTask = async (taskId: number, days: number, plantName?: string, taskType?: string) => {
    try {
      await TaskDAO.snoozeTask(taskId, days);
      await loadData();
      // Resync notifications AFTER data is updated
      await resyncNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const completeAllInRoom = async (room: string) => {
    try {
      const tasksInRoom = dueTasks.filter(t => t.room === room);
      for (const task of tasksInRoom) {
        await TaskDAO.completeTask(task.id, task.frequency_days);
      }
      await loadData();
      // Single resync AFTER all tasks in room are completed
      await resyncNotifications();
      Alert.alert("Sucesso", `Todas as plantas da ${room} foram cuidadas! 🌱`);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível atualizar o ambiente.");
    }
  };

  const completeTask = async (taskId: number, frequency: number, plantName?: string, type: string = 'water') => {
    try {
      await TaskDAO.completeTask(taskId, frequency);
      await loadData();
      // Resync notifications AFTER data is updated
      await resyncNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const anticipateTask = async (taskId: number, frequency: number, plantName?: string, taskType?: string) => {
      await completeTask(taskId, frequency, plantName, taskType);
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
    const initializeApp = async () => {
      await loadData();
      await resyncNotifications();
      NotificationService.requestPermissions();
    };
    initializeApp();
  }, []);

  const value = React.useMemo(() => ({
    plants, dueTasks, loading, notificationSettings, loadData, updateNotificationSettings,
    addNewPlant, removePlant, completeTask, snoozeTask, anticipateTask, completeAllInRoom,
    addTaskToPlant, getPlantTasks, getHistory, getPlantHistory,
    addPlantPhoto, removePlantPhoto, getPlantPhotos,
    updatePlant, removeTask
  }), [plants, dueTasks, loading, notificationSettings]);

  return (
    <PlantContext.Provider value={value}>
      {children}
    </PlantContext.Provider>
  );
};

export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) throw new Error('usePlants deve ser usado dentro de um PlantProvider');
  return context;
};
