import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { dark, light } from '../src/shared/theme/colors';
import { ThemeProvider } from '../src/shared/theme/ThemeContext';
import { getDetailStyles } from '../src/screens/DetailScreen';
import QuizModal, { getQuizModalStyles } from '../src/features/study/QuizModal';

jest.mock('../src/features/study/studyCoachService', () => ({
  getTopicAssist: jest.fn(),
  buildSearchUrl: jest.fn(() => 'https://exemplo.com'),
}));
const { getTopicAssist } = require('../src/features/study/studyCoachService');
const TopicCoachCard = require('../src/components/TopicCoachCard').default;

describe('T5 - Detail/Quiz light: factories reagem ao tema', () => {
  test('getDetailStyles: dark e light diferem (container, card, texto)', () => {
    const d = getDetailStyles(dark);
    const l = getDetailStyles(light);
    expect(d.container.backgroundColor).toBe(dark.bg);
    expect(l.container.backgroundColor).toBe(light.bg);
    expect(d.topicoRow.backgroundColor).toBe(dark.card);
    expect(l.topicoRow.backgroundColor).toBe(light.card);
    expect(d.topicoLabel.color).toBe(dark.text);
    expect(l.topicoLabel.color).toBe(light.text);
  });

  test('getQuizModalStyles: card e revisão seguem o tema', () => {
    const d = getQuizModalStyles(dark);
    const l = getQuizModalStyles(light);
    expect(d.card.backgroundColor).toBe(dark.card);
    expect(l.card.backgroundColor).toBe(light.card);
    expect(d.reviewHit.color).toBe('#86EFAC');
    expect(l.reviewHit.color).toBe(light.success);
    expect(d.reviewMiss.color).toBe('#FCA5A5');
    expect(l.reviewMiss.color).toBe(light.danger);
  });

  test('QuizModal renderiza no provider light (smoke)', () => {
    const screen = render(
      <ThemeProvider initialMode="light">
        <QuizModal
          visible
          questoes={[{ pergunta: 'Capital do Brasil?', alternativas: ['SP', 'Brasília'], correta: 1 }]}
          onFinish={() => {}}
          onClose={() => {}}
        />
      </ThemeProvider>
    );
    expect(screen.getByText('Capital do Brasil?')).toBeTruthy();
  });

  test('TopicCoachCard renderiza dados no provider light (smoke)', async () => {
    getTopicAssist.mockResolvedValue({
      explicacao: 'Explicação de teste light',
      metodo: null,
      recursos: [],
      quiz: null,
      fromCache: false,
      geradoEm: new Date().toISOString(),
    });
    const screen = render(
      <ThemeProvider initialMode="light">
        <TopicCoachCard
          userId={1}
          subjectId={1}
          materiaNome="História"
          topicoNome="Idade Média"
          outrosTopicos={[]}
          expanded
          onToggle={() => {}}
        />
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Explicação de teste light')).toBeTruthy();
    });
  });
});
