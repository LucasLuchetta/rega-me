import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Droplets, Sprout, Scissors, Wind, Box, Check } from 'lucide-react-native';
import tw from '../../utils/tw';
import { useTranslation } from 'react-i18next';
import { usePlants } from '../../contexts/PlantContext';

export default function TaskItem({ item }: { item: any }) {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const { completeTask, plants } = usePlants();
    const [loading, setLoading] = useState(false);

    let Icon = Droplets;
    let label = t('care');
    let colorClass = "bg-sage-500";
    let iconColor = tw.color('sage-600');
    let bgIcon = "bg-sage-100";

    switch (item.type) {
       case 'fertilize':
           Icon = Sprout;
           label = t('fertilize');
           colorClass = "bg-clay-400";
           iconColor = tw.color('clay-600');
           bgIcon = "bg-clay-100";
           break;
       case 'prune':
           Icon = Scissors;
           label = t('prune');
           colorClass = "bg-red-400";
           iconColor = tw.color('red-600');
           bgIcon = "bg-red-100";
           break;
       case 'mist':
           Icon = Wind;
           label = t('mist');
           colorClass = "bg-sky-400";
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
           colorClass = "bg-sky-500";
           iconColor = tw.color('sky-600');
           bgIcon = "bg-sky-100";
    }

    const handleComplete = async () => {
        setLoading(true);
        await completeTask(item.id, item.frequency_days, item.plant_name, item.type);
        setLoading(false);
    };

    return (
       <TouchableOpacity
           activeOpacity={0.9}
           onPress={() => navigation.navigate('PlantDetails', { plant: plants.find(p => p.id === item.plant_id) })}
           style={tw`bg-white w-72 p-4 rounded-3xl mr-4 shadow-sm border border-sage-100 mb-4`}
           accessibilityLabel={`${item.plant_name}, ${label}`}
           accessibilityRole="button"
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
                           onPress={handleComplete}
                           disabled={loading}
                           style={tw`flex-1 ${colorClass} py-2.5 rounded-xl items-center flex-row justify-center shadow-sm opacity-${loading ? '70' : '100'}`}
                           accessibilityLabel={`Marcar ${label} como feito para ${item.plant_name}`}
                           accessibilityRole="button"
                           accessibilityHint="Toque duas vezes para concluir a tarefa"
                           accessibilityState={{ busy: loading }}
                        >
                           {loading ? (
                               <ActivityIndicator size="small" color="white" />
                           ) : (
                               <>
                                   <Check size={14} color="white" style={tw`mr-1.5`} />
                                   <Text style={tw`text-white font-bold text-xs`}>{label}</Text>
                               </>
                           )}
                        </TouchableOpacity>
                   </View>
               </View>
           </View>
       </TouchableOpacity>
    );
}
