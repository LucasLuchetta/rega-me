import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView } from 'react-native';
import tw from '../../../utils/tw';
import { Plant } from '../../../database/PlantDAO';

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

  const handleSave = () => {
    const freq = parseInt(frequency);
    onSave({ ...plant, name, room, species }, isNaN(freq) ? undefined : freq);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tw`flex-1 justify-end bg-black/50`}>
        <View style={tw`bg-white rounded-t-3xl p-6`}>
            <View style={tw`flex-row justify-between mb-6`}>
                <Text style={tw`text-xl font-bold`}>Editar Planta</Text>
                <TouchableOpacity onPress={onClose}><Text style={tw`text-blue-600`}>Cancelar</Text></TouchableOpacity>
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
