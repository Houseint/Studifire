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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useUserId } from '../hooks/useUserId';
import { logoutUser, getSessionUser, atualizarAvatar, getUserById } from '../services/authDb';
import { 
  updateWeeklyGoal,
  getUserBadges,
  checkAndAwardBadges,
  getProfileStats,
  getWeeklyGoalProgress,
} from '../services/subjectsDb';
import * as ImagePicker from 'expo-image-picker';
import { ProfileScreenStyles as s } from '../styles/ProfileScreenStyles.js';

const BADGE_COLORS = {
  '#8E97C4': 'rgba(142, 151, 196, 0.2)',
  '#6F52FF': 'rgba(111, 82, 255, 0.2)',
  '#4A90E2': 'rgba(74, 144, 226, 0.2)',
  '#FFAA00': 'rgba(255, 170, 0, 0.2)',
  '#FF4444': 'rgba(255, 68, 68, 0.2)',
  '#4CAF50': 'rgba(76, 175, 80, 0.2)',
  '#FFD700': 'rgba(255, 215, 0, 0.2)',
};

export default function ProfileScreen({ navigation }) {
  const userId = useUserId();
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [stats, setStats] = useState({
    totalHoras: 0,
    totalMinutos: 0,
    totalTopicos: 0,
    topicosConcluidos: 0,
    totalMaterias: 0,
    totalSessoes: 0,
    materiaTop: null,
    melhorDia: null,
    mediaSessao: 0,
    streak: 0,
    minutosSemana: 0,
  });
  const [weeklyGoal, setWeeklyGoal] = useState({ goalMinutes: 300, currentMinutes: 0, percent: 0 });
  const [badges, setBadges] = useState([]);
  const [newBadges, setNewBadges] = useState([]);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('');

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
      let mounted = true;

      (async () => {
        try {
          // Verifica e premia badges
          const newlyUnlocked = await checkAndAwardBadges(userId);
          if (mounted && newlyUnlocked.length > 0) {
            setNewBadges(newlyUnlocked);
          }

          // Carrega dados em paralelo
          const [profileStats, goalProgress, userBadges] = await Promise.all([
            getProfileStats(userId),
            getWeeklyGoalProgress(userId),
            getUserBadges(userId),
          ]);

          if (mounted) {
            setStats(profileStats);
            setWeeklyGoal(goalProgress);
            setBadges(userBadges);
          }
        } catch (e) {
          console.error('Erro ao carregar dados do perfil:', e);
        }
      })();

      return () => { mounted = false; };
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

    const base64 = result.base64 || result.assets?.[0]?.base64;

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

  const openGoalModal = () => {
    setGoalInput(String(weeklyGoal.goalHours).replace('.', ','));
    setGoalModalVisible(true);
  };

  const saveGoal = async () => {
    // Aceita vírgula ou ponto como separador decimal
    const normalized = goalInput.replace(',', '.');
    const hours = parseFloat(normalized);
    if (!isNaN(hours) && hours > 0 && hours <= 100) {
      const minutes = Math.round(hours * 60);
      await updateWeeklyGoal(userId, minutes);
      const progress = await getWeeklyGoalProgress(userId);
      setWeeklyGoal(progress);
      setGoalModalVisible(false);
    } else {
      Alert.alert('Valor inválido', 'Digite um número entre 0.5 e 100 horas.');
    }
  };

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  const displayName = user?.email
    ? user.email.split('@')[0]
    : 'Carregando...';

  const formatHours = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const formatMinutes = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  if (!userId) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
        <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a1520']} style={s.gradientFill} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#7F8AB7', fontSize: 16 }}>Carregando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a1520']} style={s.gradientFill} />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={s.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Meu Perfil</Text>
          <TouchableOpacity
            style={s.profileButton}
            activeOpacity={0.7}
            onPress={() => {}}
          >
            <Text style={s.profileButtonText}>◌</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View style={s.profileHeader}>
          <View style={s.avatarCircle}>
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                style={s.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={s.avatarInitials}>{initials}</Text>
            )}
            <TouchableOpacity
              style={s.editAvatarButton}
              activeOpacity={0.8}
              onPress={handleAvatarChange}
            >
              <Text style={s.editAvatarText}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.userName}>{displayName}</Text>
          <Text style={s.userEmail}>{user?.email || '...'}</Text>
          <View style={s.badgePill}>
            <Text style={s.badgeText}>Estudante Pro</Text>
          </View>
        </View>

        {/* Stats Grid - 4 cards */}
        <View style={s.statsGrid}>
          <View style={[s.statCard, { borderColor: 'rgba(138, 104, 255, 0.4)' }]}>
            <Text style={s.statIcon}>⏱</Text>
            <Text style={s.statValue}>{formatHours(stats.totalMinutos)}</Text>
            <Text style={s.statLabel}>Horas de Estudo</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>✓</Text>
            <Text style={s.statValue}>{stats.topicosConcluidos}/{stats.totalTopicos}</Text>
            <Text style={s.statLabel}>Tópicos Concluídos</Text>
          </View>
          <View style={[s.statCard, { borderColor: 'rgba(255, 170, 0, 0.4)' }]}>
            <Text style={s.statIcon}>🔥</Text>
            <Text style={s.statValue}>{stats.streak}</Text>
            <Text style={s.statLabel}>Dias Seguidos</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>📚</Text>
            <Text style={s.statValue}>{stats.totalMaterias}</Text>
            <Text style={s.statLabel}>Matérias</Text>
          </View>
        </View>

        {/* Weekly Goal */}
        <View style={s.sectionContainer}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🎯 Meta Semanal</Text>
            <TouchableOpacity style={s.goalEditBtn} activeOpacity={0.7} onPress={openGoalModal}>
              <Text style={s.goalEditText}>Editar</Text>
            </TouchableOpacity>
          </View>
          <View style={s.goalCard}>
            <View style={s.goalProgressRow}>
              <Text style={s.goalCurrent}>{formatMinutes(weeklyGoal.currentMinutes)}</Text>
              <Text style={s.goalTarget}>/ {formatMinutes(weeklyGoal.goalMinutes)}</Text>
              <Text style={[s.goalPercent, { color: weeklyGoal.percent >= 100 ? '#4CAF50' : '#8A68FF' }]}>
                {weeklyGoal.percent}%
              </Text>
            </View>
            <View style={s.progressBarContainer}>
              <View
                style={[
                  s.progressBar,
                  { width: `${weeklyGoal.percent}%` },
                ]}
              />
            </View>
            <Text style={s.goalSubtext}>
              {weeklyGoal.percent >= 100 ? '🎉 Meta atingida! Continue assim!' : 'Continue estudando para atingir sua meta'}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={s.sectionContainer}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🏆 Conquistas</Text>
            <Text style={s.sectionSubtitle}>{badges.length} de 8 desbloqueadas</Text>
          </View>
          {badges.length === 0 ? (
            <View style={s.emptyBadges}>
              <Text style={s.emptyIcon}>🏅</Text>
              <Text style={s.emptyTitle}>Nenhuma conquista ainda</Text>
              <Text style={s.emptySubtitle}>
                Complete sessões, mantenha streaks e conclua tópicos para desbloquear badges!
              </Text>
            </View>
          ) : (
            <View style={s.badgesScroll} horizontal showsHorizontalScrollIndicator={false}>
              {badges.map((badge) => (
                <TouchableOpacity
                  key={badge.badge_id}
                  style={[
                    s.badgeCard,
                    { backgroundColor: BADGE_COLORS[badge.color] || 'rgba(111, 82, 255, 0.15)', borderColor: badge.color },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={s.badgeIcon}>{badge.icon}</Text>
                  <View style={s.badgeInfo}>
                    <Text style={[s.badgeName, { color: badge.color }]}>{badge.name}</Text>
                    <Text style={s.badgeDesc}>{badge.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {badges.length < 8 && (
                <View style={[s.badgeCard, s.badgeCardLocked]}>
                  <Text style={s.badgeIconLocked}>🔒</Text>
                  <View style={s.badgeInfo}>
                    <Text style={s.badgeNameLocked}>Bloqueada</Text>
                    <Text style={s.badgeDescLocked}>Continue estudando para desbloquear</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Quick Insights */}
        <View style={s.sectionContainer}>
          <Text style={s.sectionTitle}>📈 Resumo Rápido</Text>
          <View style={s.insightsGrid}>
            {stats.materiaTop && (
              <View style={s.insightCard}>
                <Text style={s.insightIcon}>📚</Text>
                <View style={s.insightContent}>
                  <Text style={s.insightLabel}>Matéria mais estudada</Text>
                  <Text style={s.insightValue}>{stats.materiaTop.nome}</Text>
                  <Text style={s.insightSub}>{formatMinutes(stats.materiaTop.minutos)}</Text>
                </View>
              </View>
            )}
            {stats.melhorDia && (
              <View style={s.insightCard}>
                <Text style={s.insightIcon}>📅</Text>
                <View style={s.insightContent}>
                  <Text style={s.insightLabel}>Melhor dia</Text>
                  <Text style={s.insightValue}>{stats.melhorDia}</Text>
                  <Text style={s.insightSub}>Mais tempo de estudo</Text>
                </View>
              </View>
            )}
            {stats.totalSessoes > 0 && (
              <View style={s.insightCard}>
                <Text style={s.insightIcon}>⚡</Text>
                <View style={s.insightContent}>
                  <Text style={s.insightLabel}>Média por sessão</Text>
                  <Text style={s.insightValue}>{formatMinutes(stats.mediaSessao)}</Text>
                  <Text style={s.insightSub}>{stats.totalSessoes} sessões no total</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.actionsContainer}>
          <TouchableOpacity
            style={s.actionButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Historic')}
          >
            <Text style={s.actionIcon}>📋</Text>
            <Text style={s.actionText}>Histórico</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionButton, s.actionButtonSecondary]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Progress')}
          >
            <Text style={s.actionIcon}>📈</Text>
            <Text style={s.actionText}>Progresso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionButton, s.actionButtonDanger]}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <Text style={s.actionIcon}>🚪</Text>
            <Text style={s.actionText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* New Badge Toast */}
      {newBadges.length > 0 && (
        <View style={s.toastContainer}>
          {newBadges.map((badge, i) => (
            <View key={i} style={[s.toast, { borderColor: badge.color }]}>
              <Text style={s.toastIcon}>{badge.icon}</Text>
              <View style={s.toastContent}>
                <Text style={s.toastTitle}>Nova Conquista!</Text>
                <Text style={[s.toastName, { color: badge.color }]}>{badge.name}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Modal Meta Semanal */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <TouchableOpacity
            style={s.modalBackdrop}
            activeOpacity={1}
            onPress={() => setGoalModalVisible(false)}
          />
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>🎯 Meta Semanal</Text>
            <Text style={s.modalSubtitle}>Defina sua meta de horas de estudo por semana</Text>

            <View style={s.modalInputWrapper}>
              <TextInput
                style={s.modalInput}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="decimal-pad"
                placeholder="Ex: 5"
                placeholderTextColor="#5E6994"
                selectionColor="#8A68FF"
                autoFocus
              />
              <Text style={s.modalInputSuffix}>horas</Text>
            </View>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonCancel]}
                activeOpacity={0.7}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={s.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonConfirm]}
                activeOpacity={0.7}
                onPress={saveGoal}
              >
                <Text style={s.modalButtonConfirmText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}