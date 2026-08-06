import { StyleSheet } from 'react-native';

export const HomeHeaderStyles = StyleSheet.create({
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
    backgroundColor: '#8A68FF',
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
    color: '#7F8AB7',
    fontSize: 10,
    fontWeight: '700',
  },
  perfilNome: {
    color: '#F4F6FF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  helpBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#27315B',
    backgroundColor: '#111832',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: {
    fontSize: 18,
  },
});