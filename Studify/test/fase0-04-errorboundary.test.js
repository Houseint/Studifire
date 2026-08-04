import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '../src/components/ErrorBoundary';

function BomFilho() {
  return <Text>conteúdo normal</Text>;
}

function FilhoQueExplode() {
  throw new Error('boom simulado');
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

test('renderiza os filhos normalmente quando não há erro', () => {
  const { getByText } = render(
    <ErrorBoundary>
      <BomFilho />
    </ErrorBoundary>
  );
  expect(getByText('conteúdo normal')).toBeTruthy();
});

test('mostra fallback em vez de crashar quando um filho lança erro', () => {
  const { getByText, queryByText } = render(
    <ErrorBoundary>
      <FilhoQueExplode />
    </ErrorBoundary>
  );
  expect(getByText('Algo deu errado')).toBeTruthy();
  expect(queryByText('conteúdo normal')).toBeNull();
});

test('botão "Tentar novamente" reseta o boundary', () => {
  let explosao = true;
  function FilhoCondicional() {
    if (explosao) throw new Error('boom');
    return <Text>recuperado</Text>;
  }

  const { getByText, queryByText } = render(
    <ErrorBoundary>
      <FilhoCondicional />
    </ErrorBoundary>
  );
  expect(getByText('Algo deu errado')).toBeTruthy();

  explosao = false;
  fireEvent.press(getByText('Tentar novamente'));

  expect(queryByText('Algo deu errado')).toBeNull();
  expect(getByText('recuperado')).toBeTruthy();
});
