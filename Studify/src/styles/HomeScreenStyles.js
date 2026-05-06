import { StyleSheet } from 'react-native';

export const HomeScreenStyles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "#1a1e24",
  },

  // Topo
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  perfilBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2c3340",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3a4555",
  },
  perfilNome: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2c3340",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3a4555",
  },
  helpText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Busca
  buscaWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c3340",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#3a4555",
  },
  buscaIcone: {
    paddingLeft: 14,
    fontSize: 16,
  },
  buscaInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 10,
    color: "#ffffff",
    fontSize: 15,
  },

  // Scroll
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Seção
  secao: {
    marginTop: 24,
  },
  secaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  secaoTitulo: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
    flex: 1,
  },
  addBtn: {
    backgroundColor: "#2c4a7a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBtnText: {
    color: "#6c9fd4",
    fontSize: 13,
    fontWeight: "700",
  },

  // Card
  card: {
    width: 150,
    height: 90,
    backgroundColor: "#252b34",
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#3a4555",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardNome: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  cardDesc: {
    color: "#7a8a9a",
    fontSize: 11,
    marginTop: 4,
  },
  pinBtn: {
    marginLeft: 4,
  },
  vazio: {
    color: "#5a6a7a",
    fontSize: 13,
    fontStyle: "italic",
    paddingVertical: 16,
  },

  // Barra inferior
  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#2c3340",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 64,
    borderWidth: 1,
    borderColor: "#3a4555",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  bottomBtnPrincipal: {
    backgroundColor: "#6c9fd4",
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: "#6c9fd4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomIcon: {
    fontSize: 22,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#252b34",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: "#3a4555",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  modalLabel: {
    color: "#7a8a9a",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: "#1a1e24",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3a4555",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 15,
  },
  modalConfirmar: {
    backgroundColor: "#6c9fd4",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  modalConfirmarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

