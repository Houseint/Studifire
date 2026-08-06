import React from 'react';
import { Alert, TextInput } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';

jest.mock('../src/hooks/useUserId', () => ({
  useUserId: () => 1,
}));

jest.mock('../src/services/authDb', () => ({
  getSessionUser: jest.fn(),
  getUserById: jest.fn(),
}));

jest.mock('../src/services/subjectsDb', () => ({
  carregarMaterias: jest.fn(),
  criarMateria: jest.fn(),
  atualizarMateria: jest.fn(),
  getMateriaById: jest.fn(),
  deletarMateria: jest.fn(),
  toggleFixada: jest.fn(),
}));

import {
  carregarMaterias,
  criarMateria,
  atualizarMateria,
  deletarMateria,
  toggleFixada,
} from '../src/services/subjectsDb';
import { getSessionUser, getUserById } from '../src/services/authDb';

const HomeScreen = require('../src/screens/HomeScreen').default;

const materia = {
  id: 1,
  nome: 'Matemática',
  topicos: [{ nome: 'Álgebra', estudado: false }],
  fixada: false,
  created_at: '2026-01-01T00:00:00.000Z',
  accessed_at: '2026-01-02T00:00:00.000Z',
};

function renderHome() {
  const navigation = {
    addListener: jest.fn().mockReturnValue(jest.fn()),
    navigate: jest.fn(),
  };
  const screen = render(<HomeScreen navigation={navigation} />);
  return { screen, navigation };
}

function inputPorPlaceholder(screen, placeholder) {
  return screen.UNSAFE_getAllByType(TextInput).find((i) => i.props.placeholder === placeholder);
}

beforeEach(() => {
  jest.clearAllMocks();
  carregarMaterias.mockResolvedValue([materia]);
  toggleFixada.mockResolvedValue(undefined);
  getSessionUser.mockResolvedValue({ id: 1, email: 'a@b.com' });
  getUserById.mockResolvedValue({ id: 1, email: 'a@b.com', avatar: null });
});

describe('HomeScreen — fluxos de criar/editar/excluir (C1 + modais extraídos)', () => {
  test('criar matéria: BottomNav + abre modal, adiciona tópico e persiste', async () => {
    const nova = { id: 3, nome: 'História', topicos: [{ nome: 'Idade Média', estudado: false }], fixada: false, created_at: '2026-01-03T00:00:00.000Z', accessed_at: '2026-01-03T00:00:00.000Z' };
    criarMateria.mockResolvedValue(nova);

    const { screen } = renderHome();
    await waitFor(() => {
      expect(carregarMaterias).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByText('Adicionar'));
    expect(screen.getByText('Nova Matéria')).toBeTruthy();

    fireEvent.changeText(inputPorPlaceholder(screen, 'Ex: Matemática, Física...'), 'História');
    fireEvent.changeText(inputPorPlaceholder(screen, 'Ex: Álgebra Linear'), 'Idade Média');
    fireEvent.press(screen.getAllByText('+')[1]);
    expect(screen.getByText('Idade Média')).toBeTruthy();

    fireEvent.press(screen.getAllByText('Adicionar')[1]);

    await waitFor(() => {
      expect(criarMateria).toHaveBeenCalledWith(1, 'História', [{ nome: 'Idade Média', estudado: false }]);
    });
    expect(screen.getAllByText('História').length).toBeGreaterThan(0);
  });

  test('criar matéria com nome vazio: alerta e não persiste', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { screen } = renderHome();
    await waitFor(() => {
      expect(carregarMaterias).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByText('Adicionar'));
    fireEvent.press(screen.getAllByText('Adicionar')[1]);

    expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Digite o nome da matéria!');
    expect(criarMateria).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test('editar matéria: abre modal pelo card do histórico, salva nome e atualiza a lista', async () => {
    const { screen } = renderHome();
    await waitFor(() => {
      expect(screen.getAllByText('Matemática').length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getAllByText('Matemática')[0]);
    expect(screen.getByText('Editar Matemática')).toBeTruthy();

    fireEvent.changeText(inputPorPlaceholder(screen, 'Ex: Matemática, Física...'), 'Matemática II');
    fireEvent.press(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(atualizarMateria).toHaveBeenCalledWith(1, 1, {
        nome: 'Matemática II',
        topicos: [{ nome: 'Álgebra', estudado: false }],
      });
    });
    expect(screen.queryByText('Editar Matemática')).toBeNull();
    expect(screen.getAllByText('Matemática II').length).toBeGreaterThan(0);
  });

  test('excluir matéria: confirmação via Alert chama deletarMateria e remove o card', async () => {
    deletarMateria.mockResolvedValue(undefined);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { screen } = renderHome();
    await waitFor(() => {
      expect(screen.getAllByText('Matemática').length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getAllByText('Matemática')[0]);
    fireEvent.press(screen.getByText('Excluir Matéria'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Confirmar exclusão',
      'Esta matéria será removida de todas as seções.',
      expect.any(Array)
    );
    const buttons = alertSpy.mock.calls[0][2];
    const excluir = buttons.find((b) => b.text === 'Excluir');
    await act(async () => {
      excluir.onPress();
    });

    expect(deletarMateria).toHaveBeenCalledWith(1, 1);
    expect(screen.queryByText('Matemática')).toBeNull();
    expect(screen.getByText('Nenhuma matéria adicionada ainda.')).toBeTruthy();
    alertSpy.mockRestore();
  });

  test('erro ao carregar matérias: loga sem crashar a tela', async () => {
    carregarMaterias.mockRejectedValue(new Error('db falhou'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { screen } = renderHome();
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Erro ao carregar home:', expect.any(Error));
    });

    expect(screen.getByText('SEU PROGRESSO')).toBeTruthy();
    errorSpy.mockRestore();
  });
});
