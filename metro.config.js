let config = {};

try {
  const { getDefaultConfig } = require('expo/metro-config');
  config = getDefaultConfig(__dirname);
} catch (e) {
  console.log('Erro ao carregar configuração do Metro (verifique node_modules):', e);
  // Define um fallback vazio para não travar o processo CLI imediatamente
}

// Mantém o suporte a WASM se você estiver usando
if (config && config.resolver && config.resolver.assetExts) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;