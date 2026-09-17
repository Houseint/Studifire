import { StyleSheet } from 'react-native';
import { dark } from '../../../shared/theme/colors';

export const getBottomNavStyles = (colors) => StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  navLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  navLabelActive: {
    color: colors.accent,
  },
  navItemPlus: {
    marginTop: 4,
    marginLeft: 8,
  },
  navPlusText: {
    color: '#FFFFFF',
    fontSize: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    textAlign: 'center',
    lineHeight: 33,
    overflow: 'hidden',
    backgroundColor: colors.accentStrong,
    marginBottom: 3,
    fontWeight: '700',
  },
});

export const BottomNavStyles = getBottomNavStyles(dark);