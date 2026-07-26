import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing } from 'react-native';
import tw from '../utils/tw';
import { teardrop } from '../utils/shape';

/** Pontinho que pulsa (opacidade) em loop, com atraso para escalonar os 3. */
function PulseDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={[
        tw`w-1.5 h-1.5 rounded-full bg-sage-600`,
        { opacity },
      ]}
    />
  );
}

/** Gotinha que escorre pelo badge e some, em loop. */
function DripDot() {
  const translateY = useRef(new Animated.Value(-6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateY, { toValue: -6, duration: 0, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 18, duration: 1600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 480, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 640, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 480, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [translateY, opacity]);

  return (
    <Animated.View
      style={[
        tw`absolute w-1.5 h-1.5 rounded-full bg-sage-50`,
        { top: 20, right: 34, opacity, transform: [{ translateY }] },
      ]}
    />
  );
}

/** Tela de carregamento exibida enquanto fontes e banco de dados preparam o app. */
export default function AnimatedSplash() {
  const scale = useRef(new Animated.Value(0.9)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(badgeOpacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scale, badgeOpacity]);

  return (
    <View style={tw`flex-1 bg-sage-50 items-center justify-center overflow-hidden`}>
      <View style={[tw`absolute rounded-full`, { width: 280, height: 280, top: -90, right: -90, backgroundColor: '#F5F3EC' }]} />
      <View style={[tw`absolute rounded-full`, { width: 180, height: 180, bottom: 60, left: -70, backgroundColor: '#F8F7F3' }]} />

      <Animated.View style={{ transform: [{ scale }], opacity: badgeOpacity }}>
        <View style={[teardrop(180), tw`bg-sage-600 items-center justify-center overflow-hidden`]}>
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={{ width: 180, height: 180 }}
            resizeMode="cover"
          />
        </View>
        <DripDot />
      </Animated.View>

      <Text style={tw`font-light text-[30px] text-sage-900 mt-8 tracking-tight`}>rega-me</Text>
      <Text style={tw`font-body text-[13px] text-sage-400 mt-2 tracking-wide`}>cuidando do seu jardim</Text>

      <View style={tw`absolute bottom-16 flex-row gap-2`}>
        <PulseDot delay={0} />
        <PulseDot delay={200} />
        <PulseDot delay={400} />
      </View>
    </View>
  );
}
