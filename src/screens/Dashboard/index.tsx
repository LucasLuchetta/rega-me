import React, { useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { usePlants } from '../../contexts/PlantContext';
import { Plus, Check, Clock, Droplets } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../utils/tw'; // Importe do nosso utilitário

export default function Dashboard() {
  const { dueTasks, completeTask, snoozeTask, completeAllInRoom, loading } = usePlants();
  const navigation = useNavigation<any>();

  const groupedTasks = dueTasks.reduce((acc: any, task) => {
    const room = task.room || 'Sem local';
    if (!acc[room]) acc[room] = [];
    acc[room].push(task);
    return acc;
  }, {});

  const sections = Object.keys(groupedTasks).map(room => ({
    title: room,
    data: groupedTasks[room]
  }));

  const handleComplete = (taskId: number, frequency: number, name: string) => {
    completeTask(taskId, frequency, name);
  };

  const handleSnooze = (taskId: number, name: string) => {
    Alert.alert("Adiar Tarefa", `Adiar cuidado com ${name} por quanto tempo?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "1 Dia", onPress: () => snoozeTask(taskId, 1, name) },
      { text: "2 Dias", onPress: () => snoozeTask(taskId, 2, name) }
    ]);
  };

  const renderTask = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('PlantDetails', { plant: { 
        id: item.plant_id, 
        name: item.plant_name, 
        room: item.room,
      }})}
      style={tw`bg-white p-4 rounded-xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-100`}
    >
      <View style={tw`flex-row items-center flex-1`}>
        <View style={tw`p-3 rounded-full mr-4 ${item.type === 'water' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
          <Droplets color={item.type === 'water' ? "#3b82f6" : "#eab308"} size={24} />
        </View>
        <View>
          <Text style={tw`text-lg font-bold text-gray-800`}>{item.plant_name}</Text>
          <Text style={tw`text-gray-500 text-sm`}>
            {item.type === 'water' ? 'Regar' : 'Cuidar'} • {item.frequency_days}d
          </Text>
        </View>
      </View>
      
      <View style={tw`flex-row gap-2`}>
        <TouchableOpacity 
          onPress={() => handleSnooze(item.id, item.plant_name)}
          style={tw`bg-gray-100 p-3 rounded-full`}
        >
          <Clock color="#6b7280" size={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handleComplete(item.id, item.frequency_days, item.plant_name)}
          style={tw`bg-green-500 p-3 rounded-full`}
        >
          <Check color="white" size={20} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={tw`flex-row justify-between items-center mt-6 mb-3 px-1`}>
      <Text style={tw`text-xl font-bold text-gray-700 capitalize`}>{title}</Text>
      <TouchableOpacity 
        onPress={() => completeAllInRoom(title)}
        style={tw`flex-row items-center bg-green-light px-3 py-1 rounded-full`}
      >
        <Check size={14} color="#166534" />
        <Text style={tw`text-green-dark text-xs font-bold ml-1`}>Feito em Tudo</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`flex-1 px-5 pt-5`}>
        <View style={tw`flex-row justify-between items-center mb-2 mt-4`}>
          <View>
            <Text style={tw`text-3xl font-bold text-gray-800`}>Hoje 🌿</Text>
            <Text style={tw`text-gray-500`}>
              {dueTasks.length} tarefas pendentes
            </Text>
          </View>
        </View>

        {dueTasks.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center pb-20`}>
            <Text style={tw`text-gray-400 text-lg text-center`}>
              Tudo limpo por hoje! ☀️
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTask}
            renderSectionHeader={renderSectionHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            stickySectionHeadersEnabled={false}
          />
        )}

        <TouchableOpacity 
          onPress={() => navigation.navigate('AddPlant')}
          style={tw`absolute bottom-6 right-6 bg-green-600 w-14 h-14 rounded-full justify-center items-center shadow-lg`}
        >
          <Plus color="white" size={30} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}