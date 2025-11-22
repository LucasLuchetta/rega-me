import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Importa o JSON diretamente
import database from '../constants/data/plants_pt.json';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState(database);

  // Função de pesquisa simples
  const filtrar = (texto: string) => {
    setQuery(texto);
    if (!texto.trim()) {
      setResultados(database);
      return;
    }
    const termo = texto.toLowerCase();
    const filtrados = database.filter(planta => 
      planta.latin.toLowerCase().includes(termo) || 
      (planta.common && planta.common.some((c: string) => c.toLowerCase().includes(termo)))
    );
    setResultados(filtrados);
  };

  const selecionar = (planta: any) => {
    // Volta para a tela anterior enviando a planta selecionada como parâmetro
    // Precisamos serializar (JSON.stringify) porque params de URL devem ser strings
    router.dismiss(); // Fecha a pesquisa
    router.replace({
      pathname: '/add',
      params: { plantaSelecionada: JSON.stringify(planta) }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TextInput 
          style={styles.searchBar} 
          placeholder="Buscar planta (ex: Jiboia)" 
          value={query}
          onChangeText={filtrar}
          autoFocus
        />
      </View>

      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => selecionar(item)}>
            <View>
              {/* Nome Comum (usa o primeiro da lista ou 'Sem nome') */}
              <Text style={styles.commonName}>{item.common ? item.common[0] : 'Nome desconhecido'}</Text>
              {/* Nome Científico */}
              <Text style={styles.latinName}>{item.latin}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn: { marginRight: 12 },
  searchBar: { flex: 1, backgroundColor: '#F2F2F7', padding: 10, borderRadius: 8, fontSize: 16 },
  list: { padding: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  commonName: { fontSize: 16, fontWeight: '600', color: '#333' },
  latinName: { fontSize: 14, fontStyle: 'italic', color: '#888', marginTop: 2 },
});