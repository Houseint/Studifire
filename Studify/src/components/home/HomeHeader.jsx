import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { HomeHeaderStyles as styles } from '../../styles/components/home/HomeHeaderStyles';

const HomeHeader = ({ user, userAvatar, onProfilePress, onHelpPress }) => (
  <View style={styles.topo}>
    <TouchableOpacity style={styles.perfilBtn} activeOpacity={0.8} onPress={onProfilePress}>
      <View style={styles.avatarCircle}>
        {userAvatar ? (
          <Image source={{ uri: userAvatar }} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <Text style={styles.avatarText}>{user?.email?.charAt(0)?.toUpperCase() || 'US'}</Text>
        )}
      </View>
      <View>
        <Text style={styles.saudacao}>Bom dia ☀</Text>
        <Text style={styles.perfilNome}>{user?.email?.split('@')[0] || 'Carregando...'}</Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={styles.helpBtn} activeOpacity={0.8} onPress={onHelpPress}>
      <Text style={styles.helpIcon}>❓</Text>
    </TouchableOpacity>
  </View>
);

export default HomeHeader;