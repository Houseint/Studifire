import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TutorialModal from '../src/components/common/TutorialModal';

describe('TutorialModal', () => {
  test('tem 7 passos e fecha pelo botão final', () => {
    const onClose = jest.fn();
    const screen = render(<TutorialModal visible onClose={onClose} />);

    expect(screen.getByText('Passo 1 de 7')).toBeTruthy();
    expect(screen.getByText('Bem-vindo ao Studifire')).toBeTruthy();

    for (let i = 0; i < 6; i += 1) {
      fireEvent.press(screen.getByText('Próximo'));
    }

    expect(screen.getByText('Passo 7 de 7')).toBeTruthy();
    fireEvent.press(screen.getByText('Começar a estudar'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('pular fecha o tour', () => {
    const onClose = jest.fn();
    const screen = render(<TutorialModal visible onClose={onClose} />);

    fireEvent.press(screen.getByText('Pular tutorial'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
