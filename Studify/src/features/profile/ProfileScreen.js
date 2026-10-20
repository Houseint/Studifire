import React, { useEffect, useMemo, useState } from 'react';
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useUserId } from '../auth/useUserId';
import { logoutUser, getSessionUser, atualizarAvatar, getUserById } from '../auth/authDb';
import {
  updateWeeklyGoal,
  getUserSettings,
  updateReminderSettings,
  updateThemeMode,
  getUserBadges,
  checkAndAwardBadges,
  getProfileStats,
  getWeeklyGoalProgress,
  getBadgeDefinitions,
  carregarHistorico,
} from '../subjects/subjectsDb';
import {
  requestReminderPermission,
  enableDailyReminder,
  disableDailyReminder,
} from '../reminders/reminderService';
import * as ImagePicker from 'expo-image-picker';
import { getProfileStyles } from './ProfileScreenStyles.js';
import { useTheme } from '../../shared/theme/ThemeContext';
import {
  SunIcon,
  MoonIcon,
  CameraIcon,
  ClockIcon,
  CheckIcon,
  FlameIcon,
  BookOpenIcon,
  TargetIcon,
  BellIcon,
  TrophyIcon,
  TrendingUpIcon,
  CalendarIcon,
  ZapIcon,
  XIcon,
  LockIcon,
} from '../../components/common/FeatherIcons';

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
  const [allBadges, setAllBadges] = useState([]);
  const [newBadges, setNewBadges] = useState([]);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [reminder, setReminder] = useState({ enabled: false, hour: 20, minute: 0 });
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderDraft, setReminderDraft] = useState({ hour: 20, minute: 0 });
  // Dias (0=Dom ... 6=Sáb) com sessão na semana atual — check-in do Estudante Pro.
  const [activeDays, setActiveDays] = useState([]);
  // Matérias estudadas em cada dia da semana (mesma janela) — deixa o card útil.
  const [weekLog, setWeekLog] = useState({});
  const { mode, colors, setMode } = useTheme();
  const s = useMemo(() => getProfileStyles(colors), [colors]);

  // Catálogo de conquistas: todas as 8 (mesmo bloqueadas) para o usuário ver
  // o que falta. Se o catálogo não carregar, cai para as já desbloqueadas.
  const badgeCatalog = allBadges.length
    ? allBadges.map((def) => ({
        ...def,
        unlocked: badges.some((b) => b.badge_id === def.id),
      }))
    : badges.map((b) => ({
        id: b.badge_id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        color: b.color,
        unlocked: true,
      }));

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
          const [profileStats, goalProgress, userBadges, settings, badgeDefs] = await Promise.all([
            getProfileStats(userId),
            getWeeklyGoalProgress(userId),
            getUserBadges(userId),
            getUserSettings(userId),
            getBadgeDefinitions().catch(() => []),
          ]);

          // Check-in semanal: dias com sessão nesta semana (seg → dom).
          let weekDays = [];
          let weekLogData = {};
          try {
            if (typeof carregarHistorico === 'function') {
              const hist = await carregarHistorico(userId);
              const start = new Date();
              start.setHours(0, 0, 0, 0);
              start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
              const days = new Set(
                (hist || [])
                  .map((s) => new Date(s.started_at))
                  .filter((d) => !Number.isNaN(d.getTime()) && d >= start)
                  .map((d) => d.getDay())
              );
              weekDays = [...days];
              (hist || []).forEach((sess) => {
                const d = new Date(sess.started_at);
                if (Number.isNaN(d.getTime()) || d < start) return;
                const dow = d.getDay();
                if (!weekLogData[dow]) weekLogData[dow] = [];
                if (sess.subject_nome && !weekLogData[dow].includes(sess.subject_nome)) {
                  weekLogData[dow].push(sess.subject_nome);
                }
              });
            }
          } catch (e) {
            console.error('Erro ao carregar histórico do perfil:', e);
          }
          if (mounted) {
            setActiveDays(weekDays);
            setWeekLog(weekLogData);
          }

          if (mounted) {
            setStats(profileStats);
            setWeeklyGoal(goalProgress);
            setBadges(userBadges);
            setAllBadges(badgeDefs || []);
            setReminder({
              enabled: !!settings.reminder_enabled,
              hour: settings.reminder_hour ?? 20,
              minute: settings.reminder_minute ?? 0,
            });
          }
        } catch (e) {
          console.error('Erro ao carregar dados do perfil:', e);
        }
      })();

      return () => { mounted = false; };
    }, [userId])
  );

  // Toast de conquista: some sozinho em 6s (e o toque também dispensa).
  useEffect(() => {
    if (newBadges.length === 0) return;
    const t = setTimeout(() => setNewBadges([]), 6000);
    return () => clearTimeout(t);
  }, [newBadges.length]);

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

  // ============================================================
  // COMO FUNCIONA (Nível Júnior — permissões de câmera/galeria):
  // 1. O usuário escolhe a origem da foto (câmera ou galeria).
  // 2. Antes de abrir, pedimos a permissão ao SO
  //    (requestCameraPermissionsAsync / requestMediaLibraryPermissionsAsync).
  // 3. O retorno vem como { status, granted, canAskAgain } e tem 3 caminhos:
  //    a) granted → segue o fluxo normal (abre câmera/galeria);
  //    b) negado MAS canAskAgain true → alerta amigável (o SO ainda
  //       permite perguntar de novo numa próxima tentativa);
  //    c) negado E canAskAgain false → o usuário marcou "Não perguntar
  //       novamente": o app NÃO pode pedir de novo, então mostramos o
  //       passo a passo + botão que abre as Configurações do sistema
  //       (Linking.openSettings) para liberar manualmente.
  // 4. Tudo com try/catch (RNF01): sem câmera ou galeria com erro, o app
  //    avisa em vez de quebrar.
  // Orienta o usuário a liberar a permissão manual quando ele marcou
  // "Não perguntar novamente" (canAskAgain: false) — Nível Júnior.
  const showBlockedPermissionGuide = (nomeRecurso, passoPermissao) => {
    Alert.alert(
      'Permissão bloqueada',
      `Você escolheu "Não perguntar novamente" para ${nomeRecurso}. Para liberar:\n\n1. Toque em "Abrir configurações"\n2. Vá em "Permissões"\n3. Ative "${passoPermissao}"`,
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
      ]
    );
  };

  // Valida o retorno do pedido de permissão. Retorna true se liberado.
  const ensureImagePermission = async (requestFn, nomeRecurso, passoPermissao) => {
    try {
      const res = await requestFn();
      if (res?.granted || res?.status === 'granted') return true;
      if (res?.canAskAgain === false) {
        showBlockedPermissionGuide(nomeRecurso, passoPermissao);
      } else {
        Alert.alert(
          'Permissão necessária',
          `O Studifire precisa de acesso ${nomeRecurso} para trocar o avatar.`
        );
      }
      return false;
    } catch (e) {
      console.error('Erro ao pedir permissão:', e);
      Alert.alert('Recurso indisponível', 'Não foi possível acessar esse recurso neste aparelho.');
      return false;
    }
  };

  const saveAvatarBase64 = async (base64) => {
    try {
      await atualizarAvatar(userId, base64);
      setUserAvatar(`data:image/jpeg;base64,${base64}`);
      Alert.alert('Sucesso', 'Avatar atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o avatar.');
    }
  };

  const pickFromGallery = async () => {
    const ok = await ensureImagePermission(
      () => ImagePicker.requestMediaLibraryPermissionsAsync(),
      'à galeria',
      'Arquivos e mídia'
    );
    if (!ok) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      const canceled = result.canceled ?? result.cancelled;
      const base64 = result.assets?.[0]?.base64 || result.base64;
      if (!canceled && base64) {
        await saveAvatarBase64(base64);
      } else if (!canceled) {
        Alert.alert('Erro', 'Não foi possível obter a imagem. Tente novamente.');
      }
    } catch (e) {
      console.error('Erro ao abrir galeria:', e);
      Alert.alert('Erro', 'Não foi possível abrir a galeria neste aparelho.');
    }
  };

  const takePhoto = async () => {
    const ok = await ensureImagePermission(
      () => ImagePicker.requestCameraPermissionsAsync(),
      'à câmera',
      'Câmera'
    );
    if (!ok) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      const canceled = result.canceled ?? result.cancelled;
      const base64 = result.assets?.[0]?.base64 || result.base64;
      if (!canceled && base64) {
        await saveAvatarBase64(base64);
      } else if (!canceled) {
        Alert.alert('Erro', 'Não foi possível obter a foto. Tente novamente.');
      }
    } catch (e) {
      console.error('Erro ao abrir câmera:', e);
      Alert.alert(
        'Câmera indisponível',
        'Não foi possível abrir a câmera (aparelho sem câmera ou em uso por outro app).'
      );
    }
  };

  const handleAvatarChange = () => {
    Alert.alert('Trocar avatar', 'Escolha de onde virá a foto:', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar foto', onPress: takePhoto },
      { text: 'Galeria', onPress: pickFromGallery },
    ]);
  };

  // ============================================================
  // COMO FUNCIONA (Lembrete diário — notificações + persistência):
  // 1. Ao ATIVAR, pedimos permissão ao SO (requestReminderPermission).
  //    Mesmo padrão da câmera: bloqueado 2x → guia para Configurações.
  // 2. Com permissão, agendamos 1 notificação local RECORRENTE com trigger
  //    de calendário { hour, minute, repeats: true } — o próprio Android/iOS
  //    dispara todo dia, mesmo com o app fechado.
  // 3. O par (ativo, horário) é salvo no user_settings do SQLite (RF01):
  //    sobrevive a fechar o app e a ficar sem internet.
  // 4. No boot do app (App.js), restoreDailyReminder() lê o SQLite e
  //    reagenda se estava ativo — por isso o lembrete nunca "se perde".
  // 5. Trocar o chip com o lembrete ativo = cancela o anterior e agenda
  //    o novo (só existe 1 agendamento por vez).
  const formatReminderTime = (h, m) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const handleToggleReminder = async () => {
    if (!userId) return;
    if (reminder.enabled) {
      try {
        await disableDailyReminder(userId);
        setReminder((r) => ({ ...r, enabled: false }));
        Alert.alert('Lembrete desligado', 'Você não receberá mais o aviso diário.');
      } catch (e) {
        console.error('Erro ao desligar lembrete:', e);
        Alert.alert('Erro', 'Não foi possível desligar o lembrete.');
      }
      return;
    }
    // Ligando: valida permissão de notificação primeiro
    const perm = await requestReminderPermission();
    if (!perm.granted) {
      if (!perm.canAskAgain) {
        Alert.alert(
          'Notificações bloqueadas',
          'Você escolheu "Não perguntar novamente" para notificações. Para liberar:\n\n1. Toque em "Abrir configurações"\n2. Vá em "Notificações"\n3. Ative "Permitir notificações"',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert(
          'Permissão necessária',
          'Ative as notificações para receber o lembrete diário de estudo.'
        );
      }
      return;
    }
    try {
      await enableDailyReminder(userId, reminder.hour, reminder.minute);
      setReminder((r) => ({ ...r, enabled: true }));
      Alert.alert(
        'Lembrete ativado',
        `Todo dia às ${formatReminderTime(reminder.hour, reminder.minute)} 🔔`
      );
    } catch (e) {
      console.error('Erro ao ativar lembrete:', e);
      Alert.alert('Erro', 'Não foi possível agendar o lembrete neste aparelho.');
    }
  };

  const handlePickReminderTime = async (hour, minute) => {
    if (!userId) return;
    const next = { hour, minute };
    // Se já está ativo, reagenda na hora; se não, só persiste o horário
    try {
      if (reminder.enabled) {
        await enableDailyReminder(userId, hour, minute);
      } else {
        await updateReminderSettings(userId, { enabled: false, hour, minute });
      }
      setReminder((r) => ({ ...r, ...next }));
    } catch (e) {
      console.error('Erro ao salvar horário:', e);
      Alert.alert('Erro', 'Não foi possível salvar o horário.');
    }
  };

  const openReminderModal = () => {
    setReminderDraft({ hour: reminder.hour, minute: reminder.minute });
    setReminderModalVisible(true);
  };

  const saveReminderTime = async () => {
    const { hour, minute } = reminderDraft;
    setReminderModalVisible(false);
    await handlePickReminderTime(hour, minute);
  };

  // Tema light/dark: troca imediata na UI + persiste no user_settings (como o lembrete).
  const handleToggleTheme = async () => {
    if (!userId) return;
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    try {
      await updateThemeMode(userId, next);
    } catch (e) {
      console.error('Erro ao salvar tema:', e);
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

  // Progresso dos badges bloqueados: mostra o quanto falta para desbloquear.
  const badgeProgressLabel = (badge) => {
    if (!badge?.trigger_type || !badge?.trigger_value) return null;
    const currentByTrigger = {
      total_minutes: stats.totalMinutos,
      topics_completed: stats.topicosConcluidos,
      subjects_count: stats.totalMaterias,
      sessions_count: stats.totalSessoes,
      streak_days: stats.streak,
      weekly_minutes: stats.minutosSemana,
    };
    const current = currentByTrigger[badge.trigger_type];
    if (current == null) return null;
    const target = badge.trigger_value;
    const isMinutes = badge.trigger_type === 'total_minutes' || badge.trigger_type === 'weekly_minutes';
    const fmt = (v) => (isMinutes ? formatMinutes(v) : String(v));
    return `${fmt(Math.min(current, target))} / ${fmt(target)}`;
  };

  if (!userId) {
    return (
      <View style={s.container}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
        <LinearGradient colors={colors.bgGradient} style={s.gradientFill} />
        <View style={s.loadingCenter}>
          <Text style={s.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <LinearGradient colors={colors.bgGradient} style={s.gradientFill} />

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
            onPress={handleToggleTheme}
            accessibilityLabel="Alternar tema claro/escuro"
            testID="themeToggleButton"
          >
            {mode === 'dark' ? (
              <SunIcon size={17} color={colors.textMuted} testID="icon-sun" />
            ) : (
              <MoonIcon size={17} color={colors.textMuted} testID="icon-moon" />
            )}
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
              <CameraIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={s.userName}>{displayName}</Text>
          <Text style={s.userEmail}>{user?.email || '...'}</Text>
          <View style={s.proCard}>
            <View style={s.proHeader}>
              <Text style={s.proTitle}>Estudante Pro</Text>
              <Text style={s.proWeekCount}>{activeDays.length}/7 dias esta semana</Text>
            </View>
            <View style={s.proWeekLog}>
              {[
                { dow: 1, label: 'Seg' },
                { dow: 2, label: 'Ter' },
                { dow: 3, label: 'Qua' },
                { dow: 4, label: 'Qui' },
                { dow: 5, label: 'Sex' },
                { dow: 6, label: 'Sáb' },
                { dow: 0, label: 'Dom' },
              ].map(({ dow, label }) => {
                const nomes = weekLog[dow] || [];
                const isToday = new Date().getDay() === dow;
                return (
                  <View key={`log-${dow}`} style={s.proWeekLogRow}>
                    <Text style={[s.proWeekLogDay, isToday && s.proWeekLogDayToday]}>
                      {label}
                    </Text>
                    <Text
                      style={[s.proWeekLogText, !nomes.length && s.proWeekLogTextEmpty]}
                      numberOfLines={1}
                    >
                      {nomes.length ? nomes.join(', ') : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={s.proCaption}>
              {activeDays.includes(new Date().getDay())
                ? 'Check-in de hoje feito — continue assim!'
                : 'Estude hoje para manter o posto'}
            </Text>
          </View>
        </View>

        {/* Stats Grid - 4 cards */}
        <View style={s.statsGrid}>
          <View style={[s.statCard, { borderColor: 'rgba(138, 104, 255, 0.4)' }]}>
            <View style={s.statIcon}>
              <ClockIcon size={24} color={colors.accent} />
            </View>
            <Text style={s.statValue}>{formatHours(stats.totalMinutos)}</Text>
            <Text style={s.statLabel}>Horas de Estudo</Text>
          </View>
          <View style={s.statCard}>
            <View style={s.statIcon}>
              <CheckIcon size={24} color={colors.success} />
            </View>
            <Text style={s.statValue}>{stats.topicosConcluidos}/{stats.totalTopicos}</Text>
            <Text style={s.statLabel}>Tópicos Concluídos</Text>
          </View>
          <View style={[s.statCard, { borderColor: 'rgba(255, 170, 0, 0.4)' }]}>
            <View style={s.flameEmoji}>
              <FlameIcon size={24} color="#FF9F1C" />
            </View>
            <Text style={s.statValue}>{stats.streak}</Text>
            <Text style={s.statLabel}>Dias Seguidos</Text>
          </View>
          <View style={s.statCard}>
            <View style={s.statIcon}>
              <BookOpenIcon size={24} color={colors.accent} />
            </View>
            <Text style={s.statValue}>{stats.totalMaterias}</Text>
            <Text style={s.statLabel}>Matérias</Text>
          </View>
        </View>

        {/* Weekly Goal */}
        <View style={s.sectionContainer}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <TargetIcon size={16} color={colors.accent} />
              <Text style={s.sectionTitle}>Meta Semanal</Text>
            </View>
            <TouchableOpacity style={s.goalEditBtn} activeOpacity={0.7} onPress={openGoalModal}>
              <Text style={s.goalEditText}>Editar</Text>
            </TouchableOpacity>
          </View>
          <View style={s.goalCard}>
            <View style={s.goalProgressRow}>
              <Text style={s.goalCurrent}>{formatMinutes(weeklyGoal.currentMinutes)}</Text>
              <Text style={s.goalTarget}>/ {formatMinutes(weeklyGoal.goalMinutes)}</Text>
              <Text style={[s.goalPercent, { color: weeklyGoal.percent >= 100 ? colors.success : colors.accent }]}>
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

        {/* Lembrete diário */}
        <View style={s.sectionContainer}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <BellIcon size={16} color={colors.accent} />
              <Text style={s.sectionTitle}>Lembrete diário</Text>
            </View>
            <TouchableOpacity style={s.goalEditBtn} activeOpacity={0.7} onPress={handleToggleReminder}>
              <Text style={s.goalEditText}>{reminder.enabled ? 'Desligar' : 'Ativar'}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.goalCard}>
            <Text style={s.reminderStatus}>
              {reminder.enabled
                ? `Ativo • todo dia às ${formatReminderTime(reminder.hour, reminder.minute)}`
                : 'Desligado — ative para receber um aviso diário'}
            </Text>
            <View style={s.reminderChips}>
              {[
                { h: 8, m: 0 },
                { h: 12, m: 0 },
                { h: 19, m: 0 },
                { h: 20, m: 0 },
              ].map((t) => {
                const selected = reminder.hour === t.h && reminder.minute === t.m;
                return (
                  <TouchableOpacity
                    key={`${t.h}:${t.m}`}
                    style={[s.reminderChip, selected && s.reminderChipActive]}
                    activeOpacity={0.7}
                    onPress={() => handlePickReminderTime(t.h, t.m)}
                  >
                    <Text style={[s.reminderChipText, selected && s.reminderChipTextActive]}>
                      {formatReminderTime(t.h, t.m)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={s.customTimeBtn} activeOpacity={0.7} onPress={openReminderModal}>
              <ClockIcon size={14} color={colors.accent} />
              <Text style={s.customTimeText}>Outro horário</Text>
              <Text style={s.customTimeValue}>{formatReminderTime(reminder.hour, reminder.minute)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Badges */}
        <View style={s.sectionContainer}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <TrophyIcon size={16} color={colors.accent} />
              <Text style={s.sectionTitle}>Conquistas</Text>
            </View>
            <Text style={s.sectionSubtitle}>
              {badges.length} de {badgeCatalog.length || 8} desbloqueadas
            </Text>
          </View>
          {badgeCatalog.length === 0 ? (
            <View style={s.emptyBadges}>
              <Text style={s.emptyIcon}>🏅</Text>
              <Text style={s.emptyTitle}>Nenhuma conquista ainda</Text>
              <Text style={s.emptySubtitle}>
                Complete sessões, mantenha streaks e conclua tópicos para desbloquear badges!
              </Text>
            </View>
          ) : (
            <ScrollView
              style={s.badgesScroll}
              contentContainerStyle={s.badgesScrollContent}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {badgeCatalog.map((badge) => (
                <View
                  key={badge.id}
                  style={[
                    s.badgeCard,
                    badge.unlocked
                      ? {
                          backgroundColor:
                            BADGE_COLORS[badge.color] || 'rgba(111, 82, 255, 0.15)',
                          borderColor: badge.color,
                        }
                      : s.badgeCardLocked,
                  ]}
                >
                  {badge.unlocked ? (
                    <Text style={s.badgeIcon}>{badge.icon}</Text>
                  ) : (
                    <LockIcon size={24} color={colors.textMuted} />
                  )}
                  <View style={s.badgeInfo}>
                    <Text
                      style={[
                        badge.unlocked ? s.badgeName : s.badgeNameLocked,
                        badge.unlocked && { color: badge.color },
                      ]}
                    >
                      {badge.name}
                    </Text>
                    <Text style={badge.unlocked ? s.badgeDesc : s.badgeDescLocked}>
                      {badge.description}
                    </Text>
                    {!badge.unlocked && badgeProgressLabel(badge) && (
                      <Text style={s.badgeProgress}>
                        {badgeProgressLabel(badge)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Quick Insights */}
        <View style={s.sectionContainer}>
          <View style={s.sectionTitleRow}>
            <TrendingUpIcon size={16} color={colors.accent} />
            <Text style={s.sectionTitle}>Resumo Rápido</Text>
          </View>
          <View style={s.insightsGrid}>
            {stats.materiaTop && (
              <View style={s.insightCard}>
                <View style={s.insightIcon}>
                  <BookOpenIcon size={22} color={colors.accent} />
                </View>
                <View style={s.insightContent}>
                  <Text style={s.insightLabel}>Matéria mais estudada</Text>
                  <Text style={s.insightValue}>{stats.materiaTop.nome}</Text>
                  <Text style={s.insightSub}>{formatMinutes(stats.materiaTop.minutos)}</Text>
                </View>
              </View>
            )}
            {stats.melhorDia && (
              <View style={s.insightCard}>
                <View style={s.insightIcon}>
                  <CalendarIcon size={22} color={colors.accent} />
                </View>
                <View style={s.insightContent}>
                  <Text style={s.insightLabel}>Melhor dia</Text>
                  <Text style={s.insightValue}>{stats.melhorDia}</Text>
                  <Text style={s.insightSub}>Mais tempo de estudo</Text>
                </View>
              </View>
            )}
            {stats.totalSessoes > 0 && (
              <View style={s.insightCard}>
                <View style={s.insightIcon}>
                  <ZapIcon size={22} color={colors.accent} />
                </View>
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
            <View style={s.buttonEmoji}>
              <ClockIcon size={18} color={colors.text} />
            </View>
            <Text style={s.actionText}>Histórico</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionButton, s.actionButtonSecondary]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Progress')}
          >
            <View style={s.buttonEmoji}>
              <TrendingUpIcon size={18} color={colors.text} />
            </View>
            <Text style={s.actionText}>Progresso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionButton, s.actionButtonDanger]}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <View style={s.buttonEmoji}>
              <XIcon size={18} color={colors.text} />
            </View>
            <Text style={s.actionText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* New Badge Toast — toque para dispensar (ou some sozinho em 6s) */}
      {newBadges.length > 0 && (
        <TouchableOpacity style={s.toastContainer} activeOpacity={0.9} onPress={() => setNewBadges([])}>
          {newBadges.map((badge, i) => (
            <View key={i} style={[s.toast, { borderColor: badge.color }]}>
              <Text style={s.toastIcon}>{badge.icon}</Text>
              <View style={s.toastContent}>
                <Text style={s.toastTitle}>Nova Conquista!</Text>
                <Text style={[s.toastName, { color: badge.color }]}>{badge.name}</Text>
                <Text style={s.toastHint}>Toque para dispensar</Text>
              </View>
            </View>
          ))}
        </TouchableOpacity>
      )}

      {/* Modal Lembrete — escolher horário */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity
            style={s.modalBackdrop}
            activeOpacity={1}
            onPress={() => setReminderModalVisible(false)}
          />
          <View style={s.modalCard}>
            <View style={s.modalTitleRow}>
              <BellIcon size={18} color={colors.accent} />
              <Text style={s.modalTitle}>Lembrete diário</Text>
            </View>
            <Text style={s.modalSubtitle}>Escolha o horário do aviso diário</Text>

            <View style={s.timePickerRow}>
              <View style={s.timeColumnWrap}>
                <Text style={s.timeColumnLabel}>Hora</Text>
                <ScrollView style={s.timeColumn} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 24 }, (_, h) => h).map((h) => {
                    const active = reminderDraft.hour === h;
                    return (
                      <TouchableOpacity
                        key={`hora-${h}`}
                        style={[s.timeOption, active && s.timeOptionActive]}
                        activeOpacity={0.7}
                        onPress={() => setReminderDraft((d) => ({ ...d, hour: h }))}
                      >
                        <Text style={[s.timeOptionText, active && s.timeOptionTextActive]}>
                          {String(h).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <Text style={s.timeColon}>:</Text>
              <View style={s.timeColumnWrap}>
                <Text style={s.timeColumnLabel}>Minuto</Text>
                <ScrollView style={s.timeColumn} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                    const active = reminderDraft.minute === m;
                    return (
                      <TouchableOpacity
                        key={`minuto-${m}`}
                        style={[s.timeOption, active && s.timeOptionActive]}
                        activeOpacity={0.7}
                        onPress={() => setReminderDraft((d) => ({ ...d, minute: m }))}
                      >
                        <Text style={[s.timeOptionText, active && s.timeOptionTextActive]}>
                          {String(m).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <Text style={s.timePreview}>
              Aviso todo dia às {formatReminderTime(reminderDraft.hour, reminderDraft.minute)}
            </Text>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonCancel]}
                activeOpacity={0.7}
                onPress={() => setReminderModalVisible(false)}
              >
                <Text style={s.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonConfirm]}
                activeOpacity={0.7}
                onPress={saveReminderTime}
              >
                <Text style={s.modalButtonConfirmText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Meta Semanal */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.modalOverlay}
        >
          <TouchableOpacity
            style={s.modalBackdrop}
            activeOpacity={1}
            onPress={() => setGoalModalVisible(false)}
          />
          <View style={s.modalCard}>
            <View style={s.modalTitleRow}>
              <TargetIcon size={18} color={colors.accent} />
              <Text style={s.modalTitle}>Meta Semanal</Text>
            </View>
            <Text style={s.modalSubtitle}>Defina sua meta de horas de estudo por semana</Text>

            <View style={s.modalInputWrapper}>
              <TextInput
                style={s.modalInput}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="decimal-pad"
                placeholder="Ex: 5"
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.accent}
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