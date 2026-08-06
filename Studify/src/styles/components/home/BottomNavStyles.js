import { StyleSheet } from 'react-native';

export const BottomNavStyles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#28315B',
    backgroundColor: '#0D1330',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
  },
  navIcon: {
    color: '#7682B4',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  navLabel: {
    color: '#707AA8',
    fontSize: 10,
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#7F6CFF',
  },
  navItemPlus: {
    marginTop: -8,
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
    backgroundColor: '#6F52FF',
    marginBottom: 3,
    fontWeight: '700',
  },
});