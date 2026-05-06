import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get("window");

export const RegisterScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1e",
  },
  keyboardView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  glowOrb1: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0, 180, 230, 0.06)",
  },
  glowOrb2: {
    position: "absolute",
    bottom: 60,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0, 120, 180, 0.05)",
  },
  // Logo
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  logoIconWrapper: {
    marginBottom: 12,
    shadowColor: "#00d4ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  logoIconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTitle: {
    color: "#00d4ff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 6,
    textShadowColor: "rgba(0, 212, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  logoSubtitle: {
    color: "rgba(0, 180, 220, 0.7)",
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 4,
    fontWeight: "500",
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    color: "#c0d8e8",
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    color: "#ffffff",
    fontSize: 15,
  },
  cadastrarButton: {
    marginTop: 10,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#00aacc",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cadastrarGradient: {
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 30,
  },
  cadastrarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    color: "rgba(200, 220, 230, 0.7)",
    fontSize: 13,
  },
  footerLink: {
    color: "#00c8f0",
    fontWeight: "700",
  },
});
