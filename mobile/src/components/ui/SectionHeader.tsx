import React from 'react';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { ClientColors, AppLayout } from '../../constants/sucarTheme';



interface SectionHeaderProps {

  title: string;

  actionLabel?: string;

  onAction?: () => void;

}



const SectionHeader = ({ title, actionLabel, onAction }: SectionHeaderProps) => (

  <View style={styles.row}>

    <Text style={styles.title}>{title}</Text>

    {actionLabel && onAction ? (

      <TouchableOpacity onPress={onAction}>

        <Text style={styles.action}>{actionLabel}</Text>

      </TouchableOpacity>

    ) : null}

  </View>

);



const styles = StyleSheet.create({

  row: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 12,

    paddingHorizontal: AppLayout.screenPadding,

  },

  title: {

    fontSize: AppLayout.sectionTitleSize,

    fontWeight: '700',

    color: ClientColors.text,

  },

  action: { fontSize: 13, fontWeight: '600', color: ClientColors.primary },

});



export default SectionHeader;

