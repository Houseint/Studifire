import { StyleSheet } from 'react-native';
import { dark } from '../../shared/theme/colors';

export const getHomeStyles = (colors) => StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 14,
  },
  buscaWrapper: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  buscaInput: {
    flex: 1,
    color: colors.text,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  scrollBottomSpace: {
    height: 86,
  },
});

export default getHomeStyles(dark);