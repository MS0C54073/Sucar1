import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapCommand } from '../CarWashMapView';
import { ClientColors } from '../../constants/sucarTheme';

interface MapControlButtonsProps {
  onCommand: (cmd: MapCommand) => void;
}

const MapControlButtons = ({ onCommand }: MapControlButtonsProps) => (
  <View style={styles.stack}>
    <TouchableOpacity style={styles.btn} onPress={() => onCommand('zoomIn')} activeOpacity={0.85}>
      <Ionicons name="add" size={20} color={ClientColors.text} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.btn} onPress={() => onCommand('zoomOut')} activeOpacity={0.85}>
      <Ionicons name="remove" size={20} color={ClientColors.text} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.btn} onPress={() => onCommand('resetNorth')} activeOpacity={0.85}>
      <Ionicons name="compass-outline" size={18} color={ClientColors.text} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.btn} onPress={() => onCommand('fitBounds')} activeOpacity={0.85}>
      <Ionicons name="scan-outline" size={18} color={ClientColors.text} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.btn} onPress={() => onCommand('flyToUser')} activeOpacity={0.85}>
      <Ionicons name="locate-outline" size={18} color={ClientColors.primary} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  stack: {
    gap: 8,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default MapControlButtons;
