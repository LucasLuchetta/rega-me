import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlants } from '../../contexts/PlantContext';
import tw from '../../utils/tw';
import { ArrowLeft, Droplets, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function RoomDetail() {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { room } = route.params;
  const { plants, dueTasks, completeAllInRoom } = usePlants();

  const roomPlants = plants.filter(p => p.room === room);
  const roomTasks = dueTasks.filter(t => t.room === room);

  const handleWaterAll = () => {
    if (roomTasks.length === 0) return;
    Alert.alert(
      t('water_all_title'),
      t('water_all_confirm', {room}),
      [
        { text: t('cancel'), style: "cancel" },
        { text: t('yes_water_all'), onPress: () => completeAllInRoom(room) }
      ]
    );
  };

  const renderPlantItem = ({ item }: { item: any }) => (
    <TouchableOpacity
        onPress={() => navigation.navigate('PlantDetails', { plant: item })}
        style={tw`flex-row items-center bg-surface p-4 rounded-3xl mb-4 shadow-sm border border-gray-100`}
    >
        <Image
            source={item.photo_uri ? { uri: item.photo_uri } : require('../../../assets/icon.png')}
            style={tw`w-16 h-16 rounded-2xl bg-sage-100`}
        />
        <View style={tw`flex-1 ml-4`}>
            <Text style={tw`font-bold text-text-primary text-lg`}>{item.name}</Text>
            <Text style={tw`text-text-secondary text-sm`}>{item.species}</Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-canvas`}>
        <View style={tw`px-6 pt-4 pb-2 flex-row items-center justify-between`}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={tw`bg-surface p-2 rounded-full`}>
                <ArrowLeft size={24} color={tw.color('text-primary')} />
            </TouchableOpacity>
            <Text style={tw`text-xl font-bold text-text-primary`}>{room}</Text>
            <View style={{ width: 40 }} />
        </View>

        <FlatList
            data={roomPlants}
            keyExtractor={item => (item.id || Math.random()).toString()}
            renderItem={renderPlantItem}
            contentContainerStyle={tw`p-6`}
            ListEmptyComponent={<Text style={tw`text-center text-text-secondary mt-10`}>Nenhuma planta neste ambiente.</Text>}
        />

        {roomTasks.length > 0 ? (
            <View style={tw`absolute bottom-8 left-6 right-6`}>
                <TouchableOpacity
                    onPress={handleWaterAll}
                    style={tw`bg-sage-600 p-4 rounded-3xl flex-row items-center justify-center shadow-lg shadow-sage-900/20`}
                >
                    <Droplets size={24} color="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-bold text-lg`}>{t('water_all_title')} ({roomTasks.length})</Text>
                </TouchableOpacity>
            </View>
        ) : (
             <View style={tw`absolute bottom-8 left-6 right-6`}>
                <View style={tw`bg-sage-100 p-4 rounded-3xl flex-row items-center justify-center`}>
                    <Check size={24} color={tw.color('sage-700')} style={tw`mr-2`} />
                    <Text style={tw`text-sage-700 font-bold text-lg`}>{t('all_done_title')}</Text>
                </View>
            </View>
        )}
    </SafeAreaView>
  );
}
