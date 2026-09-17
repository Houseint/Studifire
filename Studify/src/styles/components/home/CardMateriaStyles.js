import { StyleSheet } from 'react-native';
import { dark } from '../../../shared/theme/colors';

export const getCardMateriaStyles = (colors) => StyleSheet.create({
  card: {
    width: 164,
    minHeight: 108,
    borderRadius: 14,
    marginRight: 10,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardNome: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#F59E0B',
    color: '#FFF7E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
  cardDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  pinBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    marginTop: 8,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.mode === 'light' ? 'rgba(20,27,51,0.12)' : 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '55%',
    height: '100%',
    borderRadius: 999,
  },
});

export const CardMateriaStyles = getCardMateriaStyles(dark);
