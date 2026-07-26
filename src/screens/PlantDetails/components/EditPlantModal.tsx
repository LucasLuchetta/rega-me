import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import tw from '../../../utils/tw';
import { Plant } from '../../../database/PlantDAO';
import * as ImagePicker from 'expo-image-picker';
import Camera from 'lucide-react-native/dist/cjs/icons/camera';
import { persistImage } from '../../../utils/imageStorage';

interface EditPlantModalProps {
  visible: boolean;
  onClose: () => void;
  plant: Plant;
  onSave: (updatedPlant: Plant, frequency?: number) => void;
}

export default function EditPlantModal({ visible, onClose, plant, onSave }: EditPlantModalProps) {
  const [name, setName] = useState(plant.name);
  const [room, setRoom] = useState(plant.room);
  const [species, setSpecies] = useState(plant.species || '');
  const [frequency, setFrequency] = useState('');
  const [photoUri, setPhotoUri] = useState(plant.photo_uri || '');

  const handleSave = () => {
    const freq = parseInt(frequency);
    onSave({ ...plant, name, room, species, photo_uri: photoUri }, isNaN(freq) ? undefined : freq);
    onClose();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotoUri(persistImage(result.assets[0].uri) ?? '');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tw`flex-1 justify-end bg-black/50`}>
        <View style={tw`bg-white rounded-t-3xl p-6`}>
            <View style={tw`flex-row justify-between mb-6`}>
                <Text style={tw`text-xl font-bold`}>Editar Planta</Text>
                <TouchableOpacity onPress={onClose}><Text style={tw`text-blue-600`}> Cancelar </Text></TouchableOpacity>
            </View>

            <View style={tw`items-center mb-6`}>
              <TouchableOpacity onPress={pickImage} style={tw`relative`}>
                <Image
                  source={photoUri ? { uri: photoUri } : require('../../../../assets/plant-placeholder.png')}
                  style={tw`w-24 h-24 rounded-full bg-gray-200`}
                />
                <View style={tw`absolute bottom-0 right-0 bg-sage-600 p-2 rounded-full border-2 border-white`}>
                  <Camera size={16} color="white" />
                </View>
              </TouchableOpacity>
              <Text style={tw`text-sage-500 text-xs mt-2`}>Toque para alterar a foto</Text>
            </View>

            <Text style={tw`text-gray-500 mb-2`}>Nome</Text>
            <TextInput value={name} onChangeText={setName} style={tw`bg-gray-50 p-4 rounded-xl mb-4`} />

            <Text style={tw`text-gray-500 mb-2`}>Espécie</Text>
            <TextInput value={species} onChangeText={setSpecies} style={tw`bg-gray-50 p-4 rounded-xl mb-4`} />

            <Text style={tw`text-gray-500 mb-2`}>Ambiente</Text>
            <TextInput value={room} onChangeText={setRoom} style={tw`bg-gray-50 p-4 rounded-xl mb-4`} />

            <Text style={tw`text-gray-500 mb-2`}>Nova Frequência de Rega (dias)</Text>
            <TextInput
                value={frequency}
                onChangeText={setFrequency}
                keyboardType="numeric"
                placeholder="Deixe em branco para manter"
                style={tw`bg-gray-50 p-4 rounded-xl mb-4`}
            />

            <TouchableOpacity onPress={handleSave} style={tw`bg-sage-600 p-4 rounded-xl items-center`}>
                <Text style={tw`text-white font-bold`}>Salvar Alterações</Text>
            </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
