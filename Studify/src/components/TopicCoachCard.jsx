/**
 * Studify - TopicCoachCard
 *
 * Card expansível por tópico. 1 call Groq via studyCoachService.getTopicAssist
 * Cache SQLite 7 dias. Mostra: explicação, recursos (YouTube/Google), método pomodoro,
 * quiz 1 pergunta + feedback. Inline sob a linha do tópico no DetailScreen.
 *
 * Props:
 *  - userId, subjectId, materiaNome, topicoNome, outrosTopicos
 *  - expanded (bool) - controla exibição
 *  - onToggle() - abre/fecha
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { getTopicAssist, buildSearchUrl } from '../features/study/studyCoachService';

export default function TopicCoachCard({
  userId, subjectId, materiaNome, topicoNome, outrosTopicos,
  expanded, onToggle, onUseMetodo,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  // quiz local state
  const [selectedAlt, setSelectedAlt] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  const fetchAssist = useCallback(async (forceRefresh = false) => {
    if (!topicoNome || !materiaNome) return;
    setLoading(true);
    setError('');
    try {
      const res = await getTopicAssist(userId, subjectId, materiaNome, topicoNome, outrosTopicos, { forceRefresh });
      setData(res);
      // reset quiz on new fetch
      setSelectedAlt(null);
      setShowQuizResult(false);
    } catch (e) {
      const msg = e?.message || 'Erro ao carregar assist';
      // extrai mensagem de rate limit se for
      if (msg.startsWith('⏳') || msg.startsWith('Configure')) setError(msg);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, subjectId, materiaNome, topicoNome, outrosTopicos]);

  useEffect(() => {
    if (expanded && !data && !loading) {
      fetchAssist(false);
    }
    // quando fecha, mantém data em cache memory (não limpa) para reopen instantâneo
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenLink = async (query, tipo) => {
    const url = buildSearchUrl(query, tipo);
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('Não foi possível abrir', url);
    } catch (_) {
      Alert.alert('Link', url);
    }
  };

  const handleQuizCheck = () => {
    if (selectedAlt == null) {
      Alert.alert('Escolha uma alternativa');
      return;
    }
    setShowQuizResult(true);
  };

  if (!expanded) return null;

  return (
    <View style={{ marginTop: 8, marginBottom: 4, backgroundColor: '#111832', borderWidth: 1, borderColor: '#27315B', borderRadius: 12, padding: 12 }}>
      {loading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
          <ActivityIndicator color="#8A68FF" />
          <Text style={{ color: '#8F98C2', fontSize: 13 }}>Gerando coach com IA...</Text>
        </View>
      )}

      {!!error && !loading && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAssist(true)} style={{ backgroundColor: '#1B2545', borderWidth: 1, borderColor: '#303E70', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ color: '#AAB6D9', fontWeight: '700', fontSize: 13 }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {!!data && !loading && !error && (
        <>
          {data.fromCache && (
            <Text style={{ color: '#5E6994', fontSize: 10, marginBottom: 6 }}>⚡ do cache • atualizado {new Date(data.geradoEm).toLocaleDateString('pt-BR')}</Text>
          )}

          {/* Explicação */}
          <Text style={{ color: '#8F98C2', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Explicação</Text>
          <Text style={{ color: '#C0CAE8', fontSize: 13, lineHeight: 18, marginBottom: 12 }}>{data.explicacao}</Text>

          {/* Método */}
          {data.metodo && (
            <View style={{ backgroundColor: 'rgba(138,104,255,0.10)', borderWidth: 1, borderColor: 'rgba(138,104,255,0.25)', borderRadius: 10, padding: 10, marginBottom: 12 }}>
              <Text style={{ color: '#8A68FF', fontSize: 12, fontWeight: '800', marginBottom: 4 }}>⏱ {data.metodo.nome} • {data.metodo.duracao}/{data.metodo.pausa} min</Text>
              <Text style={{ color: '#AAB6D9', fontSize: 12 }}>{data.metodo.motivo}</Text>
              {onUseMetodo && (
                <TouchableOpacity onPress={() => onUseMetodo(data.metodo.duracao)} activeOpacity={0.7} style={{ marginTop: 8, backgroundColor: '#6F52FF', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>Usar Pomodoro {data.metodo.duracao} min</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Recursos */}
          {Array.isArray(data.recursos) && data.recursos.length > 0 && (
            <>
              <Text style={{ color: '#8F98C2', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Recursos</Text>
              <View style={{ gap: 6, marginBottom: 12 }}>
                {data.recursos.map((r, idx) => (
                  <TouchableOpacity key={idx} onPress={() => handleOpenLink(r.query, r.tipo)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0E1530', borderWidth: 1, borderColor: '#1F2A4A', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 14, marginRight: 8 }}>{r.tipo === 'video' ? '▶' : r.tipo === 'exercicio' ? '✎' : '▣'}</Text>
                    <Text style={{ color: '#C0CAE8', fontSize: 13, flex: 1 }} numberOfLines={2}>{r.titulo}</Text>
                    <Text style={{ color: '#8A68FF', fontSize: 11, fontWeight: '700', marginLeft: 8 }}>abrir</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Quiz */}
          {data.quiz && data.quiz.pergunta ? (
            <>
              <Text style={{ color: '#8F98C2', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Quiz rápido</Text>
              <View style={{ backgroundColor: '#0E1530', borderWidth: 1, borderColor: '#1F2A4A', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <Text style={{ color: '#F4F6FF', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>{data.quiz.pergunta}</Text>
                {(data.quiz.alternativas || []).map((alt, idx) => {
                  const isSelected = selectedAlt === idx;
                  const isCorrect = data.quiz.correta === idx;
                  const show = showQuizResult;
                  let bg = '#111832';
                  let border = '#27315B';
                  let txtColor = '#C0CAE8';
                  if (show) {
                    if (isCorrect) { bg = 'rgba(34,197,94,0.15)'; border = '#22C55E'; txtColor = '#86EFAC'; }
                    else if (isSelected && !isCorrect) { bg = 'rgba(239,68,68,0.15)'; border = '#EF4444'; txtColor = '#FCA5A5'; }
                  } else if (isSelected) {
                    bg = 'rgba(111,82,255,0.18)'; border = '#6F52FF'; txtColor = '#fff';
                  }
                  return (
                    <TouchableOpacity
                      key={idx}
                      disabled={showQuizResult}
                      onPress={() => setSelectedAlt(idx)}
                      activeOpacity={0.7}
                      style={{ backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text style={{ color: txtColor, fontSize: 13, flex: 1 }}>{String.fromCharCode(65 + idx)}. {alt}</Text>
                      {show && isCorrect && <Text style={{ color: '#22C55E', fontWeight: '800', marginLeft: 6 }}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
                {!showQuizResult ? (
                  <TouchableOpacity onPress={handleQuizCheck} style={{ backgroundColor: '#6F52FF', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Responder</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ marginTop: 6 }}>
                    <Text style={{ color: selectedAlt === data.quiz.correta ? '#86EFAC' : '#FCA5A5', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                      {selectedAlt === data.quiz.correta ? '✅ Correto!' : '❌ Quase lá'}
                    </Text>
                    {!!data.quiz.explicacao && <Text style={{ color: '#AAB6D9', fontSize: 12 }}>{data.quiz.explicacao}</Text>}
                    <TouchableOpacity onPress={() => { setSelectedAlt(null); setShowQuizResult(false); }} style={{ marginTop: 8, backgroundColor: '#1B2545', borderWidth: 1, borderColor: '#27315B', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}>
                      <Text style={{ color: '#AAB6D9', fontWeight: '700', fontSize: 12 }}>Tentar novamente</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity onPress={() => fetchAssist(true)} disabled={loading} style={{ flex: 1, backgroundColor: '#1B2545', borderWidth: 1, borderColor: '#303E70', borderRadius: 8, paddingVertical: 8, alignItems: 'center', opacity: loading ? 0.5 : 1 }}>
              <Text style={{ color: '#AAB6D9', fontWeight: '700', fontSize: 12 }}>↻ Regenerar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onToggle} style={{ flex: 1, backgroundColor: '#151E3A', borderWidth: 1, borderColor: '#27315B', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: '#7F8AB7', fontWeight: '700', fontSize: 12 }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
