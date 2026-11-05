// src/components/VoiceCommandModal.js
// IA de Comando de Voz Contextual em < 2 Segundos (Passo 3 do documento de Amanda)
// Reconhece fala natural, extrai valor, categoria, estabelecimento e diferencia PIX recebido de PIX enviado

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function VoiceCommandModal({ visible, onClose }) {
  const { processVoiceCommand } = useFinance();
  const { theme } = useTheme();
  const { language, formatMoney, translateCategory } = useLanguage();

  const [inputPhrase, setInputPhrase] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Exemplos rápidos de fala natural recomendados no documento
  const sampleCommands = [
    'Gastei 45 reais de gasolina no posto Shell',
    'PIX recebido de 150 reais da Maria',
    'Almoço de 32 reais no restaurante',
    'Paguei 18 reais na farmácia',
    'Cafezinho de 8 reais na padaria',
  ];

  async function handleExecute(phraseToUse) {
    const text = phraseToUse || inputPhrase;
    if (!text.trim()) return;

    setIsProcessing(true);
    setErrorMessage('');
    setResult(null);

    const res = await processVoiceCommand(text);
    setIsProcessing(false);

    if (res.success) {
      setResult(res);
      setInputPhrase('');
      // Fecha suavemente após exibir o check verde discreto de sucesso (< 2 segundos)
      setTimeout(() => {
        setResult(null);
        onClose();
      }, 1500);
    } else {
      setErrorMessage(res.message || 'Erro ao processar comando.');
    }
  }

  function handleClose() {
    setInputPhrase('');
    setResult(null);
    setErrorMessage('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.dialogCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Topo com Botão Fechar */}
          <View style={styles.topRow}>
            <View style={styles.badgeRow}>
              <View style={[styles.sparkleIconBadge, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="mic" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Voice AI (< 2 Seconds)' : 'IA de Voz (< 2 Segundos)'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Estado de Sucesso: Check Verde Discreto (Item 3 do Documento) */}
          {result ? (
            <View style={styles.successContainer}>
              <View style={[styles.successCircle, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.successTitle, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Saved in less than 2s!' : 'Salvo em menos de 2s!'}
              </Text>
              <Text style={[styles.successDetails, { color: theme.textSecondary }]}>
                {result.extracted.description} • {translateCategory(result.extracted.category)}
              </Text>
              <Text style={[styles.successAmount, { color: result.extracted.type === 'receita' ? theme.income : theme.expense }]}>
                {result.extracted.type === 'receita' ? '+' : '-'} {formatMoney(result.extracted.amount)}
              </Text>
              <Text style={[styles.latencyText, { color: theme.textSecondary }]}>
                ⚡ {result.executionTimeMs}ms • {language === 'en' ? 'Processed natively offline' : 'Processado nativamente offline'}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={[styles.promptSubtitle, { color: theme.textSecondary }]}>
                {language === 'en'
                  ? 'Speak naturally or tap a quick phrase. The NLP AI extracts amount, category, merchant, and handles PIX context instantly.'
                  : 'Fale naturalmente ou toque em uma frase. A IA semântica extrai valor, categoria, local e identifica depósitos vs saídas de PIX.'}
              </Text>

              {/* Campo de Entrada de Fala / Texto Natural */}
              <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder={
                    language === 'en'
                      ? 'e.g., Spent 45 on gas at Shell station'
                      : 'Ex: Gastei 45 reais de gasolina no posto Shell'
                  }
                  placeholderTextColor={theme.textMuted}
                  value={inputPhrase}
                  onChangeText={setInputPhrase}
                  onSubmitEditing={() => handleExecute(inputPhrase)}
                  returnKeyType="send"
                  autoFocus
                />
                {isProcessing ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleExecute(inputPhrase)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>

              {errorMessage ? (
                <Text style={styles.errorNotice}>{errorMessage}</Text>
              ) : null}

              {/* Frases rápidas para teste com 1 toque */}
              <Text style={[styles.samplesHeader, { color: theme.textSecondary }]}>
                {language === 'en' ? 'Quick test phrases:' : 'Exemplos rápidos de teste:'}
              </Text>

              <View style={styles.samplesGrid}>
                {sampleCommands.map((sample, idx) => (
                  <TouchableOpacity
                    key={`sample-${idx}`}
                    style={[styles.sampleChip, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}
                    onPress={() => {
                      setInputPhrase(sample);
                      handleExecute(sample);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="flash" size={12} color="#FBBF24" style={{ marginRight: 6 }} />
                    <Text numberOfLines={1} style={[styles.sampleChipText, { color: theme.textPrimary }]}>
                      {sample}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  promptSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorNotice: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 10,
  },
  samplesHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  samplesGrid: {
    gap: 6,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  sampleChipText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  successDetails: {
    fontSize: 13,
    marginBottom: 4,
  },
  successAmount: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  latencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
