import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CustomInputStyles as styles } from '../../styles/components/common/CustomInputStyles.js';

const CustomInput = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  placeholder,
  selectionColor = '#00d4ff',
  ...props
}) => (
  <View style={styles.inputGroup}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="transparent"
        selectionColor={selectionColor}
        {...props}
      />
    </View>
  </View>
);

export default CustomInput;

