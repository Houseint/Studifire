import { StyleSheet } from 'react-native';

export const CustomInputStyles = StyleSheet.create({
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    color: '#c0d8e8',
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 15,
  },
});
