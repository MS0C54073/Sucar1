import React from 'react';
import { View, Animated, StyleSheet, Easing, Text } from 'react-native';

const CarWashSimulation: React.FC<{ width?: number; height?: number; delay?: number; primaryColor?: string }> = ({
  width = 260,
  height = 120,
  delay = 0,
  primaryColor = '#06d6a0',
}) => {
  const translateX = React.useRef(new Animated.Value(-width)).current;
  const wash = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const sequence = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(wash, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(translateX, {
          toValue: width,
          duration: 900,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, { toValue: -width, duration: 0, useNativeDriver: true }),
        Animated.timing(wash, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );

    sequence.start();
    return () => sequence.stop();
  }, [translateX, wash, delay, width]);

  const bubbleScale = wash.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.6] });
  const bubbleOpacity = wash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] });

  return (
    <View style={[styles.wrapper, { width, height }]}>
      <View style={styles.washBay} />
      <Animated.View style={[styles.car, { backgroundColor: primaryColor, transform: [{ translateX }] }]} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          { left: width / 2 - 10, transform: [{ scale: bubbleScale }], opacity: bubbleOpacity },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          { left: width / 2 + 8, transform: [{ scale: bubbleScale }], opacity: bubbleOpacity },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  washBay: {
    position: 'absolute',
    left: '50%',
    marginLeft: -70,
    width: 140,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e6eef9',
    opacity: 0.12,
  },
  car: {
    width: 80,
    height: 36,
    borderRadius: 8,
    position: 'absolute',
    bottom: 12,
  },
  bubble: {
    position: 'absolute',
    bottom: 36,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    opacity: 0,
  },
});

export default CarWashSimulation;
