import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { usePlants } from '../../contexts/PlantContext';
import { useFocusEffect } from '@react-navigation/native';
import { Trophy, Sprout, CheckCircle2, Flame, Award } from 'lucide-react-native';
import tw from '../../utils/tw';

export default function Profile() {
  const { plants, getHistory } = usePlants();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    if (!getHistory) return;
    setLoading(true);
    const data = await getHistory();
    setHistory(data);
    setLoading(false);
  };

  const totalTasks = history.length;
  const level = Math.floor(totalTasks / 10) + 1;
  const xpCurrent = totalTasks % 10;
  const xpNextLevel = 10;
  const progressPercent = (xpCurrent / xpNextLevel) * 100;

  const calculateStreak = () => {
    if (history.length === 0) return 0;
    const dates = history.map(h => h.date_performed.split('T')[0]);
    const uniqueDates = [...new Set(dates)].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;
    let currentDate = new Date(uniqueDates[0]);
    for (let i = 0; i < uniqueDates.length; i++) {
      const d = new Date(uniqueDates[i]);
      const diffTime = Math.abs(currentDate.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays <= 1) {
        if (diffDays === 1) streak++;
        currentDate = d;
      } else { break; }
    }
    return streak > 0 || uniqueDates[0] === today ? streak + 1 : streak; 
  };

  const currentStreak = calculateStreak();
  const getTitle = () => {
    if (level < 5) return "Jardineiro Iniciante";
    if (level < 10) return "Amante da Natureza";
    if (level < 20) return "Mão Verde";
    return "Mestre Botânico";
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}>
        <View style={tw`bg-white p-6 mb-4 rounded-b-3xl shadow-sm items-center`}>
          <View style={tw`bg-green-light w-24 h-24 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm`}>
            <Trophy size={40} color="#166534" />
          </View>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Você</Text>
          <Text style={tw`text-green-600 font-medium mb-6`}>{getTitle()}</Text>
          <View style={tw`w-full max-w-xs`}>
            <View style={tw`flex-row justify-between mb-1`}>
              <Text style={tw`text-xs text-gray-500 font-bold`}>Nível {level}</Text>
              <Text style={tw`text-xs text-gray-400`}>{xpCurrent}/{xpNextLevel} XP</Text>
            </View>
            <View style={tw`h-3 bg-gray-200 rounded-full overflow-hidden`}>
              <View style={[tw`h-full bg-green-500 rounded-full`, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={tw`text-xs text-gray-400 mt-1 text-center`}>Faltam {xpNextLevel - xpCurrent} cuidados para o nível {level + 1}</Text>
          </View>
        </View>

        <View style={tw`px-5 mb-6`}>
          <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>Estatísticas</Text>
          <View style={tw`flex-row flex-wrap justify-between`}>
            <View style={tw`w-[48%] bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100`}>
              <View style={tw`bg-green-light w-10 h-10 rounded-full items-center justify-center mb-2`}>
                <Sprout size={20} color="#166534" />
              </View>
              <Text style={tw`text-2xl font-bold text-gray-800`}>{plants.length}</Text>
              <Text style={tw`text-gray-500 text-xs`}>Plantas Vivas</Text>
            </View>
            <View style={tw`w-[48%] bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100`}>
              <View style={tw`bg-blue-100 w-10 h-10 rounded-full items-center justify-center mb-2`}>
                <CheckCircle2 size={20} color="#1e40af" />
              </View>
              <Text style={tw`text-2xl font-bold text-gray-800`}>{totalTasks}</Text>
              <Text style={tw`text-gray-500 text-xs`}>Cuidados Feitos</Text>
            </View>
            <View style={tw`w-full bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex-row items-center justify-between`}>
              <View>
                <Text style={tw`text-2xl font-bold text-gray-800`}>{currentStreak} dias</Text>
                <Text style={tw`text-gray-500 text-xs`}>Sequência (Streak)</Text>
              </View>
              <View style={tw`bg-orange-100 w-12 h-12 rounded-full items-center justify-center`}>
                <Flame size={24} color="#ea580c" />
              </View>
            </View>
          </View>
        </View>

        <View style={tw`px-5`}>
          <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>Conquistas</Text>
          <View style={tw`bg-white p-4 rounded-xl flex-row items-center mb-2 opacity-100`}>
            <Award size={24} color="#eab308" style={tw`mr-4`} />
            <View>
              <Text style={tw`font-bold text-gray-800`}>Primeiros Passos</Text>
              <Text style={tw`text-gray-500 text-xs`}>Cadastrou a primeira planta</Text>
            </View>
          </View>
          <View style={tw`bg-white p-4 rounded-xl flex-row items-center mb-2 ${level < 5 ? 'opacity-50' : 'opacity-100'}`}>
            <Award size={24} color={level < 5 ? "#9ca3af" : "#eab308"} style={tw`mr-4`} />
            <View>
              <Text style={tw`font-bold text-gray-800`}>Mão Verde</Text>
              <Text style={tw`text-gray-500 text-xs`}>Alcançou o nível 5</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}