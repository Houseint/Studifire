import React from 'react';
import { TextInput } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

const CustomButton = require('../src/components/common/CustomButton').default;
const CustomInput = require('../src/components/common/CustomInput').default;

describe('0.21 - Componentes comuns (smoke tests)', () => {
  describe('CustomButton', () => {
    test('renderiza o título e dispara onPress', () => {
      const onPress = jest.fn();
      const { getByText } = render(<CustomButton title="Salvar" onPress={onPress} />);

      fireEvent.press(getByText('Salvar'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('disabled bloqueia o onPress', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <CustomButton title="Salvar" onPress={onPress} disabled />
      );

      fireEvent.press(getByText('Salvar'));
      expect(onPress).not.toHaveBeenCalled();
    });

    test('aceita gradientColors e textStyle customizados', () => {
      const { getByText } = render(
        <CustomButton
          title="Custom"
          onPress={() => {}}
          gradientColors={['#111', '#222']}
          textStyle={{ fontSize: 20 }}
        />
      );
      expect(getByText('Custom')).toBeTruthy();
    });
  });

  describe('CustomInput', () => {
    test('renderiza label e valor, e propaga onChangeText', () => {
      const onChangeText = jest.fn();
      const { getByText, UNSAFE_getAllByType } = render(
        <CustomInput label="E-mail" value="a@b.com" onChangeText={onChangeText} />
      );

      expect(getByText('E-mail')).toBeTruthy();
      const input = UNSAFE_getAllByType(TextInput)[0];
      expect(input.props.value).toBe('a@b.com');

      fireEvent.changeText(input, 'novo@b.com');
      expect(onChangeText).toHaveBeenCalledWith('novo@b.com');
    });

    test('sem label não renderiza texto de label', () => {
      const { queryByText } = render(
        <CustomInput value="x" onChangeText={() => {}} />
      );
      expect(queryByText('E-mail')).toBeNull();
    });

    test('secureTextEntry é propagado para o TextInput', () => {
      const { UNSAFE_getAllByType } = render(
        <CustomInput label="Senha" value="123" onChangeText={() => {}} secureTextEntry />
      );
      const input = UNSAFE_getAllByType(TextInput)[0];
      expect(input.props.secureTextEntry).toBe(true);
    });
  });
});