// src/contexts/PlantContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';
import { PlantDAO, Plant } from '../database/PlantDAO';
import { TaskDAO } from '../database/TaskDAO';
import { NotificationService } from '../services/NotificationService';

// Interface estendida para incluir dados do formulário que não estão na interface base Plant (como frequency)
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
      // 1. Salvar Planta
      const result = await PlantDAO.addPlant({
        name: plantData.name,
        species: plantData.species,
        room: plantData.room,
        photo_uri: plantData.photo_uri,
        pot_size: plantData.pot_size,
        pot_material: plantData.pot_material,
        drainage: plantData.drainage
      });
      
      // 2. Criar Tarefa de Rega Inicial
      if (result.insertId) {
        const nextDueDate = new Date();
        // A primeira rega é "hoje" ou definida pelo usuário? Vamos assumir hoje para teste, ou daqui a X dias.
        // Para o fluxo inicial, vamos assumir que a pessoa acabou de cuidar ou quer ser lembrada daqui a X dias.
        nextDueDate.setDate(nextDueDate.getDate() + plantData.frequencyDays);

        await TaskDAO.addTask({
          plant_id: result.insertId,
          type: 'water',
          frequency_days: plantData.frequencyDays,
          next_due: nextDueDate.toISOString()
        });

        // 3. Agendar Notificação (Convertendo dias para segundos para teste rápido, ou dias reais)
        // NOTA: Para produção, use dias * 24 * 60 * 60. Para TESTE, vou usar segundos.
        // Mude abaixo para dias reais quando for lançar.
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

  const completeTask = async (taskId: number, frequency: number, plantName: string) => {
    try {
      await TaskDAO.completeTask(taskId, frequency);
      
      // Reagendar notificação para o próximo ciclo
      const secondsUntilNext = frequency * 24 * 60 * 60;
      await NotificationService.scheduleWateringReminder(plantName, secondsUntilNext);

      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
    NotificationService.requestPermissions(); // Pede permissão ao iniciar
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
  if (!context) throw new Error('usePlants deve ser usado dentro de um PlantProvider');
  return context;
};