import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(),
  getRandomBytesAsync: jest.fn(),
  encoding: { Base64: { encode: jest.fn() } },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

describe('0.16 - Plano básico (M5 + L1 + L2 + L3)', () => {
  describe('M5 - getSessionUser valida shape e limpa storage corrompido', () => {
    let getSessionUser;
    let setSessionUser;

    beforeEach(() => {
      AsyncStorage.clear();
      jest.isolateModules(() => {
        const authDb = require('../src/services/authDb');
        getSessionUser = authDb.getSessionUser;
        setSessionUser = authDb.setSessionUser;
      });
    });

    test('sem sessão salva retorna null', async () => {
      expect(await getSessionUser()).toBeNull();
    });

    test('setSessionUser/getSessionUser fazem roundtrip com sessão válida', async () => {
      await setSessionUser({ id: 5, email: 'x@y.com' });
      expect(await getSessionUser()).toEqual({ id: 5, email: 'x@y.com' });
      expect(await AsyncStorage.getItem('studify_session')).toBe(
        JSON.stringify({ id: 5, email: 'x@y.com' })
      );
    });

    test('JSON corrompido: remove do storage e retorna null', async () => {
      await AsyncStorage.setItem('studify_session', '{not-json!!');

      expect(await getSessionUser()).toBeNull();
      expect(await AsyncStorage.getItem('studify_session')).toBeNull();
      expect(await AsyncStorage.getAllKeys()).toEqual([]);
    });

    test('JSON "null" literal: shape inválido, remove e retorna null', async () => {
      await AsyncStorage.setItem('studify_session', 'null');

      expect(await getSessionUser()).toBeNull();
      expect(await AsyncStorage.getItem('studify_session')).toBeNull();
      expect(await AsyncStorage.getAllKeys()).toEqual([]);
    });

    test('id como string: shape inválido, remove e retorna null', async () => {
      await AsyncStorage.setItem('studify_session', '{"id":"1","email":"a@b.com"}');

      expect(await getSessionUser()).toBeNull();
      expect(await AsyncStorage.getItem('studify_session')).toBeNull();
      expect(await AsyncStorage.getAllKeys()).toEqual([]);
    });

    test('sem email: shape inválido, remove e retorna null', async () => {
      await AsyncStorage.setItem('studify_session', '{"id":1}');

      expect(await getSessionUser()).toBeNull();
      expect(await AsyncStorage.getItem('studify_session')).toBeNull();
      expect(await AsyncStorage.getAllKeys()).toEqual([]);
    });

    test('array em vez de objeto: shape inválido, remove e retorna null', async () => {
      await AsyncStorage.setItem('studify_session', '[1,2,3]');

      expect(await getSessionUser()).toBeNull();
      expect(await AsyncStorage.getItem('studify_session')).toBeNull();
      expect(await AsyncStorage.getAllKeys()).toEqual([]);
    });
  });

  describe('L1 - HelpScreen usa HELP_LINKS de constants', () => {
    let openUrlSpy;

    beforeEach(() => {
      openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    });

    afterEach(() => {
      openUrlSpy.mockRestore();
    });

    test('HelpScreen não tem mais URLs hardcoded no fonte', () => {
      const source = require('fs').readFileSync(
        require('path').join(__dirname, '..', 'src', 'screens', 'HelpScreen.js'),
        'utf8'
      );
      expect(source).toMatch(/import \{ HELP_LINKS \} from '\.\.\/constants\/helpLinks'/);
      expect(source).not.toMatch(/https:\/\//);
    });

    test('constant HELP_LINKS tem 7 links com url válida', () => {
      const { HELP_LINKS } = require('../src/constants/helpLinks');
      expect(HELP_LINKS).toHaveLength(7);
      for (const link of HELP_LINKS) {
        expect(link.url).toMatch(/^https:\/\/.+\./);
        expect(link.nome).toBeTruthy();
        expect(link.desc).toBeTruthy();
      }
    });

    test('abrir seção LINKS ÚTEIS renderiza links e toque chama Linking.openURL', async () => {
      const { HELP_LINKS } = require('../src/constants/helpLinks');
      const HelpScreen = require('../src/screens/HelpScreen').default;

      const screen = render(<HelpScreen navigation={{ goBack: jest.fn() }} />);

      fireEvent.press(screen.getByText('LINKS ÚTEIS'));

      await waitFor(() => {
        expect(screen.getByText(HELP_LINKS[0].nome)).toBeTruthy();
      });

      fireEvent.press(screen.getByText(HELP_LINKS[3].nome));

      await waitFor(() => {
        expect(openUrlSpy).toHaveBeenCalledWith(HELP_LINKS[3].url);
      });
    });
  });

  describe('L2 - estilos inline movidos para StyleSheet', () => {
    const SCREENS = [
      'src/screens/LoginScreen.js',
      'src/screens/RegisterScreen.js',
      'src/features/profile/ProfileScreen.js',
      'src/screens/HistoricScreen.js',
    ];

    test.each(SCREENS)('%s não contém style inline ({...)', (relPath) => {
      const source = require('fs').readFileSync(
        require('path').join(__dirname, '..', relPath),
        'utf8'
      );
      expect(source).not.toMatch(/style=\{\{/);
    });

    test('AuthScreenStyles exporta as chaves usadas no refactor', () => {
      const { AuthScreenStyles } = require('../src/styles/AuthScreenStyles');
      expect(AuthScreenStyles.formWrap).toBeTruthy();
      expect(AuthScreenStyles.inputGroup).toBeTruthy();
      expect(AuthScreenStyles.authButton).toBeTruthy();
      expect(AuthScreenStyles.authButtonText).toBeTruthy();
      expect(AuthScreenStyles.footer).toBeTruthy();
      expect(AuthScreenStyles.footerText).toBeTruthy();
      expect(AuthScreenStyles.footerLink).toBeTruthy();
      expect(AuthScreenStyles.registerLogo).toBeTruthy();
    });

    test('ProfileScreenStyles exporta as chaves usadas no refactor', () => {
      const { ProfileScreenStyles } = require('../src/styles/ProfileScreenStyles');
      expect(ProfileScreenStyles.scrollView).toBeTruthy();
      expect(ProfileScreenStyles.flameEmoji).toBeTruthy();
      expect(ProfileScreenStyles.buttonEmoji).toBeTruthy();
    });

    test('LoginScreen renderiza após o refactor de estilos', () => {
      const LoginScreen = require('../src/screens/LoginScreen').default;
      const screen = render(<LoginScreen navigation={{ navigate: jest.fn(), reset: jest.fn() }} />);
      expect(screen.getByText('Entrar')).toBeTruthy();
    });

    test('RegisterScreen renderiza após o refactor de estilos', () => {
      const RegisterScreen = require('../src/screens/RegisterScreen').default;
      const screen = render(<RegisterScreen navigation={{ navigate: jest.fn() }} />);
      expect(screen.getByText('Cadastrar')).toBeTruthy();
    });
  });

  describe('L3 - fase0-09 sem asserts de tempo (Opção C)', () => {
    test('mantém EXPLAIN QUERY PLAN e remove medição de performance', () => {
      const source = require('fs').readFileSync(
        require('path').join(__dirname, 'fase0-09-indexes.test.js'),
        'utf8'
      );
      expect(source).toMatch(/EXPLAIN QUERY PLAN/);
      expect(source).toMatch(/USING INDEX idx_subjects_user_accessed/);
      expect(source).not.toMatch(/Date\.now/);
      expect(source).not.toMatch(/mediana/);
      expect(source).not.toMatch(/toBeLessThan\(/);
    });
  });
});
