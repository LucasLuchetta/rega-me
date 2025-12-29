import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export interface WeatherData {
  temp: number;
  humidity: number;
  conditionCode: number;
  isDay: boolean;
  cityName?: string;
}

export const WeatherService = {
  // 1. Busca coordenadas pelo nome da cidade (Geocoding API)
  searchCity: async (query: string) => {
    try {
      // Busca limitada a 1 resultado, em português
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=pt&format=json`
      );
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) return null;

      return {
        name: data.results[0].name,
        admin1: data.results[0].admin1, // Estado/Região
        lat: data.results[0].latitude,
        lon: data.results[0].longitude
      };
    } catch (error) {
      console.warn("Erro ao buscar cidade:", error);
      return null;
    }
  },

  // 2. Busca o clima pelas coordenadas (Forecast API)
  getWeather: async (lat: number, lon: number): Promise<WeatherData | null> => {
    try {
      // Check cache
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
          const { data, timestamp, coords } = JSON.parse(cached);
          const isClose = Math.abs(coords.lat - lat) < 0.05 && Math.abs(coords.lon - lon) < 0.05;
          const isRecent = (Date.now() - timestamp) < CACHE_DURATION;

          if (isClose && isRecent) {
              console.log("Using cached weather data");
              return data;
          }
      }

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code&timezone=auto`
      );
      const data = await response.json();

      if (!data.current) return null;

      const weatherData = {
        temp: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        conditionCode: data.current.weather_code,
        isDay: data.current.is_day === 1
      };

      // Save to cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: weatherData,
          timestamp: Date.now(),
          coords: { lat, lon }
      }));

      return weatherData;
    } catch (error) {
      console.warn("Erro ao buscar clima:", error);
      return null;
    }
  },

  // 3. Helper para escolher ícone e cor baseado no código WMO
  getWeatherIconConfig: (code: number, isDay: boolean) => {
    // Códigos WMO: https://open-meteo.com/en/docs
    if (code === 0) return { icon: Sun, color: '#f59e0b', label: 'Céu limpo' }; // Clear
    if (code >= 1 && code <= 3) return { icon: CloudSun, color: '#fbbf24', label: 'Nublado' }; // Partly cloudy
    if (code >= 45 && code <= 48) return { icon: Cloud, color: '#9ca3af', label: 'Nevoeiro' }; // Fog
    if (code >= 51 && code <= 67) return { icon: CloudDrizzle, color: '#60a5fa', label: 'Chuva fraca' }; // Drizzle/Rain
    if (code >= 80 && code <= 82) return { icon: CloudRain, color: '#3b82f6', label: 'Chuva forte' }; // Showers
    if (code >= 95) return { icon: CloudLightning, color: '#6366f1', label: 'Tempestade' }; // Thunderstorm
    
    return { icon: Cloud, color: '#9ca3af', label: 'Nublado' };
  }
};