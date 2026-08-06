import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useUserId } from '../hooks/useUserId';
import { logoutUser, getSessionUser, atualizarAvatar, getUserById } from '../services/authDb';
import { carregarMaterias, carregarHistorico } from '../services/subjectsDb';
import * as ImagePicker from 'expo-image-picker';
import { ProfileScreenStyles as styles } from '../styles/ProfileScreenStyles.js';

function calcularSequencia(sessoes) {
  const datas = [...new Set(
    sessoes.map(s => new Date(s.started_at).toDateString())
  )].map(d => new Date(d)).sort((a, b) => b - a);

  let sequencia = 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (let i = 0; i < datas.length; i++) {
    const esperado = new Date(hoje);
    esperado.setDate(esperado.getDate() - i);
    if (datas[i].toDateString() === esperado.toDateString()) {
      sequencia++;
    } else {
      break;
    }
  }
  return sequencia;
}

function contarRevisoesSemana(sessoes) {
  const agora = new Date();
  const inicioSemana = new Date(agora);
  inicioSemana.setDate(agora.getDate() - agora.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  return sessoes.filter(s => new Date(s.started_at) >= inicioSemana).length;
}

export default function ProfileScreen({ navigation }) {
  const userId = useUserId();
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [totalMaterias, setTotalMaterias] = useState(0);
  const [totalAcessos, setTotalAcessos] = useState(0);
  const [fixadosCount, setFixadosCount] = useState(0);
  const [revisoesSemana, setRevisoesSemana] = useState(0);
  const [diasConsecutivos, setDiasConsecutivos] = useState(0);

  useEffect(() => {
    getSessionUser().then(setUser);
    if (userId) {
      (async () => {
        try {
          const userData = await getUserById(userId);
          setUserAvatar(userData?.avatar ? `data:image/jpeg;base64,${userData.avatar}` : null);
        } catch (e) {
          console.error('Erro ao carregar avatar do usuário:', e);
        }
      })();
    }
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      if (!userId) return;
      (async () => {
        try {
          const materias = await carregarMaterias(userId);
          const sessoes = await carregarHistorico(userId);

          setTotalMaterias(materias.length);
          setTotalAcessos(sessoes.length);
          setFixadosCount(materias.filter(m => m.fixada).length);
          setRevisoesSemana(contarRevisoesSemana(sessoes));
          setDiasConsecutivos(calcularSequencia(sessoes));
        } catch (e) {
          console.error('Erro ao carregar dados do perfil:', e);
        }
      })();
      return () => {};
    }, [userId])
  );

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const handleAvatarChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    const base64 =
      result.base64 ||
      result.assets?.[0]?.base64;

    if (!result.cancelled && base64) {
      try {
        await atualizarAvatar(userId, base64);
        setUserAvatar(`data:image/jpeg;base64,${base64}`);
        Alert.alert('Sucesso', 'Avatar atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar avatar:', error);
        Alert.alert('Erro', 'Não foi possível atualizar o avatar.');
      }
    } else {
      Alert.alert('Erro', 'Não foi possível obter a imagem. Tente novamente.');
    }
  };

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  const displayName = user?.email
    ? user.email.split('@')[0]
    : 'Carregando...';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      <LinearGradient
        colors={['#0a0f1e', '#0d1a2e', '#0a1520']}
        style={styles.gradientFill}
      />

      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu perfil</Text>
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.7}
          onPress={() => {}}
        >
          <Text style={styles.editText}>✏</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              activeOpacity={0.8}
              onPress={handleAvatarChange}
            >
              <Text style={styles.editAvatarText}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email || '...'}</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>Estudante Pro</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalMaterias}</Text>
            <Text style={styles.statLabel}>Matérias</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalAcessos}</Text>
            <Text style={styles.statLabel}>Acessos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fixadosCount}</Text>
            <Text style={styles.statLabel}>Fixados</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Progresso Semanal</Text>
        <View style={styles.progressoRow}>
          <View style={[styles.progressoCard, styles.progressoCardAccent]}>
            <Text style={styles.progressoCardLabel}>Esta semana</Text>
            <Text style={styles.progressoCardValue}>{revisoesSemana}</Text>
            <Text style={styles.progressoCardSub}>revisões feitas</Text>
          </View>
          <View style={[styles.progressoCard, styles.progressoCardAccent2]}>
            <Text style={styles.progressoCardLabel}>Sequência</Text>
            <View style={styles.progressoCardSubRow}>
              <Text style={styles.progressoCardValue}>{diasConsecutivos}</Text>
              <Text style={styles.flameEmoji}>🔥</Text>
            </View>
            <Text style={styles.progressoCardSub}>dias seguidos</Text>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.historicoButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Historic')}
          >
            <Text style={styles.buttonEmoji}>📋</Text>
            <Text style={styles.historicoButtonText}>Histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sairButton}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <Text style={styles.buttonEmoji}>🚪</Text>
            <Text style={styles.sairButtonText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
