import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider } from '../src/shared/theme/ThemeContext';

jest.mock('../src/hooks/useUserId', () => ({
  useUserId: () => 1,
}));

jest.mock('../src/services/subjectsDb', () => ({
  carregarMaterias: jest.fn(),
  carregarHistorico: jest.fn(),
}));

const HistoricScreen = require('../src/screens/HistoricScreen').default;
const { carregarMaterias, carregarHistorico } = require('../src/services/subjectsDb');

describe('Histórico — sessão detalhada e semana com tópicos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('abre a sessão, mostra o tópico concluído e navega para a matéria', async () => {
    const hoje = new Date();
    hoje.setHours(8, 0, 0, 0);
    const materia = {
      id: 7,
      nome: 'Matemática',
      topicos: [
        {
          nome: 'Álgebra',
          estudado: true,
          completed_at: hoje.toISOString(),
        },
      ],
    };
    const sessao = {
      id: 1,
      subject_id: 7,
      subject_nome: 'Matemática',
      started_at: hoje.toISOString(),
      duration_minutes: 50,
    };
    carregarMaterias.mockResolvedValue([materia]);
    carregarHistorico.mockResolvedValue([sessao]);

    const navigation = { goBack: jest.fn(), navigate: jest.fn() };
    const screen = render(
      <NavigationContainer>
        <ThemeProvider initialMode="dark">
          <HistoricScreen navigation={navigation} />
        </ThemeProvider>
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Ver sessão de Matemática')).toBeTruthy();
    });

    expect(screen.getByText('✓ Matemática · Álgebra')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Ver sessão de Matemática'));

    expect(screen.getByText('Tópicos concluídos nesse dia')).toBeTruthy();
    expect(screen.getByText('✓ Álgebra')).toBeTruthy();

    fireEvent.press(screen.getByText('Abrir matéria'));

    expect(navigation.navigate).toHaveBeenCalledWith('Detail', { id: 7 });
  });
});
