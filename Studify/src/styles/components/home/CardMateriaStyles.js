import { StyleSheet } from 'react-native';

export const CardMateriaStyles = StyleSheet.create({
  card: {
    width: 150,
    height: 90,
    backgroundColor: '#252b34',
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#3a4555',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardNome: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  cardDesc: {
    color: '#7a8a9a',
    fontSize: 11,
    marginTop: 4,
  },
  pinBtn: {
    marginLeft: 4,
  },
});
