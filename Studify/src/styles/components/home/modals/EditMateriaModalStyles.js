import { StyleSheet } from 'react-native';
import { dark } from '../../../../shared/theme/colors';

export const getEditMateriaModalStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitulo: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  modalClose: {
    color: colors.textMuted,
    fontSize: 20,
  },
  modalLabel: {
    color: colors.textSecondary,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    marginBottom: 14,
    fontSize: 14,
  },
  topicoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicoInputField: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  topicoAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicoAddBtnDisabled: {
    opacity: 0.35,
  },
  topicoAddBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  topicoChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  topicoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  topicoChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  topicoChipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.mode === 'light' ? 'rgba(20,27,51,0.08)' : 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicoChipRemoveText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  modalConfirmar: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  modalConfirmarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  excluirBtn: {
    backgroundColor: '#D23A3A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  excluirBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export const EditMateriaModalStyles = getEditMateriaModalStyles(dark);