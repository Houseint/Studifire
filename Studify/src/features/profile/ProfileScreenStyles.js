import { StyleSheet, Dimensions } from 'react-native';
import { dark } from '../../shared/theme/colors';

const { width } = Dimensions.get('window');

/**
 * Estilos do Perfil por tema. Mesmas keys do objeto estático antigo —
 * telas não migradas seguem usando `ProfileScreenStyles` (dark) sem quebrar.
 */
export function getProfileStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  gradientFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  bottomSpacer: {
    height: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.textMuted,
    fontSize: 22,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 20,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.accentStrong,
    backgroundColor: colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatarInitials: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '700',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  editAvatarText: {
    color: colors.text,
    fontSize: 20,
  },
  userName: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 15,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 5,
  },
  badgePill: {
    backgroundColor: 'rgba(111, 82, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 15,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },

  // Stats Grid (2x2)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  flameEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },

  // Section Container
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  // Weekly Goal
  goalEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 104, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(138, 104, 255, 0.3)',
  },
  goalEditText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
  },
  goalCurrent: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  goalTarget: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '500',
  },
  goalPercent: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.card2,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  goalSubtext: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },

  // Lembrete diário
  reminderStatus: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  reminderChips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  reminderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderChipActive: {
    backgroundColor: 'rgba(138, 104, 255, 0.2)',
    borderColor: colors.accent,
  },
  reminderChipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  reminderChipTextActive: {
    color: colors.text,
  },

  // Badges
  emptyBadges: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  badgesScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  badgeCard: {
    width: 160,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeCardLocked: {
    opacity: 0.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeIconLocked: {
    fontSize: 28,
    opacity: 0.5,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeNameLocked: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  badgeDesc: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  badgeDescLocked: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },

  // Insights
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  insightCard: {
    width: (width - 44) / 2,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightIcon: {
    fontSize: 24,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  insightValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  insightSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
  },
  actionButtonSecondary: {
    borderColor: 'rgba(138, 104, 255, 0.4)',
    backgroundColor: 'rgba(138, 104, 255, 0.1)',
  },
  actionButtonDanger: colors.mode === 'light'
    ? {
      backgroundColor: '#F6E3EC',
      borderColor: '#DFA9C4',
    }
    : {
      backgroundColor: '#2A1B1B',
      borderColor: '#5A3030',
    },
  actionIcon: {
    fontSize: 20,
  },
  buttonEmoji: {
    fontSize: 20,
  },
  actionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },

  // Toast for new badges
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIcon: {
    fontSize: 28,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  toastName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },

  // Modal Meta Semanal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  modalInput: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    paddingVertical: 14,
  },
  modalInputSuffix: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonCancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: colors.accentStrong,
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  });
}

// Compat: objeto estático dark (shim, fase0-16 e telas não migradas).
export const ProfileScreenStyles = getProfileStyles(dark);