/**
 * Studify - QuizModal (FASE 2.2)
 *
 * Quiz pós-sessão: 1 pergunta por vez, 4 alternativas, resultado no final.
 * Burro de propósito: recebe `questoes` prontas, devolve {total, correct}
 * via onFinish — quem persiste e ajusta o FSRS é a DetailScreen.
 */
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function QuizModal({ visible, questoes = [], onFinish, onClose }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visible) {
      setIdx(0);
      setSelected(null);
      setAnswers([]);
      setDone(false);
    }
  }, [visible, questoes]);

  if (!visible) return null;
  const total = questoes.length;
  if (total === 0) return null;

  const correct = answers.filter((a, i) => a === questoes[i]?.correta).length;

  const handleConfirm = () => {
    if (selected == null) return;
    const next = [...answers, selected];
    setAnswers(next);
    setSelected(null);
    if (idx + 1 >= total) setDone(true);
    else setIdx(idx + 1);
  };

  const handleSave = () => {
    onFinish?.({ total, correct });
  };

  const q = questoes[Math.min(idx, total - 1)];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          {!done ? (
            <>
              <Text style={s.kicker}>QUIZ DE REVISÃO · {idx + 1}/{total}</Text>
              <Text style={s.question}>{q.pergunta}</Text>
              {q.alternativas.map((alt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.alt, selected === i && s.altSelected]}
                  activeOpacity={0.7}
                  onPress={() => setSelected(i)}
                >
                  <Text style={s.altText}>{alt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[s.primary, selected == null && s.primaryDisabled]}
                activeOpacity={0.8}
                onPress={handleConfirm}
                disabled={selected == null}
              >
                <Text style={s.primaryText}>{idx + 1 === total ? 'Ver resultado' : 'Próxima'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghost} onPress={onClose}>
                <Text style={s.ghostText}>Sair do quiz</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.kicker}>RESULTADO</Text>
              <Text style={s.score}>{correct}/{total}</Text>
              <Text style={s.feedback}>
                {correct === total
                  ? 'Perfeito! Revisão adiada 🎉'
                  : correct / total >= 0.5
                    ? 'Bom! Continue revisando 💪'
                    : 'Vamos reforçar — revisão antecipada 📚'}
              </Text>
              <TouchableOpacity style={s.primary} activeOpacity={0.8} onPress={handleSave}>
                <Text style={s.primaryText}>Salvar resultado</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 20, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#111832',
    borderWidth: 1,
    borderColor: '#27315B',
    borderRadius: 16,
    padding: 16,
  },
  kicker: { color: '#8F98C2', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  question: { color: '#F4F6FF', fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 12 },
  alt: {
    borderWidth: 1,
    borderColor: '#27315B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  altSelected: { borderColor: '#8A68FF', backgroundColor: '#1A1C4A' },
  altText: { color: '#F4F6FF', fontSize: 14 },
  primary: {
    backgroundColor: '#8A68FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryDisabled: { opacity: 0.4 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  ghost: { padding: 12, alignItems: 'center' },
  ghostText: { color: '#8F98C2', fontSize: 14 },
  score: { color: '#F4F6FF', fontSize: 40, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  feedback: { color: '#8F98C2', fontSize: 14, textAlign: 'center', marginVertical: 12 },
});
