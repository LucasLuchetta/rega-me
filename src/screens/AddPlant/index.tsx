import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList, Image } from 'react-native';
import { usePlants } from '../../contexts/PlantContext';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, Circle, Search, Camera, X, Plus, Droplets, Scissors, Sprout, ShieldAlert, Box, Wind, Trash2 } from 'lucide-react-native';
import tw from '../../utils/tw';
import * as ImagePicker from 'expo-image-picker';
import { persistImage } from '../../utils/imageStorage';
import plantsData from '../../database/plants_pt.json';

const COMMON_ROOMS = [' Quarto ',' Sala ', ' Cozinha ', ' Varanda ', ' Banheiro ', ' Jardim '];

const CARE_TYPES = [
    { id: 'water', label: 'Rega', icon: Droplets, color: tw.color('sky-500'), bg: 'bg-sky-50' },
    { id: 'mist', label: 'Borrifar', icon: Wind, color: tw.color('sky-400'), bg: 'bg-sky-50' },
    { id: 'fertilize', label: 'Adubo', icon: Sprout, color: tw.color('clay-500'), bg: 'bg-clay-50' },
    { id: 'prune', label: 'Poda', icon: Scissors, color: tw.color('red-400'), bg: 'bg-red-50' },
    { id: 'repot', label: 'Vaso', icon: Box, color: tw.color('orange-500'), bg: 'bg-orange-50' },
    { id: 'pesticide', label: 'Defensivo', icon: ShieldAlert, color: tw.color('purple-500'), bg: 'bg-purple-50' },
];

const OptionPill = ({ label, selected, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={tw`px-4 py-2 rounded-full mr-2 mb-2 border ${selected ? 'bg-sage-100 border-sage-500' : 'bg-canvas-dark border-gray-200'}`}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    accessibilityLabel={label}
  >
    <Text style={tw`${selected ? 'text-sage-800 font-bold' : 'text-gray-600'}`}>{label}</Text>
  </TouchableOpacity>
);

const estimateFrequency = (description: string, category: string) => {
  const text = description ? description.toLowerCase() : '';
  const cat = category ? category.toLowerCase() : '';
  
  if (cat.includes('cacto') || cat.includes('suculenta')) return '15';
  if (text.includes('secar entre') || text.includes('apenas quando seco') || text.includes('dry between')) return '7';
  if (text.includes('manter úmido') || text.includes('mantenha úmido') || text.includes('keep moist')) return '3';
  if (text.includes('diariamente') || text.includes('daily')) return '1';
  
  return '7';
};

export default function AddPlant() {
  const { addNewPlant } = usePlants();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [room, setRoom] = useState('');
  const [potSize, setPotSize] = useState('Médio');
  const [potMaterial, setPotMaterial] = useState('Plástico');
  const [drainage, setDrainage] = useState(1);
  const [photoUri, setPhotoUri] = useState('');

  // New State for Tasks
  const [tasks, setTasks] = useState<{type: string, frequency: string}[]>([
      { type: 'water', frequency: '7' }
  ]);

  const [encyclopediaModalVisible, setEncyclopediaModalVisible] = useState(false);
  const [careModalVisible, setCareModalVisible] = useState(false);
  const [selectedCareType, setSelectedCareType] = useState('water');
  const [newCareFrequency, setNewCareFrequency] = useState('');

  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      const isDirty = (name.trim() !== '' || photoUri !== '');
      if (!isDirty || loading) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Descartar alterações?',
        'Você tem informações não salvas. Tem certeza que deseja sair?',
        [
          { text: 'Não sair', style: 'cancel', onPress: () => {} },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, name, photoUri, loading]);

  const filteredPlants = React.useMemo(() => plantsData.filter((p: any) =>
    (p.common && p.common[0] && p.common[0].toLowerCase().includes(debouncedSearchText.toLowerCase())) ||
    (p.latin && p.latin.toLowerCase().includes(debouncedSearchText.toLowerCase()))
  ), [debouncedSearchText]);

  const handleSelectFromJSON = (plant: any) => {
    const smartFreq = estimateFrequency(plant.watering, plant.category);

    setName(plant.common[0] || plant.latin);
    setSpecies(plant.latin);
    setTasks([
      { type: 'water', frequency: smartFreq },
      { type: 'fertilize', frequency: '30' },
      { type: 'prune', frequency: '60' }
    ]);
    setEncyclopediaModalVisible(false);

    Alert.alert(
      "Dados preenchidos",
      `Usamos as informações da lista para a ${plant.common[0] || plant.latin}: rega sugerida a cada ${smartFreq} dias.\n\nAjuste o que quiser antes de salvar.`,
      [{ text: "Certo" }]
    );
  };

  // O app não reconhece a planta pela foto: quem escolhe é o usuário, na lista
  // ou digitando. A pergunta deixa isso explícito em vez de simular uma análise.
  const askHowToFillName = () => {
    Alert.alert(
      "Como quer preencher?",
      "O Rega-me não identifica a planta pela foto. Você pode procurar na nossa lista de espécies ou escrever o nome à mão.",
      [
        { text: "Escrever à mão", style: 'cancel' },
        { text: "Procurar na lista", onPress: () => setEncyclopediaModalVisible(true) }
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(persistImage(result.assets[0].uri) ?? '');
      if (!name) askHowToFillName();
    }
  };

  const takePhoto = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
          Alert.alert("Erro", "Permissão de câmera necessária.");
          return;
      }
      const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 4],
          quality: 0.8,
      });

      if (!result.canceled) {
          setPhotoUri(persistImage(result.assets[0].uri) ?? '');
          if (!name) askHowToFillName();
      }
  };

  const handleAddCareTask = () => {
      if (!newCareFrequency) {
          Alert.alert("Atenção", "Informe a frequência em dias.");
          return;
      }

      const newTasks = [...tasks];
      const existingIndex = newTasks.findIndex(t => t.type === selectedCareType);

      if (existingIndex >= 0) {
          newTasks[existingIndex].frequency = newCareFrequency;
      } else {
          newTasks.push({ type: selectedCareType, frequency: newCareFrequency });
      }

      setTasks(newTasks);
      setCareModalVisible(false);
      setNewCareFrequency('');
  };

  const handleRemoveTask = (type: string) => {
      Alert.alert(
          "Remover cuidado",
          "Tem certeza que deseja remover este cuidado da lista?",
          [
              { text: "Cancelar", style: "cancel" },
              { text: "Remover", style: "destructive", onPress: () => setTasks(tasks.filter(t => t.type !== type)) }
          ]
      );
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Nome é obrigatório");
    if (!room.trim()) errors.push("Local é obrigatório");

    const waterTask = tasks.find(t => t.type === 'water');
    if (!waterTask || !waterTask.frequency || parseInt(waterTask.frequency) <= 0) {
        errors.push("É necessário configurar ao menos a Rega.");
    }

    if (errors.length > 0) {
      Alert.alert("Ops, faltou algo...", errors.join("\n"));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const waterFreq = parseInt(tasks.find(t => t.type === 'water')?.frequency || '0');
      const fertilizeFreq = parseInt(tasks.find(t => t.type === 'fertilize')?.frequency || '0');
      const pruneFreq = parseInt(tasks.find(t => t.type === 'prune')?.frequency || '0');
      const mistFreq = parseInt(tasks.find(t => t.type === 'mist')?.frequency || '0');
      const pesticideFreq = parseInt(tasks.find(t => t.type === 'pesticide')?.frequency || '0');
      const repotFreq = parseInt(tasks.find(t => t.type === 'repot')?.frequency || '0');

      await addNewPlant({
        name, species, room,
        frequencyDays: waterFreq,
        fertilizeFrequency: fertilizeFreq,
        pruneFrequency: pruneFreq,
        mistFrequency: mistFreq,
        pesticideFrequency: pesticideFreq,
        repotFrequency: repotFreq,
        pot_size: potSize, pot_material: potMaterial, drainage,
        photo_uri: photoUri
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-canvas`}>
      <ScrollView style={tw`flex-1 p-5`} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header Clean */}
        <View style={tw`flex-row items-center justify-between mb-6`}>
             <Text style={tw`font-serif text-3xl text-sage-900`}>Nova Planta</Text>
             <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={tw`p-2 bg-gray-100 rounded-full`}
                accessibilityLabel="Fechar tela de nova planta"
                accessibilityRole="button"
             >
                 <X size={20} color="#666" />
             </TouchableOpacity>
        </View>

        {/* Photo Section - Hero */}
        <View style={tw`items-center mb-8`}>
            <TouchableOpacity
                onPress={() => {
                     Alert.alert("Foto da Planta", "Escolha uma opção", [
                         { text: "Câmera", onPress: takePhoto },
                         { text: "Galeria", onPress: pickImage },
                         { text: "Cancelar", style: "cancel" }
                     ]);
                }}
                style={tw`w-40 h-40 bg-sage-50 rounded-[40px] items-center justify-center overflow-hidden border-2 border-dashed border-sage-200`}
                accessibilityLabel="Adicionar foto da planta"
                accessibilityHint="Toque duas vezes para escolher entre tirar uma foto ou selecionar da galeria"
                accessibilityRole="button"
            >
                {photoUri ? (
                    <Image source={{ uri: photoUri }} style={tw`w-full h-full`} />
                ) : (
                    <View style={tw`items-center`}>
                        <Camera size={32} color="#82A894" />
                        <Text style={tw`text-sage-400 text-xs mt-2 font-bold`}>Adicionar Foto</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => setEncyclopediaModalVisible(true)}
          style={tw`bg-white border border-sage-100 p-4 rounded-xl flex-row items-center mb-8 shadow-sm`}
          accessibilityLabel="Não sabe o nome? Buscar em nossa enciclopédia"
          accessibilityRole="button"
        >
          <View style={tw`bg-sage-100 p-2 rounded-full mr-3`}>
            <Search color="#38544A" size={18} />
          </View>
          <View>
            <Text style={tw`text-sage-900 font-bold`}>Não sabe o nome?</Text>
            <Text style={tw`text-sage-500 text-xs`}>Buscar em nossa enciclopédia</Text>
          </View>
        </TouchableOpacity>

        <View style={tw`mb-6`}>
          <Text style={tw`text-sage-900 mb-2 font-bold text-lg font-serif`}>Sobre ela</Text>
          <TextInput 
            style={tw`bg-white border border-gray-100 rounded-xl p-4 text-sage-900 mb-3 font-medium`}
            placeholder="Nome (ex: Filó)"
            value={name} onChangeText={setName}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Nome da planta"
          />
          <TextInput 
            style={tw`bg-white border border-gray-100 rounded-xl p-4 text-sage-900 font-medium`}
            placeholder="Espécie (Científico ou Popular)"
            value={species} onChangeText={setSpecies}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Espécie da planta"
          />
        </View>

        <View style={tw`mb-6`}>
          <Text style={tw`text-sage-900 mb-2 font-bold text-lg font-serif`}>Onde ela vive?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`mb-3`}
            contentContainerStyle={tw`pr-4`}
            accessibilityRole="radiogroup"
            accessibilityLabel="Selecione um ambiente"
          >
            {COMMON_ROOMS.map(r => (
              <TouchableOpacity 
                key={r} onPress={() => setRoom(r)}
                items-center justify-center
                style={tw`px-5 py-2.5 rounded-full mr-2 border ${room === r ? 'bg-sage-600 border-sage-600' : 'bg-white border-gray-200'}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: room === r }}
                accessibilityLabel={r}
              >
                <Text style={tw`${room === r ? 'text-white font-bold' : 'text-gray-500'}`}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput 
            style={tw`bg-white border border-gray-100 rounded-xl p-4 text-sage-900`}
            placeholder="Outro ambiente..." value={room} onChangeText={setRoom}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Nome do ambiente personalizado"
          />
        </View>

        <View style={tw`mb-6`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-sage-900 font-bold text-lg font-serif`}>Cuidados</Text>
                <TouchableOpacity onPress={() => setCareModalVisible(true)} style={tw`bg-sage-100 p-2 rounded-full`}>
                    <Plus size={20} color={tw.color('sage-600')} />
                </TouchableOpacity>
            </View>

            <View style={tw`bg-white rounded-3xl p-2 border border-sage-100 shadow-sm`}>
                {tasks.map((task, index) => {
                    const config = CARE_TYPES.find(c => c.id === task.type) || CARE_TYPES[0];
                    const Icon = config.icon;
                    const isLast = index === tasks.length - 1;
                    return (
                        <View
                            key={task.type}
                            style={[tw`flex-row items-center p-4`, !isLast && tw`border-b border-sage-50`]}
                        >
                            <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: `${config.color}15` }]}>
                                <Icon size={22} color={config.color} />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-sage-800 font-bold text-base capitalize`}>{config.label}</Text>
                                <Text style={tw`text-sage-400 text-xs`}>Repetir a cada {task.frequency} dias</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleRemoveTask(task.type)} style={tw`p-2`}>
                                <Trash2 size={18} color={tw.color('red-300')} />
                            </TouchableOpacity>
                        </View>
                    );
                })}
                {tasks.length === 0 && (
                    <Text style={tw`text-center text-sage-400 p-4 italic`}>Nenhum cuidado configurado.</Text>
                )}
            </View>
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-sage-900 mb-2 font-bold`}>Tamanho do Vaso</Text>
          <View style={tw`flex-row flex-wrap`} accessibilityRole="radiogroup" accessibilityLabel="Opções de Tamanho do Vaso">
            {['Pequeno', 'Médio', 'Grande'].map(opt => (
              <OptionPill key={opt} label={opt} selected={potSize === opt} onPress={() => setPotSize(opt)} />
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave} disabled={loading}
          style={tw`p-5 rounded-2xl items-center mb-10 shadow-lg shadow-sage-500/30 mt-4 ${loading ? 'bg-sage-300' : 'bg-sage-600'}`}
          accessibilityRole="button"
          accessibilityLabel="Salvar e adicionar planta ao jardim"
          accessibilityState={{ busy: loading }}
          accessibilityHint="Toque duas vezes para salvar a planta"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={tw`text-white font-bold text-lg`}>Adicionar ao Jardim</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Busca no JSON */}
      <Modal visible={encyclopediaModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={tw`flex-1 bg-canvas p-5`}>
            <View style={tw`flex-row justify-between items-center mb-6 mt-2`}>
                <Text style={tw`text-2xl font-serif text-sage-900`}>Enciclopédia</Text>
                <TouchableOpacity onPress={() => setEncyclopediaModalVisible(false)} style={tw`bg-gray-100 p-2 rounded-full`}>
                    <X size={20} color="#666" />
                </TouchableOpacity>
            </View>
            <View style={tw`bg-white border border-gray-200 rounded-xl p-3 flex-row items-center mb-6`}>
                <Search size={20} color="#9ca3af" />
                <TextInput 
                    style={tw`flex-1 ml-2 text-sage-900`}
                    placeholder="Buscar espécie..." 
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus
                    placeholderTextColor="#9CA3AF"
                />
            </View>
            <FlatList 
                data={filteredPlants}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({item}) => (
                    <TouchableOpacity onPress={() => handleSelectFromJSON(item)} style={tw`py-4 border-b border-gray-100 flex-row items-center`}>
                        <View style={tw`bg-sage-100 w-10 h-10 rounded-full items-center justify-center mr-3`}>
                            <Text>🌿</Text>
                        </View>
                        <View>
                            <Text style={tw`font-bold text-sage-900 text-lg`}>{item.common[0]}</Text>
                            <Text style={tw`text-sage-500 italic`}>{item.latin}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
      </Modal>

      {/* Modal Novo Cuidado */}
      <Modal visible={careModalVisible} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-sage-900/50`}>
            <View style={tw`bg-white rounded-t-[32px] p-6`}>
                <View style={tw`flex-row justify-between mb-6`}>
                    <Text style={tw`text-xl font-serif font-bold text-sage-900`}>Novo Cuidado</Text>
                    <TouchableOpacity onPress={() => setCareModalVisible(false)}><Text style={tw`text-sage-500 font-bold`}>Cancelar</Text></TouchableOpacity>
                </View>
                <View style={tw`flex-row flex-wrap gap-2 mb-6`}>
                    {CARE_TYPES.map(t => (
                        <TouchableOpacity key={t.id} onPress={() => setSelectedCareType(t.id)}
                            style={tw`px-4 py-2.5 rounded-full border flex-row items-center ${selectedCareType === t.id ? 'bg-sage-600 border-sage-600' : 'bg-white border-sage-200'}`}>
                            {selectedCareType === t.id && <CheckCircle2 size={14} color="white" style={tw`mr-2`} />}
                            <Text style={tw`${selectedCareType === t.id ? 'text-white' : 'text-sage-600'} font-bold text-sm`}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={tw`text-sage-500 mb-2 ml-1 text-xs font-bold uppercase`}>Frequência</Text>
                <TextInput
                    placeholder="A cada quantos dias?"
                    keyboardType="numeric"
                    placeholderTextColor={tw.color('sage-300')}
                    style={tw`bg-sage-50 p-4 rounded-2xl mb-1 text-sage-800 font-bold border border-sage-100`}
                    value={newCareFrequency}
                    onChangeText={setNewCareFrequency}
                    accessibilityLabel="Frequência em dias"
                />
                <Text style={tw`text-sage-400 text-xs mb-6 ml-1`}>Ex: 7 (semanal), 30 (mensal)</Text>

                <TouchableOpacity onPress={handleAddCareTask} style={tw`bg-sage-600 p-4 rounded-2xl items-center shadow-lg shadow-sage-600/30`}>
                    <Text style={tw`text-white font-bold text-lg`}>Salvar Rotina</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}
