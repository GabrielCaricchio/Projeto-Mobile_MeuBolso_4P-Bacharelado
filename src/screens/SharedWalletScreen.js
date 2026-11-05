// src/screens/SharedWalletScreen.js
// Carteira Compartilhada para Casais com Privacidade Blindada (Passo 4 da Proposta de Amanda)
// Divisão automática 50/50 ou personalizada sem expor salários, investimentos ou gastos privados

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Header from '../components/Header';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateDisplay } from '../utils/formatters';

export default function SharedWalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    sharedWallet,
    connectSharedWallet,
    disconnectSharedWallet,
    addSharedExpense,
    settleSharedDebts,
    sharedWalletSummary,
  } = useFinance();
  const { theme } = useTheme();
  const { t, language, formatMoney } = useLanguage();

  // Estados de Conexão
  const [partnerNameInput, setPartnerNameInput] = useState(sharedWallet.partnerName || 'Amanda');
  const [pairCodeInput, setPairCodeInput] = useState('');

  // Estados de Novo Gasto Comum
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [splitRatio, setSplitRatio] = useState(sharedWallet.splitRatio || 50);

  async function handleConnect() {
    if (!partnerNameInput.trim()) {
      Alert.alert(t('common.attention'), language === 'en' ? 'Please enter your partner name.' : 'Informe o nome do parceiro(a).');
      return;
    }
    await connectSharedWallet(partnerNameInput.trim(), pairCodeInput.trim() || null);
  }

  function handleDisconnect() {
    Alert.alert(
      language === 'en' ? 'Disconnect Shared Wallet' : 'Desconectar Carteira Compartilhada',
      language === 'en'
        ? 'Your private transactions and data remain 100% intact. Confirm disconnect?'
        : 'Suas movimentações e dados privados continuam 100% intactos. Deseja realmente desconectar?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: language === 'en' ? 'Disconnect' : 'Desconectar',
          style: 'destructive',
          onPress: async () => await disconnectSharedWallet(),
        },
      ]
    );
  }

  async function handleCreateSharedExpense() {
    const num = parseFloat(expenseAmount.replace(',', '.'));
    if (!num || num <= 0) {
      Alert.alert(t('common.attention'), t('newTransaction.invalidAmount'));
      return;
    }

    if (!expenseDesc.trim()) {
      Alert.alert(t('common.attention'), t('newTransaction.requiredDescription'));
      return;
    }

    await addSharedExpense({
      description: expenseDesc.trim(),
      amount: num,
      splitRatio,
      date: new Date().toISOString().split('T')[0],
      category: 'Gastos Comuns',
    });

    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseModalVisible(false);
  }

  async function handleSettle() {
    Alert.alert(
      language === 'en' ? 'Settle Shared Balance' : 'Acertar Contas do Casal',
      language === 'en'
        ? `Confirm balance settlement? All pending debits will be marked as settled.`
        : `Deseja marcar todas as divisões pendentes como acertadas e zerar os débitos?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: language === 'en' ? 'Confirm Settlement' : 'Confirmar Acerto',
          onPress: async () => await settleSharedDebts(),
        },
      ]
    );
  }

  const currencySymbol = language === 'en' ? '$' : 'R$';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(30, insets.bottom + 20) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <Header />

        {/* Título da Tela */}
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
              {language === 'en' ? 'Couple Shared Wallet' : 'Carteira para Casais'}
            </Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              {language === 'en'
                ? 'Split common bills with 100% shielded personal privacy'
                : 'Divida despesas comuns com privacidade pessoal 100% blindada'}
            </Text>
          </View>
        </View>

        {/* Caso 1: A carteira ainda NÃO está conectada */}
        {!sharedWallet.isConnected ? (
          <View style={[styles.connectCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.connectIconCircle, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="people" size={36} color={theme.primary} />
            </View>

            <Text style={[styles.connectTitle, { color: theme.textPrimary }]}>
              {language === 'en' ? 'Connect with your Partner' : 'Conecte-se com seu Parceiro(a)'}
            </Text>

            <Text style={[styles.connectDescription, { color: theme.textSecondary }]}>
              {language === 'en'
                ? 'Zero loss of privacy: Your personal expenses, salary, and investments stay 100% invisible. Only items you drag or split will appear here.'
                : 'Zero perda de privacidade: Seus gastos pessoais, salário e investimentos continuam 100% invisíveis. Apenas os gastos que você dividir aparecerão aqui.'}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? "Partner's Name" : 'Nome do Parceiro(a)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                value={partnerNameInput}
                onChangeText={setPartnerNameInput}
                placeholder="Ex: Amanda"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Pair Code (Optional)' : 'Código de Convite (Opcional)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                value={pairCodeInput}
                onChangeText={setPairCodeInput}
                placeholder="Ex: CASAL-7892"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity
              style={[styles.connectBtn, { backgroundColor: theme.primary }]}
              onPress={handleConnect}
              activeOpacity={0.8}
            >
              <Ionicons name="link-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.connectBtnText}>
                {language === 'en' ? 'Connect Shared Space' : 'Ativar Carteira Compartilhada'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Caso 2: A carteira ESTÁ conectada */
          <View>
            {/* Card Status de Conexão e Privacidade */}
            <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.statusTop}>
                <View style={styles.partnerInfo}>
                  <View style={[styles.partnerAvatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.partnerAvatarLetter}>
                      {(sharedWallet.partnerName || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.partnerName, { color: theme.textPrimary }]}>
                      {sharedWallet.partnerName}
                    </Text>
                    <View style={styles.shieldRow}>
                      <Ionicons name="shield-checkmark" size={13} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={[styles.shieldText, { color: '#10B981' }]}>
                        {language === 'en' ? 'Shielded Privacy Active' : 'Privacidade Blindada Ativa'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectBtn}>
                  <Ionicons name="log-out-outline" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Código de Paridade */}
              <View style={[styles.codeBox, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>
                  {language === 'en' ? 'Pairing Code:' : 'Código do Casal:'}
                </Text>
                <Text style={[styles.codeValue, { color: theme.primary }]}>
                  {sharedWallet.pairCode}
                </Text>
              </View>
            </View>

            {/* Card de Relatório de Acertos do Casal (Elimina PIX picado) */}
            <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
              <View style={styles.summaryTop}>
                <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.summaryTitle}>
                  {language === 'en' ? 'Balance Settlement' : 'Acerto de Contas do Casal'}
                </Text>
              </View>

              <Text style={styles.summaryHighlight}>
                {sharedWalletSummary.summaryText}
              </Text>

              <Text style={styles.summaryDesc}>
                {language === 'en'
                  ? 'No need to send small PIX for every single coffee or grocery run. Settle everything at once.'
                  : 'Sem transferir PIX picado a cada cafezinho ou feira. O app compensa os débitos e faz o balanço automático.'}
              </Text>

              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMetricItem}>
                  <Text style={styles.metricLabelWhite}>
                    {language === 'en' ? 'Common Total' : 'Total Comum'}
                  </Text>
                  <Text style={styles.metricValWhite}>
                    {formatMoney(sharedWalletSummary.totalCommonSpent)}
                  </Text>
                </View>

                {Math.abs(sharedWalletSummary.netDifference) > 0 && (
                  <TouchableOpacity
                    style={styles.settleBtn}
                    onPress={handleSettle}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-done" size={16} color={theme.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.settleBtnText, { color: theme.primary }]}>
                      {language === 'en' ? 'Settle' : 'Acertar'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Botão de Adicionar Gasto Comum */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.addCommonBtn, { backgroundColor: theme.primary }]}
                onPress={() => setExpenseModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addCommonBtnText}>
                  {language === 'en' ? '+ New Common Expense' : '+ Novo Gasto Comum'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lista de Despesas Compartilhadas */}
            <View style={styles.listSection}>
              <Text style={[styles.listHeading, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Shared Expenses' : 'Despesas Divididas'} ({(sharedWallet.expenses || []).length})
              </Text>

              {(sharedWallet.expenses || []).length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="receipt-outline" size={36} color={theme.textMuted} />
                  <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                    {language === 'en' ? 'No shared expenses yet' : 'Nenhuma despesa dividida ainda'}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                    {language === 'en'
                      ? 'Add a common expense above or tap "Split" on any transaction in your history.'
                      : 'Adicione um gasto comum acima ou toque em "Dividir" em qualquer movimentação do seu histórico.'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.expensesListCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {(sharedWallet.expenses || []).map((exp, index) => (
                    <View key={exp.id || index}>
                      <View style={styles.expenseItemRow}>
                        <View style={styles.expenseItemLeft}>
                          <View style={[styles.expenseIcon, { backgroundColor: theme.primaryLight }]}>
                            <Ionicons name="basket-outline" size={18} color={theme.primary} />
                          </View>
                          <View>
                            <Text style={[styles.expenseDesc, { color: theme.textPrimary }]}>
                              {exp.description}
                            </Text>
                            <Text style={[styles.expenseSub, { color: theme.textSecondary }]}>
                              {language === 'en' ? 'Paid by' : 'Pago por'} {exp.paidBy} • {exp.splitRatio}/{100 - exp.splitRatio}%
                            </Text>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.expenseAmount, { color: theme.textPrimary }]}>
                            {formatMoney(exp.totalAmount)}
                          </Text>
                          <Text style={[styles.shareAmount, { color: exp.status === 'acertado' ? '#10B981' : theme.expense }]}>
                            {exp.status === 'acertado'
                              ? (language === 'en' ? 'Settled' : 'Acertado')
                              : `${sharedWallet.partnerName} deve ${formatMoney(exp.partnerShareAmount)}`}
                          </Text>
                        </View>
                      </View>
                      {index < sharedWallet.expenses.length - 1 && (
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Modal de Adição de Gasto Comum */}
        <Modal visible={expenseModalVisible} animationType="slide" transparent onRequestClose={() => setExpenseModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
            <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                  {language === 'en' ? 'New Common Expense' : 'Novo Gasto Comum do Casal'}
                </Text>
                <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                  <Ionicons name="close" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('common.description')}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                  placeholder={language === 'en' ? 'e.g. Grocery shopping, Rent, Dinner' : 'Ex: Feira da semana, Aluguel, Jantar'}
                  placeholderTextColor={theme.textMuted}
                  value={expenseDesc}
                  onChangeText={setExpenseDesc}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('common.amount')} ({currencySymbol})
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                  placeholder="0,00"
                  placeholderTextColor={theme.textMuted}
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  keyboardType="numeric"
                />
              </View>

              {/* Seletor de Divisão */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {language === 'en' ? 'Split Ratio' : 'Proporção de Divisão'}
                </Text>
                <View style={styles.splitToggleRow}>
                  {[50, 60, 70].map((ratio) => (
                    <TouchableOpacity
                      key={ratio}
                      style={[
                        styles.splitRatioBtn,
                        splitRatio === ratio && [styles.splitRatioBtnActive, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
                        splitRatio !== ratio && { borderColor: theme.borderDark },
                      ]}
                      onPress={() => setSplitRatio(ratio)}
                    >
                      <Text style={[styles.splitRatioText, { color: splitRatio === ratio ? theme.primary : theme.textSecondary }]}>
                        {ratio === 50 ? '50 / 50' : `${ratio} / ${100 - ratio}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveExpenseBtn, { backgroundColor: theme.primary }]}
                onPress={handleCreateSharedExpense}
                activeOpacity={0.8}
              >
                <Text style={styles.saveExpenseBtnText}>
                  {language === 'en' ? 'Add & Split' : 'Lançar e Dividir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    padding: 6,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  connectCard: {
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  connectIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  connectDescription: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statusCard: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  partnerAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  shieldText: {
    fontSize: 11,
    fontWeight: '600',
  },
  disconnectBtn: {
    padding: 6,
  },
  codeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  codeLabel: {
    fontSize: 12,
  },
  codeValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryHighlight: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryDesc: {
    color: '#EDE9FE',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  summaryMetricItem: {
    flex: 1,
  },
  metricLabelWhite: {
    color: '#EDE9FE',
    fontSize: 11,
  },
  metricValWhite: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  settleBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  settleBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  addCommonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
  },
  addCommonBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listSection: {
    marginHorizontal: 20,
  },
  listHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  expensesListCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  expenseItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  expenseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  expenseDesc: {
    fontSize: 14,
    fontWeight: '600',
  },
  expenseSub: {
    fontSize: 11,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  shareAmount: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  splitToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  splitRatioBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  splitRatioBtnActive: {},
  splitRatioText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveExpenseBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveExpenseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
