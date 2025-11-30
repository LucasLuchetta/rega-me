import React from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { usePlants } from '../../contexts/PlantContext';
import { Plus, Check, Droplets } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function Dashboard() {
  const { dueTasks, completeTask, loading } = usePlants();
  const navigation = useNavigation<any>();

  const handleComplete = (taskId: number, frequency: number) => {
    completeTask(taskId, frequency);
  };

  // Tipamos explicitamente o item como any aqui também para evitar erros
  const renderTask = ({ item }: { item: any }) => (
    <View className="bg-white p-4 rounded-xl mb-3 flex-row items-center justify-between shadow-sm border border-green-light">
      <View className="flex-row items-center flex-1">
        <View className="bg-green-light p-3 rounded-full mr-4">
          <Droplets color="#166534" size={24} />
        </View>
        <View>
          <Text className="text-lg font-bold text-gray-800">{item.plant_name}</Text>
          <Text className="text-gray-500 text-sm">
            {item.room} • Regar a cada {item.frequency_days} dias
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        onPress={() => handleComplete(item.id, item.frequency_days)}
        className="bg-green-500 p-3 rounded-full active:bg-green-700"
      >
        <Check color="white" size={20} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-5">
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <View>
            <Text className="text-3xl font-bold text-gray-800">Olá, Jardineiro! 🌿</Text>
            <Text className="text-gray-500">
              {dueTasks.length > 0 
                ? `Você tem ${dueTasks.length} tarefas hoje.` 
                : "Tudo em ordem por aqui."}
            </Text>
          </View>
        </View>

        {dueTasks.length === 0 ? (
          <View className="flex-1 justify-center items-center pb-20">
            <Text className="text-gray-400 text-lg text-center">
              Nenhuma planta precisa de cuidados agora.{"\n"}Aproveite o dia! ☀️
            </Text>
          </View>
        ) : (
          <FlatList
            data={dueTasks}
            // CORREÇÃO AQUI: Tipagem explícita para o item
            keyExtractor={(item: any) => item.id.toString()}
            renderItem={renderTask}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        <TouchableOpacity 
          onPress={() => navigation.navigate('AddPlant')}
          className="absolute bottom-6 right-6 bg-green-dark w-14 h-14 rounded-full justify-center items-center shadow-lg elevation-5"
        >
          <Plus color="white" size={30} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}