import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import tw from '../utils/tw';

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  percentage: number; // 0 a 100
  color?: string;
}

export default function CircularProgress({ 
  size = 40, 
  strokeWidth = 3, 
  percentage, 
  color = '#3b82f6' 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Círculo de Fundo (Cinza claro) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Círculo de Progresso (Colorido) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={tw`absolute inset-0 items-center justify-center`}>
        <Text style={[tw`font-bold text-gray-700`, { fontSize: size * 0.25 }]}>
          {Math.round(progress)}%
        </Text>
      </View>
    </View>
  );
}