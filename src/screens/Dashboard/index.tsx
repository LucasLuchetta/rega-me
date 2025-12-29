import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlants } from '../../contexts/PlantContext';
import { Plus, MapPin, Droplets, Check, Sprout, Scissors, Wind, Box } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import tw from '../../utils/tw';
import * as Location from 'expo-location';
import { WeatherService, WeatherData } from '../../services/WeatherService';
import '../../i18n';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const { width } = Dimensions.get('window');
// Layout calculation: Screen Width - Horizontal Padding (24*2) - Gap (16) / 2 columns
const GAP = 16;
const PADDING = 24;
const CARD_WIDTH = (width - (PADDING * 2) - GAP) / 2;

export default function Dashboard() {
  const { t } = useTranslation();
  const { plants, dueTasks, completeTask, loadData } = usePlants();
  const navigation = useNavigation<any>();
  const [weather, setWeather] = useState<WeatherData | null>(null);

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
      } catch (e) { console.log('Weather error', e); }
    })();
  }, []);

  const rooms = Array.from(new Set(plants.map(p => p.room))).sort();

  const handleRoomPress = (room: string) => {
    navigation.navigate('RoomDetail', { room });
  };

  const WeatherPill = () => {
    if (!weather) return null;
    const config = WeatherService.getWeatherIconConfig(weather.conditionCode, weather.isDay);
    const Icon = config.icon;
    return (
        <View style={tw`flex-row items-center bg-sage-50 px-3 py-1.5 rounded-full`}>
            <Icon size={14} color={tw.color('sage-600')} />
            <Text style={tw`ml-2 text-sage-800 font-bold text-xs`}>{weather.temp}°</Text>
        </View>
    );
  };

  const renderTaskItem = ({ item }: { item: any }) => {
     let Icon = Droplets;
     let label = t('care');
     let color = "bg-sage-500";

     switch (item.type) {
        case 'fertilize': Icon = Sprout; label = t('fertilize'); color = "bg-yellow-500"; break;
        case 'prune': Icon = Scissors; label = t('prune'); color = "bg-red-500"; break;
        case 'mist': Icon = Wind; label = t('mist'); color = "bg-purple-500"; break;
        case 'repot': Icon = Box; label = t('repot'); color = "bg-orange-500"; break;
        default: Icon = Droplets; label = t('water'); color = "bg-sage-500";
     }

     return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PlantDetails', { plant: plants.find(p => p.id === item.plant_id) })}
            style={tw`bg-surface w-72 p-4 rounded-3xl mr-4 shadow-sm border border-gray-100 mb-4`}
        >
            <View style={tw`flex-row`}>
                <Image
                    source={item.photo_uri ? { uri: item.photo_uri } : require('../../../assets/icon.png')}
                    style={tw`w-20 h-24 rounded-2xl bg-gray-100`}
                    resizeMode="cover"
                />
                <View style={tw`flex-1 ml-4 justify-between py-1`}>
                    <View>
                        <Text style={tw`font-bold text-text-primary text-lg`} numberOfLines={1}>{item.plant_name}</Text>
                        <Text style={tw`text-text-secondary text-xs uppercase tracking-wide`}>{item.type}</Text>
                    </View>

                    <View style={tw`flex-row gap-2 mt-2`}>
                         <TouchableOpacity
                            onPress={() => completeTask(item.id, item.frequency_days, item.plant_name)}
                            style={tw`flex-1 ${color} py-2 rounded-xl items-center flex-row justify-center`}
                         >
                            <Icon size={14} color="white" style={tw`mr-1.5`} />
                            <Text style={tw`text-white font-bold text-xs`}>{label}</Text>
                         </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
     );
  };

  const renderRoomItem = ({ item: room }: { item: string }) => {
    const roomPlants = plants.filter(p => p.room === room);
    const pendingCount = dueTasks.filter(t => t.room === room).length;

    return (
        <TouchableOpacity 
            style={[tw`bg-surface p-4 rounded-3xl mb-4 shadow-sm border border-gray-100 justify-between`, { width: CARD_WIDTH, height: CARD_WIDTH * 1.1 }]}
            onPress={() => handleRoomPress(room)}
            activeOpacity={0.8}
        >
            <View style={tw`flex-row justify-between items-start`}>
                <View style={tw`bg-sage-50 w-10 h-10 rounded-full items-center justify-center`}>
                    <MapPin size={18} color={tw.color('sage-600')} />
                </View>
                {pendingCount > 0 ? (
                    <View style={tw`bg-clay-400 px-2 py-1 rounded-full`}>
                        <Text style={tw`text-white text-[10px] font-bold`}>{pendingCount}</Text>
                    </View>
                ) : (
                    <View style={tw`bg-sage-100 p-1 rounded-full`}>
                         <Check size={14} color={tw.color('sage-600')} />
                    </View>
                )}
            </View>

            <View>
                <Text style={tw`font-bold text-text-primary text-lg leading-tight mb-1`} numberOfLines={1}>{room}</Text>
                <Text style={tw`text-text-secondary text-xs`}>{t('plants_count', {count: roomPlants.length})}</Text>
            </View>

            {/* Micro-Visual of plants */}
            <View style={tw`flex-row mt-2 pl-2`}>
                {roomPlants.slice(0, 3).map((p, i) => (
                    <View key={p.id} style={tw`w-6 h-6 rounded-full border border-white -ml-2 bg-sage-100 overflow-hidden`}>
                         {p.photo_uri ? (
                            <Image source={{ uri: p.photo_uri }} style={tw`w-full h-full`} />
                         ) : null}
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
  };

  const RenderHeader = () => (
    <View style={tw`px-6 pt-4 pb-2`}>
        {/* Header Title */}
        <View style={tw`flex-row justify-between items-center mb-8`}>
            <View>
                <Text style={tw`text-sage-600 text-xs font-bold uppercase tracking-widest mb-1`}>
                    {new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'pt-BR', { weekday: 'long', day: 'numeric' })}
                </Text>
                <Text style={tw`text-3xl font-serif font-medium text-text-primary`}>{t('greeting')}</Text>
            </View>
            <WeatherPill />
        </View>

         {/* Suggestion based on weather */}
         {weather && (weather.temp > 28 || weather.humidity < 40) && (
             <View style={tw`bg-orange-50 p-3 rounded-xl mb-6 border border-orange-100 flex-row items-center`}>
                 <Wind size={16} color="#c2410c" style={tw`mr-2`} />
                 <Text style={tw`text-orange-800 text-xs font-bold flex-1`}>
                     {weather.temp > 28 ? "Dia quente! Verifique se suas plantas precisam de mais água." : "Ar seco hoje. Considere borrifar suas plantas tropicais."}
                 </Text>
             </View>
         )}
         {weather && weather.humidity > 80 && (
             <View style={tw`bg-blue-50 p-3 rounded-xl mb-6 border border-blue-100 flex-row items-center`}>
                 <Droplets size={16} color="#1d4ed8" style={tw`mr-2`} />
                 <Text style={tw`text-blue-800 text-xs font-bold flex-1`}>
                     {t('weather_suggestion')}
                 </Text>
             </View>
         )}

        {/* Daily Rituals (Tasks) */}
        <Text style={tw`text-lg font-bold text-text-primary mb-4`}>{t('daily_rituals')}</Text>
        {dueTasks.length === 0 ? (
            <View style={tw`bg-sage-50 p-6 rounded-3xl border border-sage-100 items-center flex-row mb-6`}>
                <View style={tw`bg-sage-100 p-3 rounded-full mr-4`}>
                    <Check size={20} color={tw.color('sage-700')} />
                </View>
                <View style={tw`flex-1`}>
                    <Text style={tw`text-sage-800 font-bold text-base`}>{t('all_done_title')}</Text>
                    <Text style={tw`text-sage-600 text-sm`}>{t('all_done_subtitle')}</Text>
                </View>
            </View>
        ) : (
            <FlatList
                data={dueTasks}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id.toString()}
                renderItem={renderTaskItem}
                contentContainerStyle={{ paddingRight: 24, paddingBottom: 10 }}
            />
        )}

        <Text style={tw`text-lg font-bold text-text-primary mt-2 mb-4`}>{t('rooms')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-canvas`}>
      <FlatList
        ListHeaderComponent={RenderHeader}
        data={rooms}
        keyExtractor={item => item}
        renderItem={renderRoomItem}
        numColumns={2}
        columnWrapperStyle={tw`justify-between px-6 gap-4`}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity 
        onPress={() => navigation.navigate('AddPlant')}
        style={tw`absolute bottom-8 right-6 bg-sage-800 w-16 h-16 rounded-full justify-center items-center shadow-lg shadow-sage-900/30`}
        activeOpacity={0.9}
        accessibilityLabel="Adicionar nova planta"
        accessibilityRole="button"
      >
        <Plus color="#FAF9F6" size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
