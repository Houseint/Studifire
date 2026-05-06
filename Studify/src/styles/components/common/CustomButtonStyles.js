import { StyleSheet } from 'react-native';

export const CustomButtonStyles = StyleSheet.create({
  button: {
    marginTop: 10,
    borderRadius: 30,
    shadowColor: '#00aacc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 30,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
