import { StyleSheet } from 'react-native';

export const ProgressCardsStyles = StyleSheet.create({
  sectionHeading: {
    color: '#8F98C2',
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
    backgroundColor: '#1A1C4A',
    borderColor: '#4850AE',
  },
  progressoCardLaranja: {
    backgroundColor: '#2A1F19',
    borderColor: '#A56A2A',
  },
  progressoLabel: {
    color: '#AEB5DA',
    fontSize: 10,
    fontWeight: '700',
  },
  progressoValor: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: 2,
  },
  progressoMeta: {
    color: '#8E97C4',
    fontSize: 10,
    fontWeight: '700',
  },
  progressoLinha: {
    marginTop: 8,
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressoLinhaFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 999,
  },
});