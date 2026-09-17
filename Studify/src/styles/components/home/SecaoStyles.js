import { StyleSheet } from 'react-native';
import { dark } from '../../../shared/theme/colors';

export const getSecaoStyles = (colors) => StyleSheet.create({
  secao: {
    marginTop: 18,
  },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  secaoTitulo: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
});

export const SecaoStyles = getSecaoStyles(dark);
