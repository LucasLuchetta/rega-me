import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlants } from '../../contexts/PlantContext';
import { useFocusEffect } from '@react-navigation/native';
import { Trophy, Sprout, CheckCircle2, Flame, Award, Shield, History, Droplets, Scissors, Box } from 'lucide-react-native';
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
  const level = Math.floor(totalTasks / 15) + 1;
  const xpCurrent = totalTasks % 15;
  const xpNextLevel = 15;
  const progressPercent = (xpCurrent / xpNextLevel) * 100;

  const calculateStreak = () => {
    if (history.length === 0) return 0;
    const dates = history.map(h => new Date(h.date_performed).toISOString().split('T')[0]);
    const uniqueDates = [...new Set(dates)].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;
    let currentDate = new Date(uniqueDates[0]);
    for (let i = 0; i < uniqueDates.length; i++) {
        if (i === 0) { streak++; continue; }
        const prevDate = new Date(uniqueDates[i]);
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) { streak++; currentDate = prevDate; } else { break; }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  const getTitle = () => {
    if (level < 5) return "Jardineiro Aprendiz";
    if (level < 15) return "Guardião da Natureza";
    if (level < 30) return "Mestre Botânico";
    return "Lenda Viva do Jardim";
  };

  const getTaskIcon = (type: string) => {
      switch(type) {
          case 'water': return <Droplets size={16} color="#3b82f6" />;
          case 'prune': return <Scissors size={16} color="#ef4444" />;
          case 'repot': return <Box size={16} color="#f97316" />;
          default: return <CheckCircle2 size={16} color="#166534" />;
      }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F3F4F6]`}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}>
        
        {/* Header Profile */}
        <View style={tw`bg-white p-6 mb-6 rounded-b-[40px] shadow-sm items-center pt-8`}>
          <View style={tw`bg-green-100 w-28 h-28 rounded-full items-center justify-center mb-4 border-4 border-white shadow-md relative`}>
            <Trophy size={48} color="#166534" />
            <View style={tw`absolute -bottom-2 bg-green-600 px-3 py-1 rounded-full border-2 border-white`}>
                <Text style={tw`text-white font-bold text-xs`}>Lvl {level}</Text>
            </View>
          </View>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Você</Text>
          <Text style={tw`text-green-600 font-medium mb-6`}>{getTitle()}</Text>
          
          <View style={tw`w-full max-w-xs`}>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-xs text-gray-500 font-bold uppercase tracking-wide`}>Próximo Nível</Text>
              <Text style={tw`text-xs text-gray-400 font-medium`}>{xpCurrent}/{xpNextLevel} XP</Text>
            </View>
            <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200`}>
              <View style={[tw`h-full bg-green-500 rounded-full`, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={tw`px-5 mb-6`}>
          <View style={tw`flex-row flex-wrap justify-between`}>
            {/* Streak Card - Cor sólida substituindo gradiente */}
            <View style={tw`w-full bg-orange-500 p-5 rounded-3xl shadow-lg shadow-orange-500/20 mb-4 flex-row items-center justify-between overflow-hidden relative`}>
                <View style={tw`absolute right-0 top-0 bottom-0 w-32 bg-white/10 -mr-10`} />
                <View>
                    <Text style={tw`text-white text-3xl font-extrabold`}>{currentStreak} dias</Text>
                    <Text style={tw`text-orange-100 text-xs font-bold uppercase`}>Sequência 🔥</Text>
                </View>
                <View style={tw`bg-white/20 p-3 rounded-2xl`}>
                    <Flame size={32} color="white" fill="white" />
                </View>
            </View>
            
            <View style={tw`w-[48%] bg-white p-5 rounded-3xl shadow-sm mb-3 border border-gray-50`}>
              <View style={tw`bg-green-50 w-10 h-10 rounded-xl items-center justify-center mb-3`}>
                <Sprout size={20} color="#166534" />
              </View>
              <Text style={tw`text-2xl font-bold text-gray-800`}>{plants.length}</Text>
              <Text style={tw`text-gray-400 text-xs font-medium`}>Plantas</Text>
            </View>

            <View style={tw`w-[48%] bg-white p-5 rounded-3xl shadow-sm mb-3 border border-gray-50`}>
              <View style={tw`bg-blue-50 w-10 h-10 rounded-xl items-center justify-center mb-3`}>
                <CheckCircle2 size={20} color="#1e40af" />
              </View>
              <Text style={tw`text-2xl font-bold text-gray-800`}>{totalTasks}</Text>
              <Text style={tw`text-gray-400 text-xs font-medium`}>Ações</Text>
            </View>
          </View>
        </View>

        {/* Histórico Recente */}
        <View style={tw`px-5 pb-10`}>
            <View style={tw`flex-row items-center mb-4`}>
                <History size={20} color="#374151" />
                <Text style={tw`text-lg font-bold text-gray-800 ml-2`}>Histórico Global</Text>
            </View>
            
            <View style={tw`bg-white rounded-2xl p-2 shadow-sm border border-gray-100`}>
                {history.slice(0, 10).map((item) => (
                    <View key={item.id} style={tw`p-3 border-b border-gray-50 flex-row items-center justify-between last:border-0`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`bg-gray-50 p-2 rounded-full mr-3`}>
                                {getTaskIcon(item.type)}
                            </View>
                            <View>
                                <Text style={tw`text-gray-800 font-medium`}>{item.plant_name}</Text>
                                <Text style={tw`text-gray-400 text-xs capitalize`}>
                                    {item.type === 'water' ? 'Rega' : item.type === 'fertilize' ? 'Adubo' : item.type}
                                </Text>
                            </View>
                        </View>
                        <Text style={tw`text-gray-400 text-xs`}>
                            {new Date(item.date_performed).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                        </Text>
                    </View>
                ))}
                {history.length === 0 && (
                    <Text style={tw`p-4 text-center text-gray-400`}>Nenhuma atividade registrada ainda.</Text>
                )}
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}