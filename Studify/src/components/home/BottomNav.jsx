import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { getBottomNavStyles } from '../../styles/components/home/BottomNavStyles';
import { useTheme } from '../../shared/theme/ThemeContext';
import { HomeIcon, BotIcon, TrendingUpIcon, UserIcon } from '../common/FeatherIcons';

const BottomNav = ({ navigation, onAddPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getBottomNavStyles(colors), [colors]);
  return (
  <View style={styles.bottomBar}>
    <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Home')}>
      <View style={styles.navIcon}><HomeIcon size={17} color={colors.accent} /></View>
      <Text style={[styles.navLabel, styles.navLabelActive]} numberOfLines={1}>Início</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Chat')}>
      <View style={styles.navIcon}><BotIcon size={17} color={colors.textMuted} /></View>
      <Text style={styles.navLabel} numberOfLines={1}>Chatbot IA</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.navItem, styles.navItemPlus]} activeOpacity={0.85} onPress={onAddPress}>
      <Text style={styles.navPlusText}>+</Text>
      <Text style={styles.navLabel} numberOfLines={1}>Adicionar</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Progress')}>
      <View style={styles.navIcon}><TrendingUpIcon size={17} color={colors.textMuted} /></View>
      <Text style={styles.navLabel} numberOfLines={1}>Progresso</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Profile')}>
      <View style={styles.navIcon}><UserIcon size={17} color={colors.textMuted} /></View>
      <Text style={styles.navLabel} numberOfLines={1}>Perfil</Text>
    </TouchableOpacity>
  </View>
  );
};

export default BottomNav;
