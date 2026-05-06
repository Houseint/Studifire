import { StyleSheet } from 'react-native';

export const HomeScreenStyles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#1a1e24',
  },
  // Topo (copied from original HomeScreenStyles.js)
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  perfilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2c3340',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3a4555',
  },
  perfilNome: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2c3340',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3a4555',
  },
  // Busca
  buscaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c3340',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a4555',
  },
  buscaIcone: {
    paddingLeft: 14,
    fontSize: 16,
  },
  buscaInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 10,
    color: '#ffffff',
    fontSize: 15,
  },
  // Scroll
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  vazio: {
    color: '#5a6a7a',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2c3340',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    borderWidth: 1,
    borderColor: '#3a4555',
  },
  bottomBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  bottomBtnPrincipal: {
    backgroundColor: '#6c9fd4',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  bottomIcon: {
    fontSize: 22,
  },
  // Modal styles (from original)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  // ... (add full modal styles from original HomeScreenStyles.js)
});
