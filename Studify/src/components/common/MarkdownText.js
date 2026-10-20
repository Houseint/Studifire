import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const cleanPlain = (text) => text.replace(/\*\*/g, '').replace(/\*/g, '');

const renderInline = (line, textStyle, keyPrefix) => {
  const nodes = [];
  const regex = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match;
  let index = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Text key={`${keyPrefix}-t-${index++}`} style={textStyle}>
          {cleanPlain(line.slice(lastIndex, match.index))}
        </Text>
      );
    }

    const token = match[0];
    const isBold = token.startsWith('**');
    nodes.push(
      <Text
        key={`${keyPrefix}-m-${index++}`}
        style={[textStyle, isBold ? styles.bold : styles.italic]}
      >
        {token.slice(isBold ? 2 : 1, isBold ? -2 : -1)}
      </Text>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    nodes.push(
      <Text key={`${keyPrefix}-t-${index++}`} style={textStyle}>
        {cleanPlain(line.slice(lastIndex))}
      </Text>
    );
  }

  return nodes;
};

/**
 * Renderização leve para as respostas da IA: remove ** e * crus,
 * aplica negrito/itálico e transforma listas em marcadores visuais.
 */
const MarkdownText = ({ text, style }) => {
  const lines = String(text || '').split('\n');

  return (
    <View style={styles.container}>
      {lines.map((rawLine, lineIndex) => {
        const line = rawLine
          .replace(/^#{1,6}\s*/, '')
          .replace(/^\s*```.*$/, '')
          .trimEnd();

        if (!line.trim()) {
          return <View key={`blank-${lineIndex}`} style={styles.spacer} />;
        }

        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        if (bullet) {
          return (
            <View key={`bullet-${lineIndex}`} style={styles.row}>
              <Text style={[style, styles.bullet]}>•</Text>
              <Text style={[style, styles.flexText]}>
                {renderInline(bullet[1], style, `b${lineIndex}`)}
              </Text>
            </View>
          );
        }

        const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (numbered) {
          return (
            <View key={`numbered-${lineIndex}`} style={styles.row}>
              <Text style={[style, styles.number]}>{numbered[1]}.</Text>
              <Text style={[style, styles.flexText]}>
                {renderInline(numbered[2], style, `n${lineIndex}`)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={`line-${lineIndex}`} style={[style, styles.line]}>
            {renderInline(line, style, `l${lineIndex}`)}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexShrink: 1 },
  line: { marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  bullet: { width: 14, textAlign: 'center' },
  number: { width: 20, textAlign: 'left' },
  flexText: { flex: 1 },
  spacer: { height: 6 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
});

export default MarkdownText;
