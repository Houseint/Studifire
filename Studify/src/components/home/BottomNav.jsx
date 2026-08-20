import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { BottomNavStyles as styles } from '../../styles/components/home/BottomNavStyles';

const BottomNav = ({ navigation, onAddPress }) => (
  <View style={styles.bottomBar}>
    <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Home')}>
      <Text style={styles.navIcon}>⌂</Text>
      <Text style={[styles.navLabel, styles.navLabelActive]}>Início</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Chat')}>
      <Text style={styles.navIcon}>🤖</Text>
      <Text style={styles.navLabel}>IA</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.navItem, styles.navItemPlus]} activeOpacity={0.85} onPress={onAddPress}>
      <Text style={styles.navPlusText}>+</Text>
      <Text style={styles.navLabel}>Adicionar</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Progress')}>
      <Text style={styles.navIcon}>📈</Text>
      <Text style={styles.navLabel}>Progresso</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Profile')}>
      <Text style={styles.navIcon}>◌</Text>
      <Text style={styles.navLabel}>Perfil</Text>
    </TouchableOpacity>
  </View>
);

export default BottomNav;