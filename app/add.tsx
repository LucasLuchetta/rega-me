import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Para receber os dados da pesquisa

  const [nome, setNome] = useState('');
  const [dias, setDias] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [dicas, setDicas] = useState<any>(null); // Para guardar as dicas da planta selecionada

  // Efeito para carregar dados se vierem da pesquisa
  useEffect(() => {
    if (params.plantaSelecionada) {
      try {
        const dados = JSON.parse(params.plantaSelecionada as string);
        
        // Preencher nome automaticamente
        const nomeComum = dados.common ? dados.common[0] : dados.latin;
        setNome(nomeComum);
        
        // Guardar dicas para mostrar na tela
        setDicas({
          rega: dados.watering,
          luz: dados.ideallight,
          luzTol: dados.toleratedlight
        });

      } catch (e) {
        console.log("Erro ao ler dados da planta", e);
      }
    }
  }, [params.plantaSelecionada]);

  const escolherImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const salvar = async () => {
    if (!nome || !dias) return Alert.alert("Erro", "Preencha o nome e a frequência.");

    const freq = parseInt(dias);
    const dataRega = new Date();
    dataRega.setDate(dataRega.getDate() + freq);
    dataRega.setHours(8, 0, 0, 0);

    const seconds = Math.max(60, freq * 24 * 60 * 60);
    let notifId = null;
    try {
       notifId = await Notifications.scheduleNotificationAsync({
        content: { title: "Nova Rega! 🌿", body: `Hora de cuidar da ${nome}.` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
      });
    } catch (e) { console.log("Erro notif", e); }

    const novaPlanta = {
      id: Date.now().toString(),
      nome,
      freq,
      dataRegaMs: dataRega.getTime(),
      notifId,
      imageUri
    };

    const jsonValue = await AsyncStorage.getItem('@minhas_plantas');
    const plantas = jsonValue != null ? JSON.parse(jsonValue) : [];
    await AsyncStorage.setItem('@minhas_plantas', JSON.stringify([...plantas, novaPlanta]));

    router.replace('/'); // Volta para a home resetando a stack
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nova Planta</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {/* Botão de Imagem */}
        <TouchableOpacity style={styles.imagePicker} onPress={escolherImagem}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera" size={40} color="#CCC" />
              <Text style={styles.placeholderText}>Foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Botão de Pesquisa */}
        <TouchableOpacity style={styles.searchButton} onPress={() => router.push('/search')}>
          <Ionicons name="search" size={20} color="#2E7D32" />
          <Text style={styles.searchButtonText}>Pesquisar na lista de espécies</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Nome da Planta</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Ex: Samambaia" />

        {/* Cartão de Dicas (Só aparece se selecionou da lista) */}
        {dicas && (
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Dicas para esta espécie:</Text>
            <Text style={styles.tipText}>💧 {dicas.rega}</Text>
            <Text style={styles.tipText}>☀️ {dicas.luz}</Text>
          </View>
        )}

        <Text style={styles.label}>Regar a cada (dias)</Text>
        <TextInput 
          style={styles.input} 
          value={dias} 
          onChangeText={setDias} 
          keyboardType="numeric" 
          placeholder="Ex: 7" 
        />

        <TouchableOpacity style={styles.btnSalvar} onPress={salvar}>
          <Text style={styles.btnText}>Salvar Planta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  form: { padding: 24 },
  imagePicker: { alignSelf: 'center', marginBottom: 20 },
  image: { width: 120, height: 120, borderRadius: 60 },
  placeholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#999', marginTop: 4 },
  
  searchButton: { flexDirection: 'row', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#C8E6C9' },
  searchButtonText: { color: '#2E7D32', fontWeight: '600', marginLeft: 8 },

  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 24 },
  
  tipCard: { backgroundColor: '#FFF3E0', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#FFE0B2' },
  tipTitle: { fontWeight: 'bold', color: '#E65100', marginBottom: 8 },
  tipText: { color: '#5D4037', marginBottom: 4, lineHeight: 20 },

  btnSalvar: { backgroundColor: '#000', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});