import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Platform, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePlants } from '../../contexts/PlantContext';
import History from 'lucide-react-native/dist/cjs/icons/history';
import Droplets from 'lucide-react-native/dist/cjs/icons/droplets';
import Scissors from 'lucide-react-native/dist/cjs/icons/scissors';
import Box from 'lucide-react-native/dist/cjs/icons/box';
import CheckCircle2 from 'lucide-react-native/dist/cjs/icons/circle-check';
import Sprout from 'lucide-react-native/dist/cjs/icons/sprout';
import User from 'lucide-react-native/dist/cjs/icons/user';
import Bell from 'lucide-react-native/dist/cjs/icons/bell';
import BellOff from 'lucide-react-native/dist/cjs/icons/bell-off';
import Plus from 'lucide-react-native/dist/cjs/icons/plus';
import Trash2 from 'lucide-react-native/dist/cjs/icons/trash-2';
import Send from 'lucide-react-native/dist/cjs/icons/send';
import tw from '../../utils/tw';
import { teardrop } from '../../utils/shape';
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
      case 'water': return <Droplets size={15} color="#D98F5F" />;
      case 'prune': return <Scissors size={15} color="#C2705A" />;
      case 'repot': return <Box size={15} color="#B0834A" />;
      default: return <CheckCircle2 size={15} color="#7C9B72" />;
    }
  };

  const notificationsOff = permission !== 'granted';

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho */}
        <View style={tw`px-6 pt-6 pb-6`}>
          <Text style={tw`text-stone-400 text-[11px] font-label uppercase tracking-[2px] mb-4`}>Perfil</Text>
          <View style={tw`flex-row items-center bg-stone-50 px-4 py-3.5 rounded-2xl`}>
            <View style={[tw`bg-white items-center justify-center mr-3`, teardrop(32, 10)]}>
              <User size={16} color="#7C9B72" />
            </View>
            <TextInput
              style={tw`flex-1 text-[15px] text-stone-900 font-medium`}
              placeholder="Como quer ser chamado?"
              placeholderTextColor="#A8A29E"
              value={name}
              onChangeText={saveName}
              accessibilityLabel="Seu nome"
            />
          </View>
        </View>

        {/* Notificações */}
        <View style={tw`px-6 mb-6`}>
          <View style={tw`bg-stone-50 p-5 rounded-3xl`}>
            <View style={tw`flex-row items-center mb-1`}>
              <View style={[tw`bg-white items-center justify-center mr-3`, teardrop(38, 12)]}>
                {notificationsOff ? <BellOff size={18} color="#B08A63" /> : <Bell size={18} color="#7C9B72" />}
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[15px] font-medium text-stone-900`}>Horários dos lembretes</Text>
                <Text style={tw`text-xs text-stone-400 mt-0.5`}>
                  Nos dias de cuidado, você é avisado nestes horários
                </Text>
              </View>
            </View>

            {notificationsOff && (
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                style={[tw`rounded-2xl p-4 mt-4`, { backgroundColor: '#FBEEE3' }]}
                accessibilityRole="button"
              >
                <Text style={[tw`font-bold mb-1`, { color: '#3E2A1B' }]}>Notificações desligadas</Text>
                <Text style={[tw`text-xs leading-5`, { color: '#B08A63' }]}>
                  Sem elas o app não consegue avisar na hora da rega. Toque para liberar nas
                  configurações do aparelho.
                </Text>
              </TouchableOpacity>
            )}

            <View style={tw`mt-5`}>
              {times.map((time, index) => (
                <View key={`${time}-${index}`} style={tw`flex-row items-center mb-2.5`}>
                  <TouchableOpacity
                    onPress={() => setEditingIndex(index)}
                    style={tw`flex-1 bg-white px-4 py-4 rounded-2xl mr-2.5`}
                    accessibilityRole="button"
                    accessibilityLabel={`Alterar o horário ${time}`}
                  >
                    <Text style={tw`font-medium text-stone-900 text-2xl text-center`}>{time}</Text>
                  </TouchableOpacity>

                  {times.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeTime(index)}
                      style={tw`w-14 h-14 bg-white rounded-2xl items-center justify-center`}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover o horário ${time}`}
                    >
                      <Trash2 size={18} color="#C6C6BE" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={addTime}
              style={tw`flex-row items-center justify-center p-3.5 rounded-2xl border-[1.5px] border-dashed border-stone-300`}
              accessibilityRole="button"
            >
              <Plus size={18} color="#7C9B72" />
              <Text style={[tw`font-bold ml-2 text-sm`, { color: '#7C9B72' }]}>Adicionar horário</Text>
            </TouchableOpacity>

            <View style={tw`h-px bg-stone-200 my-5`} />

            <TouchableOpacity
              onPress={handleTest}
              disabled={testing}
              style={[tw`flex-row items-center justify-center p-4 rounded-2xl ${testing ? 'opacity-60' : ''}`, { backgroundColor: '#7C9B72' }]}
              accessibilityRole="button"
            >
              {testing
                ? <ActivityIndicator color="white" />
                : <Send size={16} color="white" />}
              <Text style={tw`text-white font-bold ml-2`}>Testar notificação</Text>
            </TouchableOpacity>
            <Text style={tw`text-xs text-stone-400 text-center mt-3 leading-5`}>
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
          <View style={tw`flex-1 bg-stone-50 p-5 rounded-3xl`}>
            <View style={[tw`bg-white items-center justify-center mb-3`, teardrop(40, 12)]}>
              <Sprout size={18} color="#7C9B72" />
            </View>
            <Text style={tw`text-3xl font-light text-stone-900`}>{plants.length}</Text>
            <Text style={tw`text-stone-400 text-sm font-medium mt-0.5`}>Plantas</Text>
          </View>

          <View style={tw`flex-1 bg-stone-50 p-5 rounded-3xl`}>
            <View style={[tw`bg-white items-center justify-center mb-3`, teardrop(40, 12)]}>
              <CheckCircle2 size={18} color="#7C9B72" />
            </View>
            <Text style={tw`text-3xl font-light text-stone-900`}>{history.length}</Text>
            <Text style={tw`text-stone-400 text-sm font-medium mt-0.5`}>Cuidados</Text>
          </View>
        </View>

        {/* Histórico */}
        <View style={tw`px-6`}>
          <View style={tw`flex-row items-center mb-4`}>
            <View style={[tw`bg-stone-50 items-center justify-center mr-3`, teardrop(36, 12)]}>
              <History size={16} color="#7C9B72" />
            </View>
            <Text style={tw`text-[15px] font-medium text-stone-900`}>Últimos cuidados</Text>
          </View>

          <View style={tw`bg-stone-50 rounded-3xl p-2`}>
            {history.slice(0, 10).map((item, index) => (
              <View
                key={item.id}
                style={tw`p-4 flex-row items-center justify-between ${index < Math.min(history.length, 10) - 1 ? 'border-b border-stone-200' : ''}`}
              >
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`bg-white p-2.5 rounded-full mr-3.5`}>
                    {getTaskIcon(item.type)}
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-stone-900 font-medium text-sm`}>{item.plant_name}</Text>
                    <Text style={tw`text-stone-400 text-xs mt-0.5`}>
                      {item.type === 'water' ? '💧 Rega'
                        : item.type === 'prune' ? '✂️ Poda'
                        : item.type === 'repot' ? '🏺 Replantio'
                        : item.type === 'fertilize' ? '🌿 Adubo'
                        : item.type}
                    </Text>
                  </View>
                </View>
                <Text style={tw`text-stone-300 text-xs font-medium`}>
                  {new Date(item.date_performed).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            ))}
            {history.length === 0 && (
              <Text style={tw`p-6 text-center text-stone-400 font-medium`}>
                Nenhum cuidado registrado ainda.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
