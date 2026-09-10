import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// Arquivo separado do fase2-02: aquele usa jest.resetModules() (mocks de fetch),
// que cria uma segunda cópia do React e quebra o render do Modal neste setup.
// Componente puro aqui, sem resetModules.
import QuizModal from '../src/features/study/QuizModal';

describe('2.2 - QuizModal: responde e salva', () => {
  const QUESTOES = [
    {
      pergunta: 'Quanto é 2 + 2 na aritmética básica?',
      alternativas: ['3', '4', '5', '22'],
      correta: 1,
    },
  ];

  test('fluxo completo: escolhe certa, vê resultado e salva {total, correct}', async () => {
    const onFinish = jest.fn();
    const screen = render(
      <QuizModal visible questoes={QUESTOES} onFinish={onFinish} onClose={() => {}} />
    );

    fireEvent.press(screen.getByText('4'));
    fireEvent.press(screen.getByText('Ver resultado'));

    await act(async () => {});
    expect(screen.getByText('1/1')).toBeTruthy();

    fireEvent.press(screen.getByText('Salvar resultado'));
    expect(onFinish).toHaveBeenCalledWith({ total: 1, correct: 1 });
  });

  test('erra a questão: correct vem 0', async () => {
    const onFinish = jest.fn();
    const screen = render(
      <QuizModal visible questoes={QUESTOES} onFinish={onFinish} onClose={() => {}} />
    );

    fireEvent.press(screen.getByText('3'));
    fireEvent.press(screen.getByText('Ver resultado'));

    await act(async () => {});
    fireEvent.press(screen.getByText('Salvar resultado'));
    expect(onFinish).toHaveBeenCalledWith({ total: 1, correct: 0 });
  });

  test('invisível não renderiza nada', () => {
    const screen = render(
      <QuizModal visible={false} questoes={QUESTOES} onFinish={() => {}} onClose={() => {}} />
    );
    expect(screen.queryByText('Quanto é 2 + 2 na aritmética básica?')).toBeNull();
  });
});
