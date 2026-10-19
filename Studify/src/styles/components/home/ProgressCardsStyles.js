import { StyleSheet } from 'react-native';
import { dark } from '../../../shared/theme/colors';

export const getProgressCardsStyles = (colors) => StyleSheet.create({
  sectionHeading: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  progressoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressoCard: {
    width: '48.5%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  progressoCardRoxo: {
    backgroundColor: colors.mode === 'light' ? colors.card : '#1A1C4A',
    borderColor: colors.mode === 'light' ? colors.accent : '#4850AE',
  },
  progressoCardLaranja: {
    backgroundColor: colors.mode === 'light' ? colors.card : '#2A1F19',
    borderColor: colors.mode === 'light' ? colors.warn : '#A56A2A',
  },
  progressoLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  progressoValor: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: 2,
  },
  progressoMeta: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  progressoHint: {
    color: colors.warn,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
  },
});

export const ProgressCardsStyles = getProgressCardsStyles(dark);