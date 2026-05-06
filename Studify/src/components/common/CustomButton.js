import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomButtonStyles } from '../../styles/components/common/CustomButtonStyles.js';

const CustomButton = ({
  title,
  onPress,
  gradientColors = ['#5ab8d4', '#3a9ab8', '#2a7a98'],
  textStyle,
  disabled = false,
  ...props
}) => (
  <TouchableOpacity
    style={[styles.button, disabled && styles.disabled]}
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled}
    {...props}
  >
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

export default CustomButton;
