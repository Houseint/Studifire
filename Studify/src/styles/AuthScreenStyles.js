import { StyleSheet } from 'react-native';
import { dark } from '../shared/theme/colors';

/**
 * T7 Auth light — mesma paleta do app (colors.js).
 * Padrão igual ao Chat: getAuthScreenStyles(colors) via useMemo.
 * AuthScreenStyles mantido como fallback dark p/ compat.
 */
export const getAuthScreenStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  glowOrb1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(111, 82, 255, 0.2)',
    filter: 'blur(40px)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(111, 82, 255, 0.15)',
    filter: 'blur(40px)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 260,
    height: 260,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    paddingHorizontal: 18,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    paddingVertical: 14,
  },
  formWrap: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  authButton: {
    marginTop: 10,
    borderRadius: 30,
    backgroundColor: colors.accentStrong,
    paddingVertical: 15,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  footerLink: {
    color: colors.accent,
    fontWeight: '700',
  },
  registerLogo: {
    width: 300,
    height: 350,
  },
});

export const AuthScreenStyles = getAuthScreenStyles(dark);
