import React from 'react';
import { render } from '@testing-library/react-native';
import { getHomeStyles } from '../src/styles/screens/HomeScreenStyles';
import { getCardMateriaStyles } from '../src/styles/components/home/CardMateriaStyles';
import { getProgressCardsStyles } from '../src/styles/components/home/ProgressCardsStyles';
import { light, dark } from '../src/shared/theme/colors';
import { ThemeProvider } from '../src/shared/theme/ThemeContext';
import BottomNav from '../src/components/home/BottomNav';
import HomeHeader from '../src/components/home/HomeHeader';
import CardMateria, { pickTheme } from '../src/components/home/CardMateria';

describe('T4 — Home light: factories seguem a paleta', () => {
  test('fundo/busca da Home usam tokens (dark preservado, light claro)', () => {
    expect(getHomeStyles(dark).main.backgroundColor).toBe(dark.bg);
    expect(getHomeStyles(light).main.backgroundColor).toBe(light.bg);
    expect(getHomeStyles(light).buscaWrapper.backgroundColor).toBe(light.card);
  });

  test('trilhas de progresso ficam visíveis no light', () => {
    const trackDark = getCardMateriaStyles(dark).progressTrack.backgroundColor;
    const trackLight = getCardMateriaStyles(light).progressTrack.backgroundColor;
    expect(trackLight).not.toBe(trackDark);
  });

  test('cards roxo/laranja viram card claro com borda de identidade no light', () => {
    const s = getProgressCardsStyles(light);
    expect(s.progressoCardRoxo.backgroundColor).toBe(light.card);
    expect(s.progressoCardRoxo.borderColor).toBe(light.accent);
    expect(s.progressoCardLaranja.borderColor).toBe(light.warn);
    expect(s.progressoValor.color).toBe(light.text);
  });

  test('BottomNav e Header renderizam no provider light sem crash', () => {
    const nav = render(
      <ThemeProvider initialMode="light">
        <BottomNav navigation={{ navigate: jest.fn() }} onAddPress={jest.fn()} />
      </ThemeProvider>
    );
    expect(nav.getByText('Início')).toBeTruthy();
    expect(nav.getByText('Adicionar')).toBeTruthy();

    const header = render(
      <ThemeProvider initialMode="light">
        <HomeHeader user={{ email: 'a@b.com' }} userAvatar={null} onProfilePress={jest.fn()} onHelpPress={jest.fn()} />
      </ThemeProvider>
    );
    expect(header.getByText('Bom dia ☀')).toBeTruthy();
  });

  test('cards de matéria usam lilás claro no light (dark preservado)', () => {
    const tLight = pickTheme({ id: 1 }, 'light');
    const tDark = pickTheme({ id: 1 }, 'dark');
    expect(tLight.backgroundColor).not.toBe(tDark.backgroundColor);
    // lilás claro: fundo bem claro p/ texto marinho ficar legível
    expect(tLight.backgroundColor).toMatch(/^#([DE-F][0-9A-E]|F)/i);

    const card = render(
      <ThemeProvider initialMode="light">
        <CardMateria materia={{ id: 1, nome: 'Matemática', topicos: [] }} />
      </ThemeProvider>
    );
    expect(card.getByText('Matemática')).toBeTruthy();
  });
});
