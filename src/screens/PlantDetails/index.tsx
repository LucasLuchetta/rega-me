import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image, StatusBar, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePlants } from '../../contexts/PlantContext';
import { Trash2, Plus, Camera, Droplets, Clock, CheckCircle2, Scissors, Sprout, ShieldAlert, Box, ChevronLeft, MoreHorizontal, Wind, ThermometerSun, Filter, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../../utils/tw';
import EditPlantModal from './components/EditPlantModal';

const CARE_TYPES = [
    { id: 'water', label: 'Rega', icon: Droplets, color: tw.color('sky-500'), bg: 'bg-sky-50' },
    { id: 'mist', label: 'Borrifar', icon: Wind, color: tw.color('sky-400'), bg: 'bg-sky-50' }, // Added mist as option but manual
    { id: 'fertilize', label: 'Adubo', icon: Sprout, color: tw.color('clay-500'), bg: 'bg-clay-50' },
    { id: 'prune', label: 'Poda', icon: Scissors, color: tw.color('red-400'), bg: 'bg-red-50' },
    { id: 'repot', label: 'Vaso', icon: Box, color: tw.color('orange-500'), bg: 'bg-orange-50' },
];

export default function PlantDetails() {
  const route = useRoute<any>();
  const { plant: initialPlant } = route.params;
  const [plant, setPlant] = useState(initialPlant);
  const { getPlantTasks, addTaskToPlant, removePlant, snoozeTask, anticipateTask, addPlantPhoto, getPlantPhotos, getPlantHistory, updatePlant, plants } = usePlants();
  const navigation = useNavigation();

  const [tasks, setTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('water');
  const [newFrequency, setNewFrequency] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
      loadData();
  }, []);

  // Sync local plant state with global state when it changes
  useEffect(() => {
    const updatedPlant = plants.find(p => p.id === plant.id);
    if (updatedPlant) setPlant(updatedPlant);
  }, [plants]);

  const loadData = async () => {
    if (getPlantTasks) setTasks(await getPlantTasks(plant.id));
    if (getPlantHistory) setHistory(await getPlantHistory(plant.id));
    if (getPlantPhotos) setPhotos(await getPlantPhotos(plant.id));
  };

  const handleAddTask = async () => {
    if (!newFrequency) return;
    await addTaskToPlant({
        plant_id: plant.id, type: selectedType as any, frequency_days: parseInt(newFrequency), next_due: new Date().toISOString()
    });
    setModalVisible(false); setNewFrequency(''); loadData();
  };

  const handleAction = (task: any) => {
      Alert.alert("Ação Rápida", `O que fazer com ${task.type}?`, [
          {
            text: "Adiar 2 dias",
            onPress: async () => {
              setActionLoading(task.id);
              await snoozeTask(task.id, 2, plant.name);
              await loadData();
              setActionLoading(null);
            }
          },
          {
            text: "Marcar Feito",
            onPress: async () => {
              setActionLoading(task.id);
              await anticipateTask(task.id, task.frequency_days, plant.name);
              await loadData();
              setActionLoading(null);
            }
          },
          { text: "Cancelar", style: "cancel" }
      ]);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      await addPlantPhoto(plant.id, result.assets[0].uri);
      loadData();
    }
  };

  const handleUpdatePlant = async (updatedPlant: any, frequency?: number) => {
      await updatePlant(updatedPlant, frequency);
  };

  // Seleciona a melhor foto (capa) ou a mais recente
  const coverImage = plant.photo_uri;
  const filteredHistory = filterType ? history.filter(h => h.type === filterType) : history;

  return (
    <View style={tw`flex-1 bg-sage-50`}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Imagem de Capa Imersiva */}
      <View style={tw`h-[45%] w-full relative`}>
          <Image 
            source={coverImage ? { uri: coverImage } : require('../../../assets/icon.png')} // Fallback image
            style={tw`w-full h-full`} 
            resizeMode="cover" 
          />
          <View style={tw`absolute inset-0 bg-black/30`} /> {/* Overlay escuro sutil */}
          
          {/* Header Buttons */}
          <View style={tw`absolute top-12 left-6 right-6 flex-row justify-between z-10`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30`}
              accessibilityLabel="Voltar"
              accessibilityRole="button"
            >
                <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => Alert.alert("Opções", "Escolha uma ação", [
                    {text: 'Editar Planta', onPress: () => setEditModalVisible(true)},
                    {text: 'Deletar', style: 'destructive', onPress: () => {
                         Alert.alert(
                             "Atenção, ação irreversível!",
                             "Você está prestes a excluir esta planta permanentemente. Todo o histórico de cuidados será perdido. Deseja realmente continuar?",
                             [
                                 { text: "Cancelar", style: "cancel" },
                                 { text: "Sim, Deletar", style: "destructive", onPress: () => { removePlant(plant.id); navigation.goBack(); } }
                             ]
                         );
                    }},
                    {text: 'Cancelar', style: "cancel"}
                ])}
                style={tw`w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30`}
                accessibilityLabel="Opções da planta"
                accessibilityRole="button"
            >
                <MoreHorizontal size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Title Overlay na Imagem */}
          <View style={tw`absolute bottom-10 left-6 right-6`}>
              <Text style={tw`text-white font-serif font-bold text-4xl shadow-sm mb-1`}>{plant.name}</Text>
              <Text style={tw`text-sage-100 text-lg italic opacity-90`}>{plant.species}</Text>
          </View>
      </View>

      {/* Floating Bottom Sheet */}
      <View style={tw`flex-1 bg-sage-50 -mt-8 rounded-t-[36px] px-6 pt-8 shadow-2xl`}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            
            {/* Informações Rápidas - Info Pills */}
            <View style={tw`flex-row justify-between mb-8`}>
                <View style={tw`bg-white border border-sage-100 px-4 py-3 rounded-2xl items-center flex-1 mr-3 shadow-sm`}>
                    <Calendar size={18} color={tw.color('sage-500')} style={tw`mb-1.5`} />
                    <Text style={tw`text-[10px] text-sage-400 font-bold uppercase tracking-wider`}>Idade</Text>
                    <Text style={tw`text-sage-700 text-xs font-medium`}>Recente</Text>
                </View>
                <View style={tw`bg-white border border-sage-100 px-4 py-3 rounded-2xl items-center flex-1 mr-3 shadow-sm`}>
                    <ThermometerSun size={18} color={tw.color('clay-500')} style={tw`mb-1.5`} />
                    <Text style={tw`text-[10px] text-sage-400 font-bold uppercase tracking-wider`}>Local</Text>
                    <Text style={tw`text-sage-700 text-xs font-medium`} numberOfLines={1}>{plant.room}</Text>
                </View>
                <View style={tw`bg-white border border-sage-100 px-4 py-3 rounded-2xl items-center flex-1 shadow-sm`}>
                    <Box size={18} color={tw.color('orange-500')} style={tw`mb-1.5`} />
                    <Text style={tw`text-[10px] text-sage-400 font-bold uppercase tracking-wider`}>Vaso</Text>
                    <Text style={tw`text-sage-700 text-xs font-medium`}>{plant.pot_size}</Text>
                </View>
            </View>

            {/* Seção Cuidado */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-xl font-serif font-bold text-sage-900`}>Cuidados</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={tw`bg-sage-100 p-2 rounded-full`}>
                    <Plus size={20} color={tw.color('sage-600')} />
                </TouchableOpacity>
            </View>

            <View style={tw`bg-white rounded-3xl p-2 border border-sage-100 shadow-sm mb-8`}>
                {tasks.map((task, index) => {
                    const config = CARE_TYPES.find(c => c.id === task.type) || CARE_TYPES[0];
                    const Icon = config.icon;
                    const isLast = index === tasks.length - 1;
                    return (
                        <TouchableOpacity
                            key={task.id}
                            onPress={() => handleAction(task)}
                            disabled={actionLoading === task.id}
                            style={[tw`flex-row items-center p-4`, !isLast && tw`border-b border-sage-50`]}
                        >
                            <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: `${config.color}15` }]}>
                                <Icon size={22} color={config.color} />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-sage-800 font-bold text-base capitalize`}>{config.label}</Text>
                                <Text style={tw`text-sage-400 text-xs`}>Repetir a cada {task.frequency_days} dias</Text>
                            </View>
                            <View style={tw`items-end`}>
                                {actionLoading === task.id ? (
                                  <View style={tw`px-2 py-1`}>
                                    <ActivityIndicator size="small" color={tw.color('sage-500')} />
                                  </View>
                                ) : (
                                  <View style={tw`flex-row items-center bg-sage-50 px-2 py-1 rounded-lg`}>
                                      <Clock size={12} color={tw.color('sage-400')} />
                                      <Text style={tw`ml-1.5 text-sage-500 text-xs font-medium`}>
                                          {new Date(task.next_due).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                      </Text>
                                  </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {tasks.length === 0 && (
                    <Text style={tw`text-center text-sage-400 p-4 italic`}>Nenhum cuidado configurado.</Text>
                )}
            </View>

            {/* Fotos (Timeline Visual) */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
                 <Text style={tw`text-xl font-serif font-bold text-sage-900`}>Diário Visual</Text>
                 <TouchableOpacity onPress={pickImage} style={tw`bg-sage-100 p-2 rounded-full`}>
                     <Camera size={20} color={tw.color('sage-600')} />
                 </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-8 -mx-6 px-6`}>
                {photos.map((p, i) => (
                    <Image key={i} source={{ uri: p.photo_uri }} style={tw`w-28 h-28 rounded-2xl mr-3 bg-sage-100 border-2 border-white`} />
                ))}
                {photos.length === 0 && <Text style={tw`text-sage-400 italic ml-1`}>Nenhuma foto registrada ainda.</Text>}
            </ScrollView>

            {/* Histórico com Filtros */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-xl font-serif font-bold text-sage-900`}>Histórico</Text>
                <TouchableOpacity onPress={() => {
                    Alert.alert("Filtrar por", "Escolha o tipo de ação", [
                        { text: "Todos", onPress: () => setFilterType(null) },
                        ...CARE_TYPES.map(c => ({ text: c.label, onPress: () => setFilterType(c.id) })),
                        { text: "Cancelar", style: "cancel" }
                    ])
                }}>
                    <Filter size={20} color={filterType ? tw.color('sage-600') : tw.color('sage-300')} />
                </TouchableOpacity>
            </View>

            <View style={tw`bg-white rounded-3xl p-4 border border-sage-100 shadow-sm`}>
                {filteredHistory.map((h, i) => {
                    const isLast = i === filteredHistory.length - 1;
                    return (
                        <View key={i} style={[tw`flex-row items-center py-2`, !isLast && tw`border-b border-sage-50`]}>
                            <CheckCircle2 size={16} color={tw.color('sage-400')} />
                            <Text style={tw`ml-3 text-sage-600 flex-1`}>
                                <Text style={tw`font-bold capitalize`}>{h.type}</Text> realizado
                            </Text>
                            <Text style={tw`text-sage-400 text-xs`}>
                                {new Date(h.date_performed).toLocaleDateString()}
                            </Text>
                        </View>
                    );
                })}
                {filteredHistory.length === 0 && (
                    <View style={tw`items-center justify-center py-6`}>
                        <Clock size={24} color={tw.color('sage-300')} style={tw`mb-2`} />
                        <Text style={tw`text-sage-400 italic text-center text-sm`}>Nenhum histórico ainda.</Text>
                        <Text style={tw`text-sage-300 text-xs text-center`}>Complete tarefas para vê-las aqui.</Text>
                    </View>
                )}
            </View>

        </ScrollView>
      </View>

      <EditPlantModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        plant={plant}
        onSave={handleUpdatePlant}
      />

      {/* Modal Novo Cuidado */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-sage-900/50`}>
            <View style={tw`bg-white rounded-t-[32px] p-6`}>
                <View style={tw`flex-row justify-between mb-6`}>
                    <Text style={tw`text-xl font-serif font-bold text-sage-900`}>Novo Cuidado</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={tw`text-sage-500 font-bold`}>Cancelar</Text></TouchableOpacity>
                </View>
                <View style={tw`flex-row flex-wrap gap-2 mb-6`}>
                    {CARE_TYPES.map(t => (
                        <TouchableOpacity key={t.id} onPress={() => setSelectedType(t.id)} 
                            style={tw`px-4 py-2.5 rounded-full border flex-row items-center ${selectedType === t.id ? 'bg-sage-600 border-sage-600' : 'bg-white border-sage-200'}`}>
                            {selectedType === t.id && <CheckCircle2 size={14} color="white" style={tw`mr-2`} />}
                            <Text style={tw`${selectedType === t.id ? 'text-white' : 'text-sage-600'} font-bold text-sm`}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={tw`text-sage-500 mb-2 ml-1 text-xs font-bold uppercase`}>Frequência</Text>
                <TextInput
                    placeholder="A cada quantos dias?"
                    keyboardType="numeric"
                    placeholderTextColor={tw.color('sage-300')}
                    style={tw`bg-sage-50 p-4 rounded-2xl mb-1 text-sage-800 font-bold border border-sage-100`}
                    value={newFrequency}
                    onChangeText={setNewFrequency}
                    accessibilityLabel="Frequência em dias"
                />
                <Text style={tw`text-sage-400 text-xs mb-6 ml-1`}>Ex: 7 (semanal), 30 (mensal)</Text>

                <TouchableOpacity onPress={handleAddTask} style={tw`bg-sage-600 p-4 rounded-2xl items-center shadow-lg shadow-sage-600/30`}>
                    <Text style={tw`text-white font-bold text-lg`}>Salvar Rotina</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}
