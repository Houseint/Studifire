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

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

    expect(screen.getByText('Álgebra')).toBeTruthy();
    expect(screen.getByText('Matemática · Concluído')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Ver sessão de Matemática'));

    expect(screen.getByText('Tópicos concluídos nesse dia')).toBeTruthy();
    expect(screen.getByText('✓ Álgebra')).toBeTruthy();

    fireEvent.press(screen.getByText('Abrir matéria'));

    expect(navigation.navigate).toHaveBeenCalledWith('Detail', { id: 7 });
  });

  test('filtros e dias navegam entre as agendas', async () => {
    const hoje = new Date();
    hoje.setHours(8, 0, 0, 0);
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const materias = [
      {
        id: 7,
        nome: 'Matemática',
        topicos: [
          { nome: 'Álgebra', estudado: true, completed_at: hoje.toISOString() },
        ],
      },
      {
        id: 8,
        nome: 'Biologia',
        topicos: [
          { nome: 'Células', estudado: true, completed_at: ontem.toISOString() },
        ],
      },
    ];
    const sessoes = [
      {
        id: 1,
        subject_id: 7,
        subject_nome: 'Matemática',
        started_at: hoje.toISOString(),
        duration_minutes: 50,
      },
      {
        id: 2,
        subject_id: 8,
        subject_nome: 'Biologia',
        started_at: ontem.toISOString(),
        duration_minutes: 30,
      },
    ];
    carregarMaterias.mockResolvedValue(materias);
    carregarHistorico.mockResolvedValue(sessoes);

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

    const labelOntem = `Dia ${WEEKDAYS[ontem.getDay()]} ${String(ontem.getDate()).padStart(2, '0')}`;
    fireEvent.press(screen.getByLabelText(labelOntem));

    await waitFor(() => {
      expect(screen.getByLabelText('Ver sessão de Biologia')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Hoje'));

    await waitFor(() => {
      expect(screen.getByLabelText('Ver sessão de Matemática')).toBeTruthy();
    });
    expect(screen.queryByLabelText('Ver sessão de Biologia')).toBeNull();
  });

  test('filtro Hoje sem atividade mostra o aviso do dia', async () => {
    const ontem = new Date();
    ontem.setHours(8, 0, 0, 0);
    ontem.setDate(ontem.getDate() - 1);

    carregarMaterias.mockResolvedValue([
      {
        id: 8,
        nome: 'Biologia',
        topicos: [
          { nome: 'Células', estudado: true, completed_at: ontem.toISOString() },
        ],
      },
    ]);
    carregarHistorico.mockResolvedValue([
      {
        id: 2,
        subject_id: 8,
        subject_nome: 'Biologia',
        started_at: ontem.toISOString(),
        duration_minutes: 30,
      },
    ]);

    const navigation = { goBack: jest.fn(), navigate: jest.fn() };
    const screen = render(
      <NavigationContainer>
        <ThemeProvider initialMode="dark">
          <HistoricScreen navigation={navigation} />
        </ThemeProvider>
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Ver sessão de Biologia')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Hoje'));

    expect(await screen.findByText('Nenhuma sessão registrada nesse dia.')).toBeTruthy();
    expect(screen.queryByLabelText('Ver sessão de Biologia')).toBeNull();
  });
});
