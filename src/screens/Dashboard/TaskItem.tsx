import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Droplets from 'lucide-react-native/dist/cjs/icons/droplets';
import Sprout from 'lucide-react-native/dist/cjs/icons/sprout';
import Scissors from 'lucide-react-native/dist/cjs/icons/scissors';
import Wind from 'lucide-react-native/dist/cjs/icons/wind';
import Box from 'lucide-react-native/dist/cjs/icons/box';
import Check from 'lucide-react-native/dist/cjs/icons/check';
import tw from '../../utils/tw';
import { teardrop } from '../../utils/shape';
import { useTranslation } from 'react-i18next';
import { usePlants } from '../../contexts/PlantContext';

const TASK_STYLES: Record<string, { icon: any; color: string; bg: string }> = {
  water: { icon: Droplets, color: '#D98F5F', bg: '#FBEEE3' },
  fertilize: { icon: Sprout, color: '#7C9B72', bg: '#EAF1E4' },
  prune: { icon: Scissors, color: '#C2705A', bg: '#F6E4DF' },
  mist: { icon: Wind, color: '#6FA5AE', bg: '#E4F1F3' },
  repot: { icon: Box, color: '#B0834A', bg: '#F1E7D6' },
};

const TaskItem = React.memo(({ item }: { item: any }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { completeTask, plants } = usePlants();
  const [loading, setLoading] = useState(false);
  const [rippling, setRippling] = useState(false);
  const ripple = useRef(new Animated.Value(0)).current;

  const config = TASK_STYLES[item.type] || TASK_STYLES.water;
  const Icon = config.icon;
  const label = t(item.type) || t('care');

  const handleComplete = async () => {
    setRippling(true);
    ripple.setValue(0);
    Animated.timing(ripple, { toValue: 1, duration: 450, useNativeDriver: false }).start(() => setRippling(false));

    setLoading(true);
    await completeTask(item.id, item.frequency_days, item.plant_name, item.type);
    setLoading(false);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('PlantDetails', { plant: plants.find(p => p.id === item.plant_id) })}
      style={[tw`w-64 p-4 rounded-3xl mr-3.5 mb-3`, { backgroundColor: config.bg }]}
      accessibilityLabel={`${item.plant_name}, ${label}`}
      accessibilityRole="button"
    >
      <View style={tw`flex-row items-center`}>
        <TouchableOpacity
          onPress={handleComplete}
          disabled={loading}
          style={[tw`items-center justify-center bg-white mr-3.5`, teardrop(44, 14), { position: 'relative', opacity: loading ? 0.7 : 1 }]}
          accessibilityLabel={`Marcar ${label} como feito para ${item.plant_name}`}
          accessibilityRole="button"
          accessibilityHint="Toque duas vezes para concluir a tarefa"
          accessibilityState={{ busy: loading }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={config.color} />
          ) : (
            <Icon size={18} color={config.color} />
          )}
          {rippling && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: 22,
                borderWidth: 2,
                borderColor: config.color,
                opacity: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.7] }) }],
              }}
            />
          )}
        </TouchableOpacity>

        <View style={tw`flex-1`}>
          <Text style={[tw`font-bold text-[15px]`, { color: '#3E2A1B' }]} numberOfLines={1}>{item.plant_name}</Text>
          <Text style={[tw`text-xs mt-0.5`, { color: '#B08A63' }]}>{label}</Text>
        </View>

        <Image
          source={item.photo_uri ? { uri: item.photo_uri } : require('../../../assets/plant-placeholder.png')}
          style={[tw`bg-white`, teardrop(38, 12)]}
        />
      </View>
    </TouchableOpacity>
  );
});

export default TaskItem;
