import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlants } from '../../contexts/PlantContext';
import { Plus, MapPin, Droplets, Check, Sprout, Scissors, Wind, Box, Sun, Grid, List as ListIcon } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import tw from '../../utils/tw';
import * as Location from 'expo-location';
import { WeatherService, WeatherData } from '../../services/WeatherService';
import { APP_LOCALE } from '../../i18n';
import { useTranslation } from 'react-i18next';
import TaskItem from './TaskItem';

const GAP = 16;
const PADDING = 24;

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - (PADDING * 2) - GAP) / 2;
  const { t } = useTranslation();
  const { plants, dueTasks, loadData } = usePlants();
  const navigation = useNavigation<any>();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  const [activeTab, setActiveTab] = useState('All');

  useFocusEffect(useCallback(() => { loadData(); }, []));

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          const w = await WeatherService.getWeather(location.coords.latitude, location.coords.longitude);
          setWeather(w);
        }
      } catch (e) { if (__DEV__) console.log('Weather error', e); }
    })();
  }, []);

  const rooms = React.useMemo(() => ['All', ...Array.from(new Set(plants.map(p => p.room))).sort()], [plants]);

  // Filter plants based on active room
  const filteredPlants = React.useMemo(() => activeTab === 'All'
    ? plants
    : plants.filter(p => p.room === activeTab), [activeTab, plants]);

  const handleRoomPress = (room: string) => {
    setActiveTab(room);
  };

  const renderWeatherPill = () => {
    if (!weather) return null;
    const config = WeatherService.getWeatherIconConfig(weather.conditionCode, weather.isDay);
    const Icon = config.icon;
    return (
        <View
            style={tw`flex-row items-center bg-white px-4 py-2 rounded-full shadow-sm border border-sage-100`}
            accessibilityLabel={`Temperatura atual: ${weather.temp} graus Celsius`}
            accessibilityRole="text"
        >
            <Icon size={16} color={tw.color('sage-600')} />
            <Text style={tw`ml-2 text-sage-800 font-bold text-sm`}>{weather.temp}°</Text>
        </View>
    );
  };

  const renderTaskItem = useCallback(({ item }: { item: any }) => <TaskItem item={item} />, []);

  const renderPlantItem = useCallback(({ item }: { item: any }) => {
    // Check if this plant has a due task
    const hasTask = dueTasks.some(t => t.plant_id === item.id);
    const accessLabel = `${item.name}, ${item.species || 'Espécie desconhecida'}, em ${item.room}. ${hasTask ? 'Tem cuidados pendentes.' : 'Tudo em dia.'}`;

    if (viewMode === 'list') {
      return (
        <TouchableOpacity 
          style={tw`mx-6 bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm border ${hasTask ? 'border-clay-300' : 'border-sage-50'}`}
          onPress={() => navigation.navigate('PlantDetails', { plant: item })}
          activeOpacity={0.7}
          accessibilityLabel={accessLabel}
          accessibilityRole="button"
        >
           <Image
              source={item.photo_uri ? { uri: item.photo_uri } : require('../../../assets/plant-placeholder.png')}
              style={tw`w-14 h-14 rounded-full bg-sage-100 mr-4`}
            />
            <View style={tw`flex-1`}>
               <Text style={tw`font-bold text-sage-900 text-base`}>{item.name}</Text>
               <Text style={tw`text-sage-500 text-xs italic`}>{item.species || 'Planta Misteriosa'}</Text>
            </View>
            {hasTask && (
                <View style={tw`bg-clay-100 p-2 rounded-full`}>
                    <Droplets size={16} color={tw.color('clay-600')} />
                </View>
            )}
        </TouchableOpacity>
      );
    }

    // Gallery View
    return (
        <TouchableOpacity
            style={[tw`bg-white rounded-3xl mb-4 shadow-sm border border-sage-50 overflow-hidden`, { width: CARD_WIDTH }]}
            onPress={() => navigation.navigate('PlantDetails', { plant: item })}
            activeOpacity={0.7}
            accessibilityLabel={accessLabel}
            accessibilityRole="button"
        >
            <Image
                source={item.photo_uri ? { uri: item.photo_uri } : require('../../../assets/plant-placeholder.png')}
                style={tw`w-full h-32 bg-sage-100`}
                resizeMode="cover"
            />
            <View style={tw`p-3`}>
                <Text style={tw`font-bold text-sage-900 text-sm`} numberOfLines={1}>{item.name}</Text>
                <Text style={tw`text-sage-500 text-xs`} numberOfLines={1}>{item.room}</Text>
            </View>
             {hasTask && (
                <View style={tw`absolute top-2 right-2 bg-clay-500 w-3 h-3 rounded-full border border-white`} />
            )}
        </TouchableOpacity>
    );
  }, [viewMode, dueTasks, navigation, CARD_WIDTH]);

  const renderHeader = () => (
    <View style={tw`px-6 pt-6 pb-2`}>
        {/* Header Title */}
        <View style={tw`flex-row justify-between items-start mb-6`}>
            <View>
                <Text style={tw`text-sage-500 text-xs font-bold uppercase tracking-widest mb-1`}>
                    {new Date().toLocaleDateString(APP_LOCALE, { weekday: 'long', day: 'numeric' })}
                </Text>
                <Text style={tw`text-3xl font-serif font-medium text-sage-900`}>{t('greeting')}</Text>
            </View>
            {renderWeatherPill()}
        </View>

         {/* Suggestion based on weather */}
         {weather && (weather.temp > 28 || weather.humidity < 40) && (
             <View style={tw`bg-clay-50 p-4 rounded-2xl mb-8 border border-clay-100 flex-row items-start shadow-sm`}>
                 <View style={tw`bg-white p-2 rounded-full mr-3 shadow-sm`}>
                     <Wind size={18} color={tw.color('clay-500')} />
                 </View>
                 <View style={tw`flex-1`}>
                     <Text style={tw`text-clay-800 font-bold text-sm mb-0.5`}>Dica do Dia</Text>
                     <Text style={tw`text-clay-700 text-xs leading-5`}>
                         {weather.temp > 28
                            ? "Está fazendo calor! Verifique se suas plantas precisam de um pouco mais de água hoje."
                            : "O ar está seco. Suas plantas tropicais adorariam uma borrifada de água (mist)."}
                     </Text>
                 </View>
             </View>
         )}

        {/* Daily Rituals (Tasks) */}
        {dueTasks.length > 0 && (
          <View>
            <View style={tw`flex-row items-center justify-between mb-4`}>
                <Text style={tw`text-xl font-serif font-bold text-sage-900`}>{t('daily_rituals')}</Text>
                <View style={tw`bg-sage-100 px-2 py-1 rounded-md`}>
                    <Text style={tw`text-sage-700 text-xs font-bold`}>{dueTasks.length}</Text>
                </View>
            </View>

            <FlatList
                data={dueTasks}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                renderItem={renderTaskItem}
                contentContainerStyle={{ paddingRight: 24, paddingBottom: 10 }}
                style={tw`mb-4`}
            />
          </View>
        )}

        {dueTasks.length === 0 && (
             <View style={tw`bg-white p-6 rounded-3xl border border-sage-100 items-center flex-row mb-8 shadow-sm`}>
                <View style={tw`bg-sage-50 p-4 rounded-full mr-5`}>
                    <Sun size={24} color={tw.color('sage-500')} />
                </View>
                <View style={tw`flex-1`}>
                    <Text style={tw`text-sage-800 font-bold text-base mb-1`}>{t('all_done_title')}</Text>
                    <Text style={tw`text-sage-500 text-sm leading-5`}>{t('all_done_subtitle')}</Text>
                </View>
            </View>
        )}

        {/* My Jungle Section */}
        <View style={tw`flex-row items-center justify-between mt-4 mb-4`}>
            <Text style={tw`text-xl font-serif font-bold text-sage-900`}>Minhas Plantas</Text>

            <View style={tw`flex-row bg-gray-100 p-1 rounded-lg`}>
                <TouchableOpacity
                    onPress={() => setViewMode('list')}
                    style={tw`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                    accessibilityLabel={t('view_list')}
                    accessibilityRole="button"
                    accessibilityState={{ selected: viewMode === 'list' }}
                >
                    <ListIcon size={16} color={viewMode === 'list' ? '#166534' : '#9ca3af'} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setViewMode('gallery')}
                    style={tw`p-1.5 rounded-md ${viewMode === 'gallery' ? 'bg-white shadow-sm' : ''}`}
                    accessibilityLabel={t('view_gallery')}
                    accessibilityRole="button"
                    accessibilityState={{ selected: viewMode === 'gallery' }}
                >
                    <Grid size={16} color={viewMode === 'gallery' ? '#166534' : '#9ca3af'} />
                </TouchableOpacity>
            </View>
        </View>

        {/* Room Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
            {rooms.map(room => (
                <TouchableOpacity
                    key={room}
                    onPress={() => handleRoomPress(room)}
                    style={tw`mr-3 px-4 py-2 rounded-full border ${activeTab === room ? 'bg-sage-600 border-sage-600' : 'bg-transparent border-gray-200'}`}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityLabel={`Filtrar por sala: ${room === 'All' ? 'Todas' : room}`}
                    accessibilityState={{ selected: activeTab === room }}
                >
                    <Text style={tw`font-bold ${activeTab === room ? 'text-white' : 'text-gray-500'}`}>
                        {room === 'All' ? 'Todos' : room}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-sage-50`}>
      <FlatList
        ListHeaderComponent={renderHeader()}
        data={filteredPlants}
        ListEmptyComponent={
          <View style={tw`items-center justify-center py-10 px-6`}>
            <View style={tw`bg-sage-100 w-20 h-20 rounded-full items-center justify-center mb-4`}>
                <Sprout size={40} color={tw.color('sage-500')} />
            </View>
            <Text style={tw`text-sage-800 font-bold text-lg mb-2`}>
               {activeTab === 'All' ? "Sua selva está silenciosa..." : `Nada em '${activeTab}'`}
            </Text>
            <Text style={tw`text-sage-400 text-center text-sm mb-6 leading-5`}>
              {activeTab === 'All'
                ? "Que tal dar vida a este espaço? Adicione sua primeira planta!"
                : "Não encontramos plantas neste ambiente."}
            </Text>
            {activeTab === 'All' && (
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddPlant')}
                    style={tw`bg-sage-600 px-6 py-3 rounded-xl shadow-sm`}
                    accessibilityRole="button"
                    accessibilityLabel="Começar agora, adicionar planta"
                >
                    <Text style={tw`text-white font-bold`}>Começar Agora</Text>
                </TouchableOpacity>
            )}
          </View>
        }
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={renderPlantItem}
        numColumns={viewMode === 'gallery' ? 2 : 1}
        // Force re-render when switching columns
        key={viewMode}
        columnWrapperStyle={viewMode === 'gallery' ? tw`justify-between px-6 gap-4` : undefined}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity 
        onPress={() => navigation.navigate('AddPlant')}
        style={tw`absolute bottom-8 right-6 bg-sage-600 w-16 h-16 rounded-full justify-center items-center shadow-lg shadow-sage-900/20 border-4 border-white`}
        activeOpacity={0.9}
        accessibilityLabel="Adicionar nova planta"
        accessibilityRole="button"
      >
        <Plus color="#FAF9F6" size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
