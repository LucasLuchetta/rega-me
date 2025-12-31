import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlants } from '../../contexts/PlantContext';
import { Leaf, Sun, Clock, Check, ArrowRight, Trophy, Flame, History, Droplets, Scissors, Box, CheckCircle2, Sprout, User, Bell, Plus, Trash2 } from 'lucide-react-native';
import tw from '../../utils/tw';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from '../../services/NotificationService';

// Keys for persistence
const PROFILE_KEY = '@plantcare_profile';

export default function Profile() {
  // Use a state to toggle between Setup and Profile
  const [hasProfile, setHasProfile] = useState(false);
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    name: '',
    skill: '',
    environment: '',
    commitment: '',
  });

  const navigation = useNavigation();

  // Load profile on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          // Ensure name exists if it was saved before this update
          setProfileData({ name: '', ...parsed });
          setHasProfile(true);
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    };
    checkProfile();
  }, []);

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
      setHasProfile(true);
      // Ask user to add plants
      Alert.alert(
        "Perfil Criado! 🌿",
        "Agora que conhecemos você, que tal adicionar as plantas que você já tem em casa?",
        [
            { text: "Agora não", style: 'cancel' },
            { text: "Vamos lá!", onPress: () => navigation.navigate('Dashboard') }
        ]
      );
    } catch (e) {
      console.error("Failed to save profile", e);
    }
  };

  if (!hasProfile) {
    return (
      <SafeAreaView style={tw`flex-1 bg-canvas`}>
        <ScrollView contentContainerStyle={tw`flex-grow`}>
          <View style={tw`flex-1 px-6 pt-10`}>
            <Text style={tw`font-headline text-3xl text-sage-900 mb-2`}>
              Bem-vindo ao seu Jardim
            </Text>
            <Text style={tw`font-body text-gray-500 mb-8`}>
              Para criar o jardim perfeito, precisamos te conhecer um pouco melhor.
            </Text>

            {step === 1 && (
              <View>
                <Text style={tw`font-subheadline text-xl text-sage-700 mb-6`}>
                  Como você gostaria de ser chamado?
                </Text>

                <View style={tw`bg-white p-4 rounded-2xl border-2 border-sage-100 flex-row items-center mb-6`}>
                  <User size={24} color="#5D8C7B" style={tw`mr-3`} />
                  <TextInput
                    style={tw`flex-1 text-lg text-sage-900 font-bold`}
                    placeholder="Seu nome"
                    placeholderTextColor="#9CA3AF"
                    value={profileData.name}
                    onChangeText={(text) => setProfileData({...profileData, name: text})}
                  />
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={tw`font-subheadline text-xl text-sage-700 mb-6`}>
                  Qual seu nível com plantas?
                </Text>

                <Option
                  title="Mato até cacto"
                  subtitle="Preciso de plantas de aço."
                  icon={<Leaf size={24} color="#5D8C7B" />}
                  selected={profileData.skill === 'beginner'}
                  onPress={() => setProfileData({...profileData, skill: 'beginner'})}
                />
                <Option
                  title="Tenho algumas sobreviventes"
                  subtitle="Me viro bem, mas quero aprender."
                  icon={<Leaf size={24} color="#5D8C7B" />}
                  selected={profileData.skill === 'intermediate'}
                  onPress={() => setProfileData({...profileData, skill: 'intermediate'})}
                />
                <Option
                  title="Mestre Jardinheiro"
                  subtitle="Minha casa é uma selva."
                  icon={<Leaf size={24} color="#5D8C7B" />}
                  selected={profileData.skill === 'expert'}
                  onPress={() => setProfileData({...profileData, skill: 'expert'})}
                />
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={tw`font-subheadline text-xl text-sage-700 mb-6`}>
                  Como é o seu ambiente?
                </Text>

                <Option
                  title="Janela Ensolarada"
                  subtitle="Muita luz direta na maior parte do dia."
                  icon={<Sun size={24} color="#E59866" />}
                  selected={profileData.environment === 'sunny'}
                  onPress={() => setProfileData({...profileData, environment: 'sunny'})}
                />
                <Option
                  title="Sombra Parcial"
                  subtitle="Luz indireta ou filtrada."
                  icon={<Sun size={24} color="#A3BFB0" />}
                  selected={profileData.environment === 'partial'}
                  onPress={() => setProfileData({...profileData, environment: 'partial'})}
                />
                <Option
                  title="Luz Artificial"
                  subtitle="Pouca ou nenhuma luz natural."
                  icon={<Sun size={24} color="#9CA3AF" />}
                  selected={profileData.environment === 'low'}
                  onPress={() => setProfileData({...profileData, environment: 'low'})}
                />
              </View>
            )}

            {step === 4 && (
              <View>
                <Text style={tw`font-subheadline text-xl text-sage-700 mb-6`}>
                  Quanto tempo quer dedicar?
                </Text>

                <Option
                  title="Só no fim de semana"
                  subtitle="Quero algo que viva sozinho."
                  icon={<Clock size={24} color="#5D8C7B" />}
                  selected={profileData.commitment === 'low'}
                  onPress={() => setProfileData({...profileData, commitment: 'low'})}
                />
                <Option
                  title="Alguns minutos por dia"
                  subtitle="Posso regar e checar regularmente."
                  icon={<Clock size={24} color="#5D8C7B" />}
                  selected={profileData.commitment === 'medium'}
                  onPress={() => setProfileData({...profileData, commitment: 'medium'})}
                />
                <Option
                  title="É meu hobby principal"
                  subtitle="Quero cuidar, podar e propagar."
                  icon={<Clock size={24} color="#5D8C7B" />}
                  selected={profileData.commitment === 'high'}
                  onPress={() => setProfileData({...profileData, commitment: 'high'})}
                />
              </View>
            )}

            <View style={tw`flex-1 justify-end pb-8 mt-10`}>
              <TouchableOpacity
                style={tw`bg-sage-500 p-4 rounded-full flex-row items-center justify-center shadow-lg`}
                onPress={() => {
                  if (step === 1 && !profileData.name.trim()) {
                    Alert.alert("Nome necessário", "Por favor, diga-nos como te chamar.");
                    return;
                  }
                  if (step < 4) setStep(step + 1);
                  else handleFinish();
                }}
              >
                <Text style={tw`text-white font-bold text-lg mr-2`}>
                  {step === 4 ? "Finalizar Perfil" : "Continuar"}
                </Text>
                <ArrowRight size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <StandardProfile profileData={profileData} />;
}

const Option = ({ title, subtitle, icon, selected, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={tw`p-5 rounded-2xl mb-4 border-2 flex-row items-center ${selected ? 'border-sage-500 bg-sage-50' : 'border-gray-100 bg-white'}`}
  >
    <View style={tw`mr-4 bg-canvas p-3 rounded-full`}>
      {icon}
    </View>
    <View style={tw`flex-1`}>
      <Text style={tw`font-bold text-sage-900 text-lg`}>{title}</Text>
      <Text style={tw`text-gray-500 text-sm`}>{subtitle}</Text>
    </View>
    {selected && <Check size={24} color="#5D8C7B" />}
  </TouchableOpacity>
);

function StandardProfile({ profileData }: any) {
  const { plants, getHistory, notificationSettings, updateNotificationSettings } = usePlants();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Local state for immediate UI feedback, synced with context
  const [notifTimes, setNotifTimes] = useState<string[]>(notificationSettings.times || ['08:00']);

  useEffect(() => {
    if (notificationSettings.times && notificationSettings.times.length > 0) {
        setNotifTimes(notificationSettings.times);
    }
  }, [notificationSettings]);

  const loadData = async () => {
    if (!getHistory) return;
    setLoading(true);
    const data = await getHistory();
    setHistory(data || []);
    setLoading(false);
  };

  const handleTimeChange = (text: string, index: number) => {
      const newTimes = [...notifTimes];
      newTimes[index] = text;
      setNotifTimes(newTimes);

      // Save logic (could be debounced)
      // Only save if format is valid? Or just save all
      // We will update context with all strings, Context might filter invalid ones during calculation but saving raw is fine.
      updateNotificationSettings(newTimes);
  };

  const addTime = () => {
      const newTimes = [...notifTimes, '08:00'];
      setNotifTimes(newTimes);
      updateNotificationSettings(newTimes);
  };

  const removeTime = (index: number) => {
      const newTimes = [...notifTimes];
      newTimes.splice(index, 1);
      setNotifTimes(newTimes);
      updateNotificationSettings(newTimes);
  };

  // Trigger loadData on mount
  useEffect(() => { loadData(); }, []);

  const totalTasks = history.length;
  const level = Math.floor(totalTasks / 15) + 1;
  const xpCurrent = totalTasks % 15;
  const xpNextLevel = 15;
  const progressPercent = (xpCurrent / xpNextLevel) * 100;

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
    <SafeAreaView style={tw`flex-1 bg-canvas`}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}>
        
        {/* Header Profile */}
        <View style={tw`bg-white p-6 mb-6 rounded-b-[40px] shadow-sm items-center pt-8`}>
          <View style={tw`bg-sage-100 w-28 h-28 rounded-full items-center justify-center mb-4 border-4 border-white shadow-md relative`}>
            <Trophy size={48} color="#5D8C7B" />
            <View style={tw`absolute -bottom-2 bg-sage-600 px-3 py-1 rounded-full border-2 border-white`}>
                <Text style={tw`text-white font-bold text-xs`}>Lvl {level}</Text>
            </View>
          </View>
          <Text style={tw`font-headline text-2xl text-sage-900`}>{profileData.name || "Você"}</Text>
          <Text style={tw`text-sage-600 font-subheadline font-medium mb-6`}>{getTitle()}</Text>
          
          <View style={tw`w-full max-w-xs`}>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-xs text-gray-500 font-bold uppercase tracking-wide`}>Próximo Nível</Text>
              <Text style={tw`text-xs text-gray-400 font-medium`}>{xpCurrent}/{xpNextLevel} XP</Text>
            </View>
            <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200`}>
              <View style={[tw`h-full bg-sage-500 rounded-full`, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={tw`px-5 mb-6`}>
            <View style={tw`bg-white p-5 rounded-3xl shadow-sm border border-gray-50`}>
                <View style={tw`flex-row items-center mb-4`}>
                    <Bell size={20} color="#5D8C7B" />
                    <Text style={tw`text-lg font-bold text-gray-800 ml-2`}>Horários de Notificação</Text>
                </View>

                {notifTimes.map((time, index) => (
                    <View key={index} style={tw`flex-row justify-between items-center mb-3`}>
                        <View style={tw`bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex-1 mr-3`}>
                             <TextInput
                                style={tw`font-bold text-sage-900 text-lg text-center`}
                                value={time}
                                placeholder="08:00"
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                                onChangeText={(text) => handleTimeChange(text, index)}
                                accessibilityLabel={`Horário da notificação ${index + 1}`}
                             />
                        </View>
                        {notifTimes.length > 1 && (
                            <TouchableOpacity
                                onPress={() => removeTime(index)}
                                style={tw`p-3 bg-red-50 rounded-xl`}
                                accessibilityLabel={`Remover horário ${time}`}
                                accessibilityRole="button"
                            >
                                <Trash2 size={20} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                <TouchableOpacity
                    onPress={addTime}
                    style={tw`flex-row items-center justify-center p-3 rounded-xl border-2 border-dashed border-gray-300 mb-4`}
                >
                    <Plus size={20} color="#9CA3AF" />
                    <Text style={tw`text-gray-500 font-bold ml-2`}>Adicionar Horário</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => NotificationService.testNotification()}
                    style={tw`bg-sage-50 p-3 rounded-xl items-center border border-sage-100`}
                >
                    <Text style={tw`text-sage-700 font-bold`}>Testar Notificação Agora</Text>
                </TouchableOpacity>

            </View>
        </View>

        {/* Stats Grid */}
        <View style={tw`px-5 mb-6`}>
          <View style={tw`flex-row flex-wrap justify-between`}>
            
            <View style={tw`w-[48%] bg-white p-5 rounded-3xl shadow-sm mb-3 border border-gray-50`}>
              <View style={tw`bg-sage-50 w-10 h-10 rounded-xl items-center justify-center mb-3`}>
                <Sprout size={20} color="#5D8C7B" />
              </View>
              <Text style={tw`text-2xl font-bold text-gray-800`}>{plants.length}</Text>
              <Text style={tw`text-gray-400 text-xs font-medium`}>Plantas</Text>
            </View>

            <View style={tw`w-[48%] bg-white p-5 rounded-3xl shadow-sm mb-3 border border-gray-50`}>
              <View style={tw`bg-sky-50 w-10 h-10 rounded-xl items-center justify-center mb-3`}>
                <CheckCircle2 size={20} color="#0EA5E9" />
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
