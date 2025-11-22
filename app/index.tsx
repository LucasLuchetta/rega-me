import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Configuração de Notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface Planta {
  id: string;
  nome: string;
  freq: number;
  dataRegaMs: number;
  notifId: string | null;
  imageUri: string | null;
}

export default function App() {
  const router = useRouter();
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(true);

  // Pedir permissão ao abrir
  useEffect(() => {
    async function pedirPermissao() {
      if (Platform.OS === 'web') return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') alert('Precisamos de permissão para te avisar sobre as regas!');
    }
    pedirPermissao();
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const carregarDados = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@minhas_plantas');
      if (jsonValue != null) {
        const dados = JSON.parse(jsonValue);
        // Ordenar por data de rega (mais urgentes primeiro)
        dados.sort((a: Planta, b: Planta) => a.dataRegaMs - b.dataRegaMs);
        setPlantas(dados);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const regar = async (planta: Planta) => {
    Alert.alert("Regar Planta", `Confirmar rega de ${planta.nome}?`, [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Confirmar",
        onPress: async () => {
          // 1. Calcular nova data
          const novaData = new Date();
          novaData.setDate(novaData.getDate() + planta.freq);
          novaData.setHours(8, 0, 0, 0); // Define para 8h da manhã

          // 2. Reagendar notificação
          if (planta.notifId) await Notifications.cancelScheduledNotificationAsync(planta.notifId).catch(()=>{});
          
          const seconds = Math.max(60, Math.floor((novaData.getTime() - Date.now()) / 1000));
          const novoNotifId = await Notifications.scheduleNotificationAsync({
            content: { title: "Hora de Regar! 🚿", body: `${planta.nome} precisa de água.` },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
          });

          // 3. Salvar
          const novasPlantas = plantas.map(p => p.id === planta.id ? { 
            ...p, dataRegaMs: novaData.getTime(), notifId: novoNotifId 
          } : p).sort((a, b) => a.dataRegaMs - b.dataRegaMs); // Reordenar

          setPlantas(novasPlantas);
          await AsyncStorage.setItem('@minhas_plantas', JSON.stringify(novasPlantas));
        }
      }
    ]);
  };

  const deletar = (id: string, notifId: string | null) => {
    Alert.alert("Excluir", "Tem certeza?", [
      { text: "Não", style: "cancel" },
      { text: "Sim", style: "destructive", onPress: async () => {
          if (notifId) await Notifications.cancelScheduledNotificationAsync(notifId).catch(()=>{});
          const novas = plantas.filter(p => p.id !== id);
          setPlantas(novas);
          await AsyncStorage.setItem('@minhas_plantas', JSON.stringify(novas));
      }}
    ]);
  };

  // Função auxiliar para mostrar status
  const getStatus = (dataMs: number) => {
    const hoje = new Date().setHours(0,0,0,0);
    const alvo = new Date(dataMs).setHours(0,0,0,0);
    const diff = Math.round((alvo - hoje) / 86400000);

    if (diff < 0) return { texto: `Atrasado ${Math.abs(diff)} dias!`, cor: '#EF5350', bg: '#FFEBEE' };
    if (diff === 0) return { texto: 'Regar Hoje!', cor: '#2E7D32', bg: '#E8F5E9' };
    if (diff === 1) return { texto: 'Amanhã', cor: '#1976D2', bg: '#E3F2FD' };
    return { texto: `Em ${diff} dias`, cor: '#757575', bg: '#F5F5F5' };
  };

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#2E7D32" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Plantas 🌿</Text>
      </View>

      <FlatList
        data={plantas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Nenhuma planta cadastrada.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = getStatus(item.dataRegaMs);
          return (
            <TouchableOpacity style={styles.card} onLongPress={() => deletar(item.id, item.notifId)} activeOpacity={0.9}>
              <Image 
                source={item.imageUri ? { uri: item.imageUri } : require('../assets/images/react-logo.png')} 
                style={styles.cardImage} 
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.nome}</Text>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.badgeText, { color: status.cor }]}>{status.texto}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.waterBtn} onPress={() => regar(item)}>
                <Ionicons name="water" size={24} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add')}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#000' },
  list: { padding: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 12, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardImage: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  waterBtn: { width: 44, height: 44, backgroundColor: '#2E7D32', borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#2E7D32', shadowOpacity: 0.3, shadowOffset: {width:0, height:4} },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, backgroundColor: '#000', borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: {width:0, height:4}, elevation: 5 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' }
});