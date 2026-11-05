// src/components/BankNotificationBanner.js
// Captura Invisível e Intercepção de Notificações Bancárias (Passo 2 da Proposta de Amanda)
// Permite abater compras de cartões de bancos (Nubank, Inter, Itaú, C6) com apenas 1 toque

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function BankNotificationBanner() {
  const {
    pendingBankNotification,
    acceptBankNotification,
    dismissBankNotification,
    triggerBankNotification,
  } = useFinance();
  const { theme } = useTheme();
  const { language, formatMoney } = useLanguage();

  const [simModalVisible, setSimModalVisible] = useState(false);

  // Exemplo de compras pré-configuradas para demonstração da captura em 1 toque
  const demoPurchases = [
    { bank: 'Nubank', amount: 25.0, merchant: "McDonald's", category: 'Alimentação' },
    { bank: 'Inter', amount: 12.5, merchant: 'Café do Ponto', category: 'Alimentação' },
    { bank: 'Itaú', amount: 45.0, merchant: 'Posto Shell (Gasolina)', category: 'Transporte' },
    { bank: 'C6 Bank', amount: 19.9, merchant: 'Cinemark Pipoca', category: 'Lazer' },
    { bank: 'Bradesco', amount: 32.0, merchant: 'Drogaria São Paulo', category: 'Saúde' },
  ];

  return (
    <View style={styles.container}>
      {/* Banner ativo quando uma notificação de banco é interceptada */}
      {pendingBankNotification && (
        <View style={[styles.bannerCard, { backgroundColor: theme.primary, borderColor: '#FFFFFF' }]}>
          <View style={styles.bannerHeader}>
            <View style={styles.badgeRow}>
              <View style={styles.bankDot} />
              <Text style={styles.bankNameText}>
                {pendingBankNotification.bank} • {pendingBankNotification.timestamp}
              </Text>
            </View>
            <TouchableOpacity onPress={dismissBankNotification} style={styles.closeBtn}>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.rawNotificationText}>
            {`"${pendingBankNotification.rawText}"`}
          </Text>

          <View style={styles.promptRow}>
            <Ionicons name="flash-outline" size={16} color="#FBBF24" style={{ marginRight: 6 }} />
            <Text style={styles.promptText}>
              {language === 'en'
                ? `Deduct ${formatMoney(pendingBankNotification.amount)} from your Free Allowance?`
                : `Abater ${formatMoney(pendingBankNotification.amount)} da sua Mesada Livre?`}
            </Text>
          </View>

          {/* Botões de Ação com 1 Toque */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.oneTapButton}
              onPress={() => acceptBankNotification(pendingBankNotification.id, 'mesada')}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.oneTapButtonText, { color: theme.primary }]}>
                {language === 'en' ? 'Yes, Deduct (1 Tap)' : 'Sim, Abater (1 Toque)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.normalRecordButton}
              onPress={() => acceptBankNotification(pendingBankNotification.id, 'normal')}
              activeOpacity={0.85}
            >
              <Text style={styles.normalRecordButtonText}>
                {language === 'en' ? 'Standard Expense' : 'Despesa Normal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Botão sutil para simular compra bancária e testar a captura invisível */}
      {!pendingBankNotification && (
        <TouchableOpacity
          style={[styles.simTriggerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setSimModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.simLeft}>
            <View style={[styles.simIconCircle, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="card-outline" size={16} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.simTitle, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Invisible Bank Capture' : 'Captura Invisível de Notificações'}
              </Text>
              <Text style={[styles.simSub, { color: theme.textSecondary }]}>
                {language === 'en' ? 'Test 1-tap deduction from Nubank, Inter, etc.' : 'Simular compra no cartão e abater com 1 toque'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Modal para disparar simulações de teste da captura invisível */}
      <Modal visible={simModalVisible} animationType="slide" transparent onRequestClose={() => setSimModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalTop}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {language === 'en' ? 'Simulate Bank Notification' : 'Simular Notificação do Banco'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {language === 'en'
                    ? 'Experience zero-form micro-expense logging in 1 tap'
                    : 'Experimente registrar gastos de rua sem preencher nenhum formulário'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSimModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.demoList}>
              {demoPurchases.map((item, index) => (
                <TouchableOpacity
                  key={`demo-${index}`}
                  style={[styles.demoItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}
                  onPress={() => {
                    triggerBankNotification(item.bank, item.amount, item.merchant, item.category);
                    setSimModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.demoItemLeft}>
                    <View style={[styles.demoBankBadge, { backgroundColor: theme.primary }]}>
                      <Ionicons name="card" size={16} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={[styles.demoMerchant, { color: theme.textPrimary }]}>{item.merchant}</Text>
                      <Text style={[styles.demoBank, { color: theme.textSecondary }]}>{item.bank} • {item.category}</Text>
                    </View>
                  </View>
                  <Text style={[styles.demoAmount, { color: theme.expense }]}>{formatMoney(item.amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  bannerCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  bankNameText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  rawNotificationText: {
    color: '#EDE9FE',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  oneTapButton: {
    flex: 1.5,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  oneTapButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  normalRecordButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  normalRecordButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  simTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  simLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  simIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  simTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  simSub: {
    fontSize: 11,
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  demoList: {
    gap: 8,
  },
  demoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  demoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoBankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  demoMerchant: {
    fontSize: 14,
    fontWeight: '600',
  },
  demoBank: {
    fontSize: 11,
    marginTop: 1,
  },
  demoAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
