import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { IconStyles as styles } from '../../styles/components/common/IconStyles.js';

const Icon = ({ name, size = 24, color = '#fff', style = {} }) => {
  const icons = {
    menu: '☰',
    search: '🔍',
    download: '⬇️',
    plus: '+',
    clock: '🕐',
    pin: '📌',
    question: '?',
    user: '👤',
    book: '📚',
    close: '✕',
    unpin: '📌',
  };
  return (
    <Text style={[styles.icon, { fontSize: size, color }, style]}>
      {icons[name] || '?'}
    </Text>
  );
};

export default Icon;

