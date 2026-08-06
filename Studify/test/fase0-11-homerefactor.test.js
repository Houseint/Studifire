import React, { useState } from 'react';
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
  pickTheme,
  isUrgent,
  calcProgress,
  filterRevisados,
  getEstaFixada,
  calcGlobalStats,
  renderTopicoInput,
} from '../src/components/home/helpers';
import HomeHeader from '../src/components/home/HomeHeader';
import ProgressCards from '../src/components/home/ProgressCards';
import MateriaSections from '../src/components/home/MateriaSections';
import BottomNav from '../src/components/home/BottomNav';
import CreateMateriaModal from '../src/components/home/modals/CreateMateriaModal';
import EditMateriaModal from '../src/components/home/modals/EditMateriaModal';

import { carregarMaterias, toggleFixada } from '../src/services/subjectsDb';
import { getSessionUser, getUserById } from '../src/services/authDb';

const HomeScreen = require('../src/screens/HomeScreen').default;

const materiaNaoFixada = {
  id: 1,
  nome: 'Matemática',
  topicos: [
    { nome: 'Álgebra', estudado: true },
    { nome: 'Geometria', estudado: false },
  ],
  fixada: false,
  created_at: '2026-01-01T00:00:00.000Z',
  accessed_at: '2026-01-02T00:00:00.000Z',
};

const materiaFixada = {
  id: 2,
  nome: 'Física',
  topicos: [{ nome: 'Cinemática', estudado: false }],
  fixada: true,
  created_at: '2026-01-01T00:00:00.000Z',
  accessed_at: '2026-01-01T00:00:00.000Z',
};

describe('helpers da HomeScreen (funções puras extraídas)', () => {
  test('pickTheme: índice estável por id (mod 4) e seguro para id ausente', () => {
    expect(pickTheme({ id: 0 })).toEqual(pickTheme({ id: 4 }));
    expect(pickTheme({ id: 4 })).toEqual({
      backgroundColor: '#151C45', borderColor: '#2D3C84', pinBg: '#212D66', progress: '#5B7CFF',
    });
    expect(pickTheme({ id: 3 })).toEqual({
      backgroundColor: '#3A2A17', borderColor: '#6A4B1F', pinBg: '#51381A', progress: '#F59E0B',
    });
    expect(pickTheme({ id: -1 })).toEqual(pickTheme({ id: 1 }));
    expect(pickTheme(undefined)).toEqual(pickTheme({ id: 0 }));
  });

  test('isUrgent: detecta urgente/hoje/prazo no nome ou descrição', () => {
    expect(isUrgent({ nome: 'Trabalho hoje' })).toBe(true);
    expect(isUrgent({ nome: 'Matéria', descricao: 'entrega prazo' })).toBe(true);
    expect(isUrgent({ nome: 'URGENTE' })).toBe(true);
    expect(isUrgent({ nome: 'Física' })).toBe(false);
    expect(isUrgent(undefined)).toBe(false);
  });

  test('calcProgress: proporção de tópicos estudados, 0 quando vazio', () => {
    expect(calcProgress(materiaNaoFixada.topicos)).toBe(0.5);
    expect(calcProgress([])).toBe(0);
    expect(calcProgress(undefined)).toBe(0);
    expect(calcProgress([{ estudado: true }, { estudado: true }])).toBe(1);
  });

  test('filterRevisados: busca por nome e por tópico, case-insensitive', () => {
    const lista = [materiaNaoFixada, materiaFixada];
    expect(filterRevisados(lista, 'mat')).toHaveLength(1);
    expect(filterRevisados(lista, 'cinem')).toHaveLength(1);
    expect(filterRevisados(lista, '')).toHaveLength(2);
    expect(filterRevisados(lista, 'nada')).toHaveLength(0);
  });

  test('getEstaFixada: confere ownership por id na lista de fixados', () => {
    expect(getEstaFixada([materiaFixada], materiaFixada)).toBe(true);
    expect(getEstaFixada([materiaFixada], materiaNaoFixada)).toBe(false);
    expect(getEstaFixada([], materiaFixada)).toBe(false);
  });

  test('calcGlobalStats: soma tópicos e concluídos de revisados + fixados', () => {
    expect(calcGlobalStats([materiaNaoFixada], [materiaFixada])).toEqual({
      totalTopicos: 3,
      concluidos: 1,
    });
    expect(calcGlobalStats([], [])).toEqual({ totalTopicos: 0, concluidos: 0 });
  });

  test('renderTopicoInput: mostra contador, adiciona chip e remove ao pressionar ✕', () => {
    const fakeStyles = {
      modalLabel: {}, topicoInputRow: {}, modalInput: {}, topicoInputField: {},
      topicoAddBtn: {}, topicoAddBtnDisabled: {}, topicoAddBtnText: {},
      topicoChipsContainer: {}, topicoChip: {}, topicoChipText: {},
      topicoChipRemove: {}, topicoChipRemoveText: {},
    };
    const setList = jest.fn();
    const onAdd = jest.fn();
    const screen = render(
      renderTopicoInput({
        value: 'Novo',
        onChangeText: jest.fn(),
        onAdd,
        list: [{ nome: 'Álgebra' }],
        setList,
        max: 3,
        styles: fakeStyles,
      })
    );

    expect(screen.getByText('Tópicos (1/3)')).toBeTruthy();
    expect(screen.getByText('Álgebra')).toBeTruthy();

    fireEvent.press(screen.getByText('+'));
    expect(onAdd).toHaveBeenCalled();

    fireEvent.press(screen.getAllByText('✕')[0]);
    expect(setList).toHaveBeenCalledWith(expect.any(Function));
  });
});

describe('HomeHeader (extraído)', () => {
  test('mostra iniciais do email e dispara navegação', () => {
    const onProfilePress = jest.fn();
    const onHelpPress = jest.fn();
    const screen = render(
      <HomeHeader
        user={{ email: 'joao@x.com' }}
        userAvatar={null}
        onProfilePress={onProfilePress}
        onHelpPress={onHelpPress}
      />
    );

    expect(screen.getByText('J')).toBeTruthy();
    expect(screen.getByText('joao')).toBeTruthy();

    fireEvent.press(screen.getByText('Bom dia ☀'));
    expect(onProfilePress).toHaveBeenCalled();
    fireEvent.press(screen.getByText('❓'));
    expect(onHelpPress).toHaveBeenCalled();
  });

  test('sem usuário mostra placeholder', () => {
    const screen = render(<HomeHeader user={null} onProfilePress={jest.fn()} onHelpPress={jest.fn()} />);
    expect(screen.getByText('US')).toBeTruthy();
    expect(screen.getByText('Carregando...')).toBeTruthy();
  });
});

describe('ProgressCards (extraído)', () => {
  test('calcula percentual global e contadores', () => {
    const screen = render(
      <ProgressCards historico={[materiaNaoFixada]} revisados={[materiaNaoFixada]} fixados={[materiaFixada]} busca="" />
    );

    expect(screen.getByText('SEU PROGRESSO')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('33%')).toBeTruthy();
    expect(screen.getByText('1/3 tópicos')).toBeTruthy();
  });

  test('sem matérias mostra 0%', () => {
    const screen = render(<ProgressCards historico={[]} revisados={[]} fixados={[]} busca="" />);
    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('0/0 tópicos')).toBeTruthy();
  });
});

describe('MateriaSections (extraído)', () => {
  const nav = { navigate: jest.fn() };
  const getFixada = (m) => m.fixada;

  test('estados vazios das três seções', () => {
    const screen = render(
      <MateriaSections
        historico={[]} revisadosFiltrados={[]} fixados={[]}
        getEstaFixada={getFixada} onCardPress={jest.fn()} onAcesso={jest.fn()}
        onPinPress={jest.fn()} navigation={nav} busca=""
      />
    );

    expect(screen.getByText('ULTIMOS ACESSADOS')).toBeTruthy();
    expect(screen.getByText('Nenhum conteúdo acessado ainda.')).toBeTruthy();
    expect(screen.getByText('PARA REVISAR')).toBeTruthy();
    expect(screen.getByText('Nenhuma matéria adicionada ainda.')).toBeTruthy();
    expect(screen.getByText('FIXADOS')).toBeTruthy();
    expect(screen.getByText('Fixe uma matéria clicando no pin.')).toBeTruthy();
  });

  test('busca sem resultado altera a mensagem', () => {
    const screen = render(
      <MateriaSections
        historico={[]} revisadosFiltrados={[]} fixados={[]}
        getEstaFixada={getFixada} onCardPress={jest.fn()} onAcesso={jest.fn()}
        onPinPress={jest.fn()} navigation={nav} busca="xyz"
      />
    );
    expect(screen.getByText('Nenhuma matéria encontrada.')).toBeTruthy();
  });

  test('renderiza cards e navega para Detail ao pressionar', () => {
    const onAcesso = jest.fn();
    const onPinPress = jest.fn();
    const screen = render(
      <MateriaSections
        historico={[]}
        revisadosFiltrados={[materiaNaoFixada]}
        fixados={[materiaFixada]}
        getEstaFixada={getFixada}
        onCardPress={jest.fn()}
        onAcesso={onAcesso}
        onPinPress={onPinPress}
        navigation={nav}
        busca=""
      />
    );

    fireEvent.press(screen.getByText('Matemática'));
    expect(nav.navigate).toHaveBeenCalledWith('Detail', { id: 1 });
    expect(onAcesso).toHaveBeenCalledWith(materiaNaoFixada);

    fireEvent.press(screen.getByText('Física'));
    expect(nav.navigate).toHaveBeenCalledWith('Detail', { id: 2 });
    expect(onAcesso).toHaveBeenCalledWith(materiaFixada);
  });

  test('histórico usa onCardPress sem navegação própria', () => {
    const onCardPress = jest.fn();
    const screen = render(
      <MateriaSections
        historico={[materiaNaoFixada]}
        revisadosFiltrados={[]}
        fixados={[]}
        getEstaFixada={getFixada}
        onCardPress={onCardPress}
        onAcesso={jest.fn()}
        onPinPress={jest.fn()}
        navigation={nav}
        busca=""
      />
    );
    fireEvent.press(screen.getByText('Matemática'));
    expect(onCardPress).toHaveBeenCalledWith(materiaNaoFixada);
  });
});

describe('BottomNav (extraído)', () => {
  test('navega para as rotas e dispara onAddPress', () => {
    const nav = { navigate: jest.fn() };
    const onAddPress = jest.fn();
    const screen = render(<BottomNav navigation={nav} onAddPress={onAddPress} />);

    fireEvent.press(screen.getByText('Início'));
    expect(nav.navigate).toHaveBeenCalledWith('Home');

    fireEvent.press(screen.getByText('IA'));
    expect(nav.navigate).toHaveBeenCalledWith('Chat');

    fireEvent.press(screen.getByText('Progresso'));
    expect(nav.navigate).toHaveBeenCalledWith('Historic');

    fireEvent.press(screen.getByText('Perfil'));
    expect(nav.navigate).toHaveBeenCalledWith('Profile');

    fireEvent.press(screen.getByText('Adicionar'));
    expect(onAddPress).toHaveBeenCalled();
  });

  test('sem navigation não quebra', () => {
    const screen = render(<BottomNav navigation={null} onAddPress={jest.fn()} />);
    fireEvent.press(screen.getByText('IA'));
    expect(screen.getByText('IA')).toBeTruthy();
  });
});

describe('CreateMateriaModal (extraído)', () => {
  test('adiciona tópico e submete', () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const setTopicoInput = jest.fn();
    const setNovosTopicos = jest.fn();
    const screen = render(
      <CreateMateriaModal
        visible
        onClose={onClose}
        onSubmit={onSubmit}
        novaMateria="História"
        setNovaMateria={jest.fn()}
        novosTopicos={[]}
        setNovosTopicos={setNovosTopicos}
        topicoInput="Idade Média"
        setTopicoInput={setTopicoInput}
      />
    );

    expect(screen.getByText('Nova Matéria')).toBeTruthy();
    fireEvent.press(screen.getByText('+'));
    expect(setNovosTopicos).toHaveBeenCalledWith(expect.any(Function));
    expect(setTopicoInput).toHaveBeenCalledWith('');

    fireEvent.press(screen.getByText('Adicionar'));
    expect(onSubmit).toHaveBeenCalled();
  });

  test('botão + no limite de tópicos não adiciona mais', () => {
    const list = Array.from({ length: 3 }, (_, i) => ({ nome: `T${i}`, estudado: false }));
    const setNovosTopicos = jest.fn();
    const screen = render(
      <CreateMateriaModal
        visible
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        novaMateria=""
        setNovaMateria={jest.fn()}
        novosTopicos={list}
        setNovosTopicos={setNovosTopicos}
        topicoInput="x"
        setTopicoInput={jest.fn()}
        MAX_TOPICOS={3}
      />
    );

    expect(screen.getByText('Tópicos (3/3)')).toBeTruthy();
    expect(screen.getAllByText('✕')).toHaveLength(4);

    fireEvent.press(screen.getByText('+'));
    expect(setNovosTopicos).not.toHaveBeenCalled();
  });
});

describe('EditMateriaModal (extraído)', () => {
  test('salva alterações e confirma exclusão via Alert', () => {
    const onSave = jest.fn();
    const onDelete = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const screen = render(
      <EditMateriaModal
        visible
        onClose={jest.fn()}
        materia={materiaNaoFixada}
        onSave={onSave}
        onDelete={onDelete}
        editNome="Matemática II"
        setEditNome={jest.fn()}
        editTopicos={[]}
        setEditTopicos={jest.fn()}
        editTopicoInput=""
        setEditTopicoInput={jest.fn()}
      />
    );

    expect(screen.getByText('Editar Matemática')).toBeTruthy();

    fireEvent.press(screen.getByText('Salvar Alterações'));
    expect(onSave).toHaveBeenCalled();

    fireEvent.press(screen.getByText('Excluir Matéria'));
    expect(alertSpy).toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0][2];
    const excluir = buttons.find((b) => b.text === 'Excluir');
    act(() => {
      excluir.onPress();
    });
    expect(onDelete).toHaveBeenCalledWith(1);
    alertSpy.mockRestore();
  });
});

describe('HomeScreen — A1: focus listener e seções extraídas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    carregarMaterias.mockResolvedValue([materiaNaoFixada, materiaFixada]);
    toggleFixada.mockResolvedValue(undefined);
    getSessionUser.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getUserById.mockResolvedValue({ id: 1, email: 'a@b.com', avatar: null });
  });

  function renderHome() {
    const navigation = {
      addListener: jest.fn().mockReturnValue(jest.fn()),
      navigate: jest.fn(),
    };
    const screen = render(<HomeScreen navigation={navigation} />);
    return { screen, navigation };
  }

  test('registra listener de focus e carrega dados na montagem', async () => {
    const { screen, navigation } = renderHome();

    expect(navigation.addListener).toHaveBeenCalledWith('focus', expect.any(Function));
    await waitFor(() => {
      expect(carregarMaterias).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText('SEU PROGRESSO')).toBeTruthy();
    expect(screen.getAllByText('Matemática')).toHaveLength(2);
    expect(screen.getAllByText('Física')).toHaveLength(2);
  });

  test('evento focus recarrega os dados (regressão de volta à tela)', async () => {
    const { navigation } = renderHome();
    await waitFor(() => {
      expect(carregarMaterias).toHaveBeenCalledTimes(1);
    });

    const focusHandler = navigation.addListener.mock.calls[0][1];
    await act(async () => {
      focusHandler();
    });

    expect(carregarMaterias).toHaveBeenCalledTimes(2);
  });

  test('unmount remove o listener', async () => {
    const { screen, navigation } = renderHome();
    await waitFor(() => {
      expect(carregarMaterias).toHaveBeenCalledTimes(1);
    });

    const unsub = navigation.addListener.mock.results[0].value;
    screen.unmount();
    expect(unsub).toHaveBeenCalled();
  });

  test('estado vazio renderiza mensagens das seções', async () => {
    carregarMaterias.mockResolvedValue([]);
    const { screen } = renderHome();
    await waitFor(() => {
      expect(screen.getByText('Nenhuma matéria adicionada ainda.')).toBeTruthy();
    });
    expect(screen.getByText('Nenhum conteúdo acessado ainda.')).toBeTruthy();
    expect(screen.getByText('Fixe uma matéria clicando no pin.')).toBeTruthy();
  });

  test('busca filtra a seção PARA REVISAR mas mantém histórico', async () => {
    const { screen } = renderHome();
    await waitFor(() => {
      expect(screen.getAllByText('Matemática')).toHaveLength(2);
    });

    const input = screen.UNSAFE_getAllByType(TextInput).find((i) => i.props.placeholder === 'Pesquisar conteúdos...');
    fireEvent.changeText(input, 'fís');

    expect(screen.getAllByText('Física')).toHaveLength(2);
    expect(screen.getAllByText('Matemática')).toHaveLength(1);
    expect(screen.getByText('Nenhuma matéria encontrada.')).toBeTruthy();
  });
});
