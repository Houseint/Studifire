import React from 'react';
import { TextInput, Alert } from 'react-native';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';

jest.mock('../src/services/authDb', () => ({
  getSessionUser: jest.fn(),
  getUserById: jest.fn(),
  logoutUser: jest.fn(),
  loginUser: jest.fn(),
  atualizarAvatar: jest.fn(),
}));

import {
  getSessionUser,
  getUserById,
  logoutUser,
  loginUser,
} from '../src/services/authDb';

const App = require('../App').default;
const LoginScreen = require('../src/screens/LoginScreen').default;
const ProfileScreen = require('../src/screens/ProfileScreen').default;

beforeEach(() => {
  jest.clearAllMocks();
});

test('sem sessão salva: bootstrap vai para Login', async () => {
  getSessionUser.mockResolvedValue(null);

  const { findByText } = render(<App />);

  expect(await findByText('Entrar')).toBeTruthy();
  expect(logoutUser).not.toHaveBeenCalled();
});

test('sessão válida (usuário existe no DB): vai direto para Home sem reload', async () => {
  getSessionUser.mockResolvedValue({ id: 1, email: 'a@b.com' });
  getUserById.mockResolvedValue({ id: 1, email: 'a@b.com' });

  const { findByText } = render(<App />);

  expect(await findByText('SEU PROGRESSO')).toBeTruthy();
  expect(logoutUser).not.toHaveBeenCalled();
});

test('sessão inválida (usuário removido do DB): limpa sessão e vai para Login', async () => {
  getSessionUser.mockResolvedValue({ id: 999, email: 'x@y.com' });
  getUserById.mockResolvedValue(null);

  const { findByText } = render(<App />);

  expect(await findByText('Entrar')).toBeTruthy();
  expect(logoutUser).toHaveBeenCalledTimes(1);
});

test('falha no bootstrap: cai para Login sem crashar', async () => {
  getSessionUser.mockRejectedValue(new Error('async storage falhou'));

  const { findByText } = render(<App />);

  expect(await findByText('Entrar')).toBeTruthy();
});

describe('fluxo de sessão nas telas (sem reload do app)', () => {
  test('LoginScreen: login válido navega para Home via reset', async () => {
    loginUser.mockResolvedValue({ id: 1, email: 'a@b.com' });
    const navigation = { reset: jest.fn() };

    const screen = render(<LoginScreen navigation={navigation} />);
    const inputs = screen.UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], 'a@b.com');
    fireEvent.changeText(inputs[1], 'senha123');
    fireEvent.press(screen.getByText('Entrar'));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('a@b.com', 'senha123');
    });
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  });

  test('ProfileScreen: confirmar logout navega para Login via reset', async () => {
    getSessionUser.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getUserById.mockResolvedValue({ id: 1, email: 'a@b.com' });
    logoutUser.mockResolvedValue(undefined);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { reset: jest.fn(), goBack: jest.fn(), navigate: jest.fn() };

    const { NavigationContainer } = require('@react-navigation/native');
    const screen = render(
      <NavigationContainer>
        <ProfileScreen navigation={navigation} />
      </NavigationContainer>
    );
    const sair = await screen.findByText('Sair da conta');
    await act(async () => {
      fireEvent.press(sair);
    });

    expect(alertSpy).toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0][2];
    const sairBtn = buttons.find((b) => b.text === 'Sair');
    await act(async () => {
      await sairBtn.onPress();
    });

    expect(logoutUser).toHaveBeenCalledTimes(1);
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }],
    });
    alertSpy.mockRestore();
  });
});
