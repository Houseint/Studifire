import React from 'react';
import { render } from '@testing-library/react-native';
import MarkdownText from '../src/components/common/MarkdownText';

describe('MarkdownText — respostas da IA', () => {
  test('remove asteriscos e aplica negrito', () => {
    const screen = render(<MarkdownText text="Olá **mundo**! Estude *hoje*." />);

    expect(screen.getByText('mundo')).toBeTruthy();
    expect(screen.getByText('hoje')).toBeTruthy();
    expect(screen.queryByText(/\*\*/)).toBeNull();
  });

  test('transforma listas em marcadores visuais', () => {
    const screen = render(<MarkdownText text={'Tópicos:\n- Álgebra\n- Geometria'} />);

    expect(screen.getByText('Tópicos:')).toBeTruthy();
    expect(screen.getAllByText('•')).toHaveLength(2);
    expect(screen.getByText('Álgebra')).toBeTruthy();
    expect(screen.getByText('Geometria')).toBeTruthy();
  });

  test('remove marcação de título e mantém o texto', () => {
    const screen = render(<MarkdownText text={'## Resumo\nConteúdo'} />);

    expect(screen.getByText('Resumo')).toBeTruthy();
    expect(screen.getByText('Conteúdo')).toBeTruthy();
    expect(screen.queryByText('## Resumo')).toBeNull();
  });
});
