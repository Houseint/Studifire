import React from 'react';
import { TextInput } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../src/features/auth/authDb', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
}));

jest.mock('../src/hooks/useThemedAlert', () => ({
  useThemedAlert: () => ({
    alertConfig: null,
    showAlert: jest.fn(),
    hideAlert: jest.fn(),
  }),
}));

import { registerUser, loginUser } from '../src/features/auth/authDb';
import { useThemedAlert } from '../src/hooks/useThemedAlert';

const RegisterScreen = require('../src/screens/RegisterScreen').default;
const LoginScreen = require('../src/screens/LoginScreen').default;

describe('0.20 - Telas de autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RegisterScreen', () => {
    function renderRegister(navigation = { navigate: jest.fn() }) {
      const screen = render(<RegisterScreen navigation={navigation} />);
      const inputs = screen.UNSAFE_getAllByType(TextInput);
      return { screen, inputs, navigation };
    }

    test('campos vazios: alerta e não chama registerUser', async () => {
      const { screen, navigation } = renderRegister();
      fireEvent.press(screen.getByText('Cadastrar'));

      expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Atenção',
          message: 'Preencha todos os campos.',
        })
      );
      expect(registerUser).not.toHaveBeenCalled();
      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    test('senha curta: alerta de mínimo de 6 caracteres', async () => {
      const { screen, inputs } = renderRegister();
      fireEvent.changeText(inputs[0], 'a@b.com');
      fireEvent.changeText(inputs[1], '12345');
      fireEvent.changeText(inputs[2], '12345');
      fireEvent.press(screen.getByText('Cadastrar'));

      expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Atenção',
          message: 'A senha deve ter pelo menos 6 caracteres.',
        })
      );
      expect(registerUser).not.toHaveBeenCalled();
    });

    test('senhas diferentes: alerta de não conferência', async () => {
      const { screen, inputs } = renderRegister();
      fireEvent.changeText(inputs[0], 'a@b.com');
      fireEvent.changeText(inputs[1], 'senha123');
      fireEvent.changeText(inputs[2], 'senha456');
      fireEvent.press(screen.getByText('Cadastrar'));

      expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Atenção',
          message: 'As senhas não conferem.',
        })
      );
      expect(registerUser).not.toHaveBeenCalled();
    });

    test('sucesso: navega para Login com alerta de sucesso', async () => {
      registerUser.mockResolvedValue(undefined);
      const { screen, inputs, navigation } = renderRegister();
      fireEvent.changeText(inputs[0], 'novo@b.com');
      fireEvent.changeText(inputs[1], 'senha123');
      fireEvent.changeText(inputs[2], 'senha123');
      fireEvent.press(screen.getByText('Cadastrar'));

      await waitFor(() => {
        expect(registerUser).toHaveBeenCalledWith('novo@b.com', 'senha123');
      });
      expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sucesso',
          message: 'Conta criada com sucesso!',
        })
      );
      expect(navigation.navigate).toHaveBeenCalledWith('Login');
    });

    test('EMAIL_EXISTS: alerta de e-mail já cadastrado', async () => {
      registerUser.mockRejectedValue({ code: 'EMAIL_EXISTS' });
      const { screen, inputs } = renderRegister();
      fireEvent.changeText(inputs[0], 'dup@b.com');
      fireEvent.changeText(inputs[1], 'senha123');
      fireEvent.changeText(inputs[2], 'senha123');
      fireEvent.press(screen.getByText('Cadastrar'));

      await waitFor(() => {
        expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Atenção',
            message: 'Este e-mail já está cadastrado.',
          })
        );
      });
    });

    test('DB_UNAVAILABLE: alerta de conexão com o banco', async () => {
      registerUser.mockRejectedValue({ code: 'DB_UNAVAILABLE' });
      const { screen, inputs } = renderRegister();
      fireEvent.changeText(inputs[0], 'x@b.com');
      fireEvent.changeText(inputs[1], 'senha123');
      fireEvent.changeText(inputs[2], 'senha123');
      fireEvent.press(screen.getByText('Cadastrar'));

      await waitFor(() => {
        expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            message: 'Não foi possível conectar ao banco de dados. Tente novamente.',
          })
        );
      });
    });

    test('erro genérico: alerta padrão e loga o erro real', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      registerUser.mockRejectedValue(new Error('erro misterioso'));
      const { screen, inputs } = renderRegister();
      fireEvent.changeText(inputs[0], 'x@b.com');
      fireEvent.changeText(inputs[1], 'senha123');
      fireEvent.changeText(inputs[2], 'senha123');
      fireEvent.press(screen.getByText('Cadastrar'));

      await waitFor(() => {
        expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            message: 'Não foi possível cadastrar agora. Tente novamente.',
          })
        );
      });
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('LoginScreen', () => {
    function renderLogin(navigation = { reset: jest.fn(), navigate: jest.fn() }) {
      const screen = render(<LoginScreen navigation={navigation} />);
      const inputs = screen.UNSAFE_getAllByType(TextInput);
      return { screen, inputs, navigation };
    }

    test('campos vazios: alerta e não chama loginUser', async () => {
      const { screen, navigation } = renderLogin();
      fireEvent.press(screen.getByText('Entrar'));

      expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Atenção',
          message: 'Preencha e-mail e senha.',
        })
      );
      expect(loginUser).not.toHaveBeenCalled();
      expect(navigation.reset).not.toHaveBeenCalled();
    });

    test('credenciais inválidas: alerta de e-mail ou senha incorretos', async () => {
      loginUser.mockResolvedValue(null);
      const { screen, inputs, navigation } = renderLogin();
      fireEvent.changeText(inputs[0], 'errado@b.com');
      fireEvent.changeText(inputs[1], 'senhaErrada');
      fireEvent.press(screen.getByText('Entrar'));

      await waitFor(() => {
        expect(loginUser).toHaveBeenCalledWith('errado@b.com', 'senhaErrada');
      });
      expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Login inválido',
          message: 'E-mail ou senha incorretos.',
        })
      );
      expect(navigation.reset).not.toHaveBeenCalled();
    });

    test('sucesso: reset para Home', async () => {
      loginUser.mockResolvedValue({ id: 1, email: 'ok@b.com' });
      const { screen, inputs, navigation } = renderLogin();
      fireEvent.changeText(inputs[0], 'ok@b.com');
      fireEvent.changeText(inputs[1], 'senha123');
      fireEvent.press(screen.getByText('Entrar'));

      await waitFor(() => {
        expect(navigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      });
    });

test('erro no login: alerta genérico', async () => {
      loginUser.mockRejectedValue(new Error('falha'));
      const { screen, inputs, navigation } = renderLogin();
      fireEvent.changeText(inputs[0], 'x@b.com');
      fireEvent.changeText(inputs[1], 'senha123');
      fireEvent.press(screen.getByText('Entrar'));

      await waitFor(() => {
        expect(useThemedAlert().showAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            message: 'Não foi possível fazer login agora. Tente novamente.',
          })
        );
      });
    });
  });
});
      expect(navigation.reset).not.toHaveBeenCalled();
    });
  });
});