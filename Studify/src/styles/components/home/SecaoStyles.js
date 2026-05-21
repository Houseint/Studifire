import { StyleSheet } from 'react-native';

export const SecaoStyles = StyleSheet.create({
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
    color: '#9AA4CC',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
});
