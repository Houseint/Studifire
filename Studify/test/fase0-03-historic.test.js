test('0.3 - HistoricScreen compila e exporta componente válido', () => {
  const HistoricScreen = require('../src/screens/HistoricScreen').default;
  expect(typeof HistoricScreen).toBe('function');
  expect(HistoricScreen.name).toMatch(/HistoricScreen/);
});

test('0.3 - HistoricScreen usa React (React.useCallback disponível em escopo)', () => {
  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'src', 'screens', 'HistoricScreen.js'),
    'utf8'
  );
  expect(source).toMatch(/import React/);
  expect(source).toMatch(/React\.useCallback/);
});
