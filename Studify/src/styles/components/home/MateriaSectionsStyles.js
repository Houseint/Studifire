import { StyleSheet } from 'react-native';
import { dark } from '../../../shared/theme/colors';

export const getMateriaSectionsStyles = (colors) => StyleSheet.create({
  vazio: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginLeft: 2,
  },
});

export const MateriaSectionsStyles = getMateriaSectionsStyles(dark);