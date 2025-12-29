import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlants } from '../../contexts/PlantContext';
import { Plus, MapPin, Droplets, Check, Sprout, Scissors, Wind, Box, Sun } from 'lucide-react-native';
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
        <View style={tw`flex-row items-center bg-white px-4 py-2 rounded-full shadow-sm border border-sage-100`}>
            <Icon size={16} color={tw.color('sage-600')} />
            <Text style={tw`ml-2 text-sage-800 font-bold text-sm`}>{weather.temp}°</Text>
        </View>
    );
  };

  const renderTaskItem = ({ item }: { item: any }) => {
     let Icon = Droplets;
     let label = t('care');
     let colorClass = "bg-sage-500";
     let iconColor = tw.color('sage-600');
     let bgIcon = "bg-sage-100";

     switch (item.type) {
        case 'fertilize':
            Icon = Sprout;
            label = t('fertilize');
            colorClass = "bg-clay-400"; // Clay for earth/growth
            iconColor = tw.color('clay-600');
            bgIcon = "bg-clay-100";
            break;
        case 'prune':
            Icon = Scissors;
            label = t('prune');
            colorClass = "bg-red-400"; // Softer red
            iconColor = tw.color('red-600');
            bgIcon = "bg-red-100";
            break;
        case 'mist':
            Icon = Wind;
            label = t('mist');
            colorClass = "bg-sky-400"; // Sky blue for mist
            iconColor = tw.color('sky-600');
            bgIcon = "bg-sky-100";
            break;
        case 'repot':
            Icon = Box;
            label = t('repot');
            colorClass = "bg-orange-400";
            iconColor = tw.color('orange-600');
            bgIcon = "bg-orange-100";
            break;
        default:
            Icon = Droplets;
            label = t('water');
            colorClass = "bg-sky-500"; // Water is blue/sky
            iconColor = tw.color('sky-600');
            bgIcon = "bg-sky-100";
     }

     return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PlantDetails', { plant: plants.find(p => p.id === item.plant_id) })}
            style={tw`bg-white w-72 p-4 rounded-3xl mr-4 shadow-sm border border-sage-100 mb-4`}
        >
            <View style={tw`flex-row`}>
                <Image
                    source={item.photo_uri ? { uri: item.photo_uri } : require('../../../assets/icon.png')}
                    style={tw`w-20 h-24 rounded-2xl bg-sage-50`}
                    resizeMode="cover"
                />
                <View style={tw`flex-1 ml-4 justify-between py-1`}>
                    <View>
                        <Text style={tw`font-bold text-sage-900 text-lg`} numberOfLines={1}>{item.plant_name}</Text>
                        <View style={tw`flex-row items-center mt-1`}>
                             <View style={tw`${bgIcon} p-1 rounded-full mr-1.5`}>
                                 <Icon size={10} color={iconColor} />
                             </View>
                             <Text style={tw`text-sage-500 text-xs font-medium uppercase tracking-wide`}>{item.type}</Text>
                        </View>
                    </View>

                    <View style={tw`flex-row gap-2 mt-3`}>
                         <TouchableOpacity
                            onPress={() => completeTask(item.id, item.frequency_days, item.plant_name)}
                            style={tw`flex-1 ${colorClass} py-2.5 rounded-xl items-center flex-row justify-center shadow-sm`}
                         >
                            <Check size={14} color="white" style={tw`mr-1.5`} />
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
            style={[tw`bg-white p-5 rounded-[28px] mb-4 shadow-sm border border-sage-100 justify-between`, { width: CARD_WIDTH, height: CARD_WIDTH * 1.15 }]}
            onPress={() => handleRoomPress(room)}
            activeOpacity={0.8}
        >
            <View style={tw`flex-row justify-between items-start`}>
                <View style={tw`bg-sage-50 w-11 h-11 rounded-2xl items-center justify-center`}>
                    <MapPin size={20} color={tw.color('sage-600')} />
                </View>
                {pendingCount > 0 ? (
                    <View style={tw`bg-clay-400 px-2.5 py-1 rounded-full border border-white shadow-sm`}>
                        <Text style={tw`text-white text-[10px] font-bold`}>{pendingCount}</Text>
                    </View>
                ) : (
                    <View style={tw`bg-sage-100 px-2 py-1 rounded-full`}>
                         <Check size={12} color={tw.color('sage-600')} />
                    </View>
                )}
            </View>

            <View>
                <Text style={tw`font-serif font-bold text-sage-900 text-lg leading-tight mb-1`} numberOfLines={1}>{room}</Text>
                <Text style={tw`text-sage-500 text-xs`}>{t('plants_count', {count: roomPlants.length})}</Text>
            </View>

            {/* Micro-Visual of plants */}
            <View style={tw`flex-row mt-2 pl-3`}>
                {roomPlants.slice(0, 3).map((p, i) => (
                    <View key={p.id} style={tw`w-7 h-7 rounded-full border-2 border-white -ml-3 bg-sage-200 overflow-hidden shadow-sm`}>
                         {p.photo_uri ? (
                            <Image source={{ uri: p.photo_uri }} style={tw`w-full h-full`} />
                         ) : null}
                    </View>
                ))}
                {roomPlants.length > 3 && (
                     <View style={tw`w-7 h-7 rounded-full border-2 border-white -ml-3 bg-sage-100 items-center justify-center`}>
                        <Text style={tw`text-[8px] text-sage-600 font-bold`}>+{roomPlants.length - 3}</Text>
                     </View>
                )}
            </View>
        </TouchableOpacity>
    );
  };

  const RenderHeader = () => (
    <View style={tw`px-6 pt-6 pb-2`}>
        {/* Header Title */}
        <View style={tw`flex-row justify-between items-start mb-8`}>
            <View>
                <Text style={tw`text-sage-500 text-xs font-bold uppercase tracking-widest mb-1`}>
                    {new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'pt-BR', { weekday: 'long', day: 'numeric' })}
                </Text>
                <Text style={tw`text-3xl font-serif font-medium text-sage-900`}>{t('greeting')}</Text>
            </View>
            <WeatherPill />
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
        <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-xl font-serif font-bold text-sage-900`}>{t('daily_rituals')}</Text>
            {dueTasks.length > 0 && (
                <View style={tw`bg-sage-100 px-2 py-1 rounded-md`}>
                    <Text style={tw`text-sage-700 text-xs font-bold`}>{dueTasks.length}</Text>
                </View>
            )}
        </View>

        {dueTasks.length === 0 ? (
            <View style={tw`bg-white p-6 rounded-3xl border border-sage-100 items-center flex-row mb-8 shadow-sm`}>
                <View style={tw`bg-sage-50 p-4 rounded-full mr-5`}>
                    <Sun size={24} color={tw.color('sage-500')} />
                </View>
                <View style={tw`flex-1`}>
                    <Text style={tw`text-sage-800 font-bold text-base mb-1`}>{t('all_done_title')}</Text>
                    <Text style={tw`text-sage-500 text-sm leading-5`}>{t('all_done_subtitle')}</Text>
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
                style={tw`mb-4`}
            />
        )}

        <Text style={tw`text-xl font-serif font-bold text-sage-900 mt-2 mb-4`}>{t('rooms')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-sage-50`}>
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
