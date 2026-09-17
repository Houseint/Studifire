import { StyleSheet } from 'react-native';
import { dark } from '../../../shared/theme/colors';

export const getHomeHeaderStyles = (colors) => StyleSheet.create({
  topo: {
    marginTop: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  perfilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  saudacao: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  perfilNome: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  helpBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: {
    fontSize: 18,
  },
});

export const HomeHeaderStyles = getHomeHeaderStyles(dark);