// src/screens/Orakul/index.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, SafeAreaView } from 'react-native';
import { TaskDAO } from '../../database/TaskDAO';
import { CalendarDays, Droplets } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function Orakul() {
  const [futureTasks, setFutureTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados sempre que a tela ganhar foco
  const loadFuture = async () => {
    setLoading(true);
    try {
      // @ts-ignore: Ajuste de tipagem do expo-sqlite antigo/novo
      const result = await TaskDAO.getFutureTasks(7); // Próximos 7 dias
      setFutureTasks(result.rows?._array || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFuture();
    }, [])
  );

  // Função para formatar data (ex: "Quarta, 12/05")
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white p-4 rounded-xl mb-3 flex-row items-center border-l-4 border-green-500 shadow-sm">
      <View className="mr-4 items-center justify-center bg-gray-100 w-12 h-12 rounded-lg">
         {/* Ícone baseado no tipo de tarefa - por enquanto só Water */}
         <Droplets size={20} color="#4ade80" />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-gray-800 text-lg">{item.plant_name}</Text>
        <Text className="text-gray-500 uppercase text-xs font-semibold tracking-wider">
          {item.type === 'water' ? 'Rega' : item.type}
        </Text>
      </View>
      <View className="bg-green-100 px-3 py-1 rounded-full">
        <Text className="text-green-800 font-bold text-xs">{formatDate(item.next_due)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-5">
        <View className="mb-6 flex-row items-center">
          <CalendarDays color="#166534" size={28} />
          <Text className="text-2xl font-bold text-gray-800 ml-3">Orakul</Text>
        </View>
        
        <Text className="text-gray-500 mb-4">Previsão para os próximos 7 dias</Text>

        {futureTasks.length === 0 ? (
          <View className="flex-1 justify-center items-center opacity-50">
            <Text className="text-lg text-gray-400">Nada previsto. O futuro é incerto...</Text>
          </View>
        ) : (
          <FlatList
            data={futureTasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadFuture} colors={['#4ade80']} />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}