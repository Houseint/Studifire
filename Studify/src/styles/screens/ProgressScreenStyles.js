import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

export const ProgressScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090E1F',
  },
  gradient: {
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#F4F6FF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginLeft: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27315B',
    backgroundColor: '#111832',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: '#7F8AB7', fontSize: 22 },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27315B',
    backgroundColor: '#111832',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 20,
  },

  // Stat Cards Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111832',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27315B',
    padding: 18,
    alignItems: 'center',
  },
  statCardAccent: {
    borderColor: 'rgba(138, 104, 255, 0.4)',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    color: '#F4F6FF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: '#8E97C4',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },

  // Streak Card
  streakCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#111832',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakFire: {
    fontSize: 36,
    marginRight: 14,
  },
  streakInfo: {},
  streakLabel: {
    color: '#8E97C4',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  streakValue: {
    color: '#FFAA00',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  streakSub: {
    color: '#8E97C4',
    fontSize: 13,
    marginTop: 2,
  },
  streakButton: {
    backgroundColor: 'rgba(255, 170, 0, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
  },
  streakButtonText: {
    color: '#FFAA00',
    fontSize: 13,
    fontWeight: '600',
  },

  // Chart Section
  chartSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F4F6FF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#8E97C4',
    fontSize: 13,
  },
  chartCard: {
    backgroundColor: '#111832',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27315B',
    padding: 18,
  },
  chartWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: 4,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    color: '#7F8AB7',
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500',
  },
  chartBarValue: {
    color: '#F4F6FF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },

  // Subject Sections
  subjectSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  subjectSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectCard: {
    backgroundColor: '#111832',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27315B',
    padding: 16,
    marginBottom: 10,
  },
  subjectCardInProgress: {
    borderColor: 'rgba(138, 104, 255, 0.4)',
  },
  subjectCardCompleted: {
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectName: {
    color: '#F4F6FF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  subjectProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectProgressText: {
    color: '#8A68FF',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'right',
  },
  subjectProgressTextCompleted: {
    color: '#4CAF50',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#1A2340',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarInProgress: {
    backgroundColor: '#8A68FF',
  },
  progressBarCompleted: {
    backgroundColor: '#4CAF50',
  },
  subjectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectTopics: {
    color: '#7F8AB7',
    fontSize: 12,
  },
  subjectCompletedDate: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  subjectActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(138, 104, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(138, 104, 255, 0.3)',
  },
  subjectActionButtonText: {
    color: '#8A68FF',
    fontSize: 13,
    fontWeight: '600',
  },
  subjectActionButtonCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  subjectActionButtonTextCompleted: {
    color: '#4CAF50',
  },

  // Empty States
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyTitle: {
    color: '#F4F6FF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#7F8AB7',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotInProgress: {
    backgroundColor: '#8A68FF',
  },
  legendDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  legendText: {
    color: '#8E97C4',
    fontSize: 12,
    fontWeight: '500',
  },
});