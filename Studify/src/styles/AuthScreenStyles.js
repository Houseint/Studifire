import { StyleSheet } from 'react-native';

export const AuthScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
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
    color: 'rgba(200, 220, 230, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 30,
    paddingHorizontal: 18,
  },
  input: {
    color: '#ffffff',
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
    backgroundColor: '#5ab8d4',
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
    color: 'rgba(200, 220, 230, 0.7)',
    fontSize: 13,
  },
  footerLink: {
    color: '#00c8f0',
    fontWeight: '700',
  },
  registerLogo: {
    width: 300,
    height: 350,
  },
});
