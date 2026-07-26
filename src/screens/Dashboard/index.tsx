import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlants } from '../../contexts/PlantContext';
import { Plus, Wind, Sun, Grid, List as ListIcon } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import tw from '../../utils/tw';
import { teardrop } from '../../utils/shape';
import * as Location from 'expo-location';
import { WeatherService, WeatherData } from '../../services/WeatherService';
import { APP_LOCALE } from '../../i18n';
import { useTranslation } from 'react-i18next';
import TaskItem from './TaskItem';

const GAP = 14;
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
        style={tw`flex-row items-center bg-stone-50 px-4 py-2 rounded-full border border-stone-200`}
        accessibilityLabel={`Temperatura atual: ${weather.temp} graus Celsius`}
        accessibilityRole="text"
      >
        <Icon size={14} color="#7C9B72" />
        <Text style={tw`ml-2 text-stone-700 font-bold text-sm`}>{weather.temp}°</Text>
      </View>
    );
  };

  const renderTaskItem = useCallback(({ item }: { item: any }) => <TaskItem item={item} />, []);

  const renderPlantItem = useCallback(({ item }: { item: any }) => {
    const hasTask = dueTasks.some(t => t.plant_id === item.id);
    const accessLabel = `${item.name}, ${item.species || 'Espécie desconhecida'}, em ${item.room}. ${hasTask ? 'Tem cuidados pendentes.' : 'Tudo em dia.'}`;

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={tw`px-6 flex-row items-center py-3.5 border-t border-stone-100`}
          onPress={() => navigation.navigate('PlantDetails', { plant: item })}
          activeOpacity={0.6}
          accessibilityLabel={accessLabel}
          accessibilityRole="button"
        >
          <Image
            source={item.photo_uri ? { uri: item.photo_uri } : require('../../../assets/plant-placeholder.png')}
            style={[tw`bg-stone-100 mr-3.5`, teardrop(48)]}
          />
          <View style={tw`flex-1`}>
            <Text style={tw`font-normal text-stone-900 text-[15px]`} numberOfLines={1}>{item.name}</Text>
            <Text style={tw`text-stone-400 text-xs mt-0.5`} numberOfLines={1}>{item.species || 'Planta Misteriosa'} · {item.room}</Text>
          </View>
          {hasTask && <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: '#D98F5F' }]} />}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[tw`bg-stone-50 rounded-3xl mb-3.5 overflow-hidden`, { width: CARD_WIDTH }]}
        onPress={() => navigation.navigate('PlantDetails', { plant: item })}
        activeOpacity={0.7}
        accessibilityLabel={accessLabel}
        accessibilityRole="button"
      >
        <Image
          source={item.photo_uri ? { uri: item.photo_uri } : require('../../../assets/plant-placeholder.png')}
          style={tw`w-full h-28 bg-stone-100`}
          resizeMode="cover"
        />
        <View style={tw`p-3`}>
          <Text style={tw`font-normal text-stone-900 text-sm`} numberOfLines={1}>{item.name}</Text>
          <Text style={tw`text-stone-400 text-[11px] mt-0.5`} numberOfLines={1}>{item.room}</Text>
        </View>
        {hasTask && (
          <View style={[tw`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full border border-white`, { backgroundColor: '#D98F5F' }]} />
        )}
      </TouchableOpacity>
    );
  }, [viewMode, dueTasks, navigation, CARD_WIDTH]);

  const renderHeader = () => (
    <View style={tw`px-6 pt-6 pb-2`}>
      {/* Header */}
      <View style={tw`flex-row justify-between items-start mb-7`}>
        <View>
          <Text style={tw`text-stone-400 text-[11px] font-label uppercase tracking-[2px] mb-2`}>
            {new Date().toLocaleDateString(APP_LOCALE, { weekday: 'long', day: 'numeric' })}
          </Text>
          <Text style={tw`text-4xl font-light text-stone-900`} numberOfLines={1}>{t('greeting')}</Text>
        </View>
        {renderWeatherPill()}
      </View>

      {/* Weather tip */}
      {weather && (weather.temp > 28 || weather.humidity < 40) && (
        <View style={[tw`p-4 rounded-3xl mb-6 flex-row items-start`, { backgroundColor: '#FBEEE3' }]}>
          <View style={tw`bg-white p-2 rounded-full mr-3`}>
            <Wind size={16} color="#D98F5F" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={[tw`font-bold text-sm mb-0.5`, { color: '#3E2A1B' }]}>Dica do Dia</Text>
            <Text style={[tw`text-xs leading-5`, { color: '#B08A63' }]}>
              {weather.temp > 28
                ? "Está fazendo calor! Verifique se suas plantas precisam de um pouco mais de água hoje."
                : "O ar está seco. Suas plantas tropicais adorariam uma borrifada de água (mist)."}
            </Text>
          </View>
        </View>
      )}

      {/* Today's tasks */}
      {dueTasks.length > 0 && (
        <View>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={tw`text-[13px] font-label uppercase tracking-[1px] text-stone-900`}>Para hoje</Text>
            <Text style={tw`text-stone-400 text-xs font-medium`}>{dueTasks.length}</Text>
          </View>

          <FlatList
            data={dueTasks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
            renderItem={renderTaskItem}
            contentContainerStyle={{ paddingRight: 24, paddingBottom: 4 }}
            style={tw`mb-2`}
          />
        </View>
      )}

      {dueTasks.length === 0 && (
        <View style={tw`bg-stone-50 p-4.5 rounded-3xl items-center flex-row mb-7`}>
          <View style={[tw`bg-white items-center justify-center mr-4`, teardrop(44)]}>
            <Sun size={20} color="#7C9B72" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-stone-900 font-medium text-[15px] mb-0.5`}>{t('all_done_title')}</Text>
            <Text style={tw`text-stone-400 text-xs leading-5`}>{t('all_done_subtitle')}</Text>
          </View>
        </View>
      )}

      {/* My plants section */}
      <View style={tw`flex-row items-center justify-between mt-2 mb-4`}>
        <Text style={tw`text-[13px] font-label uppercase tracking-[1px] text-stone-900`}>Minhas Plantas</Text>

        <View style={tw`flex-row bg-stone-100 p-0.5 rounded-lg`}>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={tw`px-2 py-1.5 rounded-md ${viewMode === 'list' ? 'bg-white' : ''}`}
            accessibilityLabel={t('view_list')}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'list' }}
          >
            <ListIcon size={15} color={viewMode === 'list' ? '#232320' : '#A8A29E'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('gallery')}
            style={tw`px-2 py-1.5 rounded-md ${viewMode === 'gallery' ? 'bg-white' : ''}`}
            accessibilityLabel={t('view_gallery')}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'gallery' }}
          >
            <Grid size={15} color={viewMode === 'gallery' ? '#232320' : '#A8A29E'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Room chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-1`}>
        {rooms.map(room => (
          <TouchableOpacity
            key={room}
            onPress={() => handleRoomPress(room)}
            style={tw`mr-2 px-4 py-2 rounded-full ${activeTab === room ? 'bg-stone-900' : 'bg-stone-100'}`}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={`Filtrar por sala: ${room === 'All' ? 'Todas' : room}`}
            accessibilityState={{ selected: activeTab === room }}
          >
            <Text style={tw`font-medium text-xs ${activeTab === room ? 'text-white' : 'text-stone-500'}`}>
              {room === 'All' ? 'Todos' : room}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <FlatList
        ListHeaderComponent={renderHeader()}
        data={filteredPlants}
        ListEmptyComponent={
          <View style={tw`items-center justify-center py-10 px-6`}>
            <View style={[tw`bg-stone-50 items-center justify-center mb-4`, teardrop(72, 24)]}>
              <Text style={{ fontSize: 28 }}>🌱</Text>
            </View>
            <Text style={tw`text-stone-900 font-medium text-base mb-2`}>
              {activeTab === 'All' ? "Sua selva está silenciosa..." : `Nada em '${activeTab}'`}
            </Text>
            <Text style={tw`text-stone-400 text-center text-sm mb-6 leading-5`}>
              {activeTab === 'All'
                ? "Que tal dar vida a este espaço? Adicione sua primeira planta!"
                : "Não encontramos plantas neste ambiente."}
            </Text>
            {activeTab === 'All' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('AddPlant')}
                style={[tw`px-6 py-3 rounded-xl`, { backgroundColor: '#7C9B72' }]}
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
        key={viewMode}
        columnWrapperStyle={viewMode === 'gallery' ? tw`justify-between px-6 gap-3.5` : undefined}
        contentContainerStyle={{ paddingBottom: 110 }}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('AddPlant')}
        style={[tw`absolute bottom-8 right-6 justify-center items-center shadow-lg`, teardrop(56, 18), { backgroundColor: '#7C9B72', shadowColor: '#7C9B72', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } }]}
        activeOpacity={0.9}
        accessibilityLabel="Adicionar nova planta"
        accessibilityRole="button"
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
