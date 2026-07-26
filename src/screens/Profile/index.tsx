import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Platform, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePlants } from '../../contexts/PlantContext';
import { History, Droplets, Scissors, Box, CheckCircle2, Sprout, User, Bell, BellOff, Plus, Trash2, Send } from 'lucide-react-native';
import tw from '../../utils/tw';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from '../../services/NotificationService';

const PROFILE_KEY = '@plantcare_profile';

/** "08:00" -> Date de hoje às 8h, para alimentar o seletor de horas. */
const timeToDate = (time: string) => {
  const [h, m] = (time || '').split(':').map(Number);
  const date = new Date();
  date.setHours(isNaN(h) ? 8 : h, isNaN(m) ? 0 : m, 0, 0);
  return date;
};

const dateToTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** Ordena e remove repetidos: dois lembretes no mesmo horário não fazem sentido. */
const normalizeTimes = (times: string[]) => Array.from(new Set(times)).sort();

export default function Profile() {
  const { plants, getHistory, notificationSettings, updateNotificationSettings } = usePlants();

  const [name, setName] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [times, setTimes] = useState<string[]>(notificationSettings.times || ['08:00']);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [scheduledCount, setScheduledCount] = useState(0);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (notificationSettings.times?.length) setTimes(notificationSettings.times);
  }, [notificationSettings]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(PROFILE_KEY);
        if (saved) setName(JSON.parse(saved).name || '');
      } catch (e) {
        if (__DEV__) console.warn('Falha ao carregar o perfil', e);
      }
    })();
  }, []);

  const refreshNotificationState = useCallback(async () => {
    setPermission(await NotificationService.getPermissionStatus());
    setScheduledCount(await NotificationService.countScheduled());
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (getHistory) setHistory((await getHistory()) || []);
      await refreshNotificationState();
    } finally {
      setLoading(false);
    }
  }, [getHistory, refreshNotificationState]);

  useEffect(() => { loadData(); }, []);

  const saveName = async (value: string) => {
    setName(value);
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ name: value }));
    } catch (e) {
      if (__DEV__) console.warn('Falha ao salvar o nome', e);
    }
  };

  const commitTimes = async (next: string[]) => {
    const normalized = normalizeTimes(next);
    setTimes(normalized);
    await updateNotificationSettings(normalized);
    await refreshNotificationState();
  };

  const handlePickTime = (event: any, date?: Date) => {
    const index = editingIndex;
    setEditingIndex(null);
    if (event.type === 'dismissed' || !date || index === null) return;

    const next = [...times];
    next[index] = dateToTime(date);
    commitTimes(next);
  };

  const addTime = () => {
    // Sugere um horário diferente dos que já existem
    const suggestion = ['08:00', '12:00', '18:00', '21:00'].find(t => !times.includes(t)) || '08:00';
    commitTimes([...times, suggestion]);
  };

  const removeTime = (index: number) => {
    if (times.length <= 1) return;
    commitTimes(times.filter((_, i) => i !== index));
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const sent = await NotificationService.sendTestNotification(5);
      await refreshNotificationState();

      if (sent) {
        Alert.alert(
          'Teste enviado 🔔',
          'Feche o app agora. Em cerca de 5 segundos o aviso deve aparecer na sua tela.\n\nSe não chegar, as notificações do Rega-me provavelmente estão bloqueadas nas configurações do aparelho.'
        );
      } else {
        Alert.alert(
          'Notificações bloqueadas',
          'O aparelho não deixou o app enviar o aviso. Libere as notificações do Rega-me nas configurações para não perder as regas.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } finally {
      setTesting(false);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets size={16} color="#3b82f6" />;
      case 'prune': return <Scissors size={16} color="#ef4444" />;
      case 'repot': return <Box size={16} color="#f97316" />;
      default: return <CheckCircle2 size={16} color="#166534" />;
    }
  };

  const notificationsOff = permission !== 'granted';

  return (
    <SafeAreaView style={tw`flex-1 bg-canvas`}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho */}
        <View style={tw`px-6 pt-8 pb-6`}>
          <Text style={tw`text-sage-500 text-xs font-bold uppercase tracking-widest mb-1`}>Perfil</Text>
          <View style={tw`flex-row items-center bg-white px-4 py-3 rounded-2xl border border-sage-100`}>
            <User size={20} color="#5D8C7B" />
            <TextInput
              style={tw`flex-1 ml-3 text-lg text-sage-900 font-bold`}
              placeholder="Como quer ser chamado?"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={saveName}
              accessibilityLabel="Seu nome"
            />
          </View>
        </View>

        {/* Notificações */}
        <View style={tw`px-6 mb-6`}>
          <View style={tw`bg-white p-6 rounded-3xl border border-sage-100`}>
            <View style={tw`flex-row items-center mb-1`}>
              <View style={tw`bg-sage-50 p-2.5 rounded-full mr-3`}>
                {notificationsOff ? <BellOff size={22} color="#B77A52" /> : <Bell size={22} color="#5D8C7B" />}
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-bold text-sage-900`}>Horários dos lembretes</Text>
                <Text style={tw`text-xs text-gray-500 mt-0.5`}>
                  Nos dias de cuidado, você é avisado nestes horários
                </Text>
              </View>
            </View>

            {notificationsOff && (
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                style={tw`bg-clay-50 border border-clay-200 rounded-2xl p-4 mt-4`}
                accessibilityRole="button"
              >
                <Text style={tw`text-clay-800 font-bold mb-1`}>Notificações desligadas</Text>
                <Text style={tw`text-clay-700 text-xs leading-5`}>
                  Sem elas o app não consegue avisar na hora da rega. Toque para liberar nas
                  configurações do aparelho.
                </Text>
              </TouchableOpacity>
            )}

            <View style={tw`mt-5`}>
              {times.map((time, index) => (
                <View key={`${time}-${index}`} style={tw`flex-row items-center mb-3`}>
                  <TouchableOpacity
                    onPress={() => setEditingIndex(index)}
                    style={tw`flex-1 bg-sage-50 px-4 py-4 rounded-2xl border border-sage-100 mr-3`}
                    accessibilityRole="button"
                    accessibilityLabel={`Alterar o horário ${time}`}
                  >
                    <Text style={tw`font-bold text-sage-900 text-2xl text-center`}>{time}</Text>
                  </TouchableOpacity>

                  {times.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeTime(index)}
                      style={tw`p-4 bg-white rounded-2xl border border-gray-200`}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover o horário ${time}`}
                    >
                      <Trash2 size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={addTime}
              style={tw`flex-row items-center justify-center p-3.5 rounded-2xl border-2 border-dashed border-sage-200`}
              accessibilityRole="button"
            >
              <Plus size={20} color="#5D8C7B" />
              <Text style={tw`text-sage-600 font-bold ml-2`}>Adicionar horário</Text>
            </TouchableOpacity>

            <View style={tw`h-px bg-gray-100 my-5`} />

            <TouchableOpacity
              onPress={handleTest}
              disabled={testing}
              style={tw`flex-row items-center justify-center bg-sage-500 p-4 rounded-2xl ${testing ? 'opacity-60' : ''}`}
              accessibilityRole="button"
            >
              {testing
                ? <ActivityIndicator color="white" />
                : <Send size={18} color="white" />}
              <Text style={tw`text-white font-bold ml-2`}>Testar notificação</Text>
            </TouchableOpacity>
            <Text style={tw`text-xs text-gray-500 text-center mt-3 leading-5`}>
              {scheduledCount > 0
                ? `${scheduledCount} ${scheduledCount === 1 ? 'lembrete agendado' : 'lembretes agendados'}. Faça o teste para confirmar que eles chegam no seu aparelho.`
                : 'Nenhum lembrete agendado ainda — eles aparecem quando suas plantas têm cuidados marcados.'}
            </Text>
          </View>
        </View>

        {editingIndex !== null && (
          <DateTimePicker
            value={timeToDate(times[editingIndex])}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
            onChange={handlePickTime}
          />
        )}

        {/* Números do jardim */}
        <View style={tw`px-6 mb-6 flex-row gap-3`}>
          <View style={tw`flex-1 bg-white p-5 rounded-3xl border border-sage-100`}>
            <View style={tw`bg-sage-50 w-11 h-11 rounded-xl items-center justify-center mb-3`}>
              <Sprout size={22} color="#5D8C7B" />
            </View>
            <Text style={tw`text-3xl font-bold text-sage-900`}>{plants.length}</Text>
            <Text style={tw`text-gray-500 text-sm font-medium mt-1`}>Plantas</Text>
          </View>

          <View style={tw`flex-1 bg-white p-5 rounded-3xl border border-sage-100`}>
            <View style={tw`bg-sage-50 w-11 h-11 rounded-xl items-center justify-center mb-3`}>
              <CheckCircle2 size={22} color="#5D8C7B" />
            </View>
            <Text style={tw`text-3xl font-bold text-sage-900`}>{history.length}</Text>
            <Text style={tw`text-gray-500 text-sm font-medium mt-1`}>Cuidados</Text>
          </View>
        </View>

        {/* Histórico */}
        <View style={tw`px-6`}>
          <View style={tw`flex-row items-center mb-4`}>
            <View style={tw`bg-sage-50 p-2.5 rounded-full mr-3`}>
              <History size={20} color="#5D8C7B" />
            </View>
            <Text style={tw`text-lg font-bold text-sage-900`}>Últimos cuidados</Text>
          </View>

          <View style={tw`bg-white rounded-3xl p-2 border border-sage-100`}>
            {history.slice(0, 10).map((item, index) => (
              <View
                key={item.id}
                style={tw`p-4 flex-row items-center justify-between ${index < Math.min(history.length, 10) - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`bg-gray-50 p-2.5 rounded-full mr-4`}>
                    {getTaskIcon(item.type)}
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-sage-900 font-semibold`}>{item.plant_name}</Text>
                    <Text style={tw`text-gray-500 text-xs font-medium mt-0.5`}>
                      {item.type === 'water' ? '💧 Rega'
                        : item.type === 'prune' ? '✂️ Poda'
                        : item.type === 'repot' ? '🏺 Replantio'
                        : item.type === 'fertilize' ? '🌿 Adubo'
                        : item.type}
                    </Text>
                  </View>
                </View>
                <Text style={tw`text-gray-400 text-xs font-medium`}>
                  {new Date(item.date_performed).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            ))}
            {history.length === 0 && (
              <Text style={tw`p-6 text-center text-gray-400 font-medium`}>
                Nenhum cuidado registrado ainda.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
