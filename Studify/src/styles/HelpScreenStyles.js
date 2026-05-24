import { StyleSheet } from 'react-native';

export const HelpScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  gradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  backButtonText: {
    color: '#8a9bb5',
    fontSize: 22,
  },
  headerTitle: {
    color: '#e8edf5',
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  secaoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
  },
  secaoBar: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  secaoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
    marginRight: 10,
  },
  secaoTitleArea: {
    flex: 1,
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secaoSubtitulo: {
    color: '#5a6a7a',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  secaoArrow: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  secaoContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  metodoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  metodoIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
    marginTop: 1,
  },
  metodoInfo: {
    flex: 1,
    marginLeft: 10,
  },
  metodoNome: {
    color: '#e8edf5',
    fontSize: 14,
    fontWeight: '600',
  },
  metodoDesc: {
    color: '#6a7a8a',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  linkIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  linkInfo: {
    flex: 1,
  },
  linkNome: {
    color: '#e8edf5',
    fontSize: 14,
    fontWeight: '600',
  },
  linkUrl: {
    color: '#5a6a7a',
    fontSize: 11,
    marginTop: 2,
  },
  linkArrow: {
    color: '#5ab8d4',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 40,
  },
});
