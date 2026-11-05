// src/screens/GoalsScreen.js
// RF05 – Metas Financeiras ("Cofrinho"): Criação de objetivos de economia com exibição visual do progresso percentual acumulado

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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPercentage } from '../utils/formatters';

export default function GoalsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    goals,
    totalGoalsSaved,
    addGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
    withdrawFromGoal,
  } = useFinance();
  const { theme } = useTheme();
  const { t, language, formatMoney } = useLanguage();

  // Estados dos modais
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [depositType, setDepositType] = useState('deposit'); // 'deposit' ou 'withdraw'
  const [depositAmount, setDepositAmount] = useState('');

  // Formulário de criação/edição
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [prazo, setPrazo] = useState('');

  function openCreateModal() {
    setTitle('');
    setTargetAmount('');
    setInitialAmount('0');
    setPrazo('');
    setCreateModalVisible(true);
  }

  function openDepositModal(goal, type = 'deposit') {
    setActiveGoal(goal);
    setDepositType(type);
    setDepositAmount('');
    setDepositModalVisible(true);
  }

  async function handleSaveGoal() {
    const numTarget = parseFloat(targetAmount.replace(',', '.'));
    const numCurrent = parseFloat(initialAmount.replace(',', '.')) || 0;

    if (!title.trim()) {
      Alert.alert(t('common.attention'), language === 'en' ? 'Please enter a goal title.' : 'Informe o nome da meta.');
      return;
    }
    if (!numTarget || numTarget <= 0) {
      Alert.alert(t('common.attention'), language === 'en' ? 'Please enter a valid target amount.' : 'Informe um valor alvo válido.');
      return;
    }

    await addGoal({
      titulo: title.trim(),
      valorAlvo: numTarget,
      valorAtual: numCurrent,
      prazo: prazo.trim(),
    });

    setCreateModalVisible(false);
  }

  async function handleConfirmDeposit() {
    const num = parseFloat(depositAmount.replace(',', '.'));
    if (!num || num <= 0) {
      Alert.alert(t('common.attention'), language === 'en' ? 'Please enter a valid amount.' : 'Informe um valor válido.');
      return;
    }

    if (depositType === 'deposit') {
      await depositToGoal(activeGoal.id, num);
    } else {
      await withdrawFromGoal(activeGoal.id, num);
    }

    setDepositModalVisible(false);
  }

  function handleDelete(goal) {
    Alert.alert(
      language === 'en' ? 'Delete Goal' : 'Excluir Meta',
      language === 'en'
        ? `Do you really want to delete "${goal.titulo}"?`
        : `Deseja realmente excluir a meta "${goal.titulo}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteGoal(goal.id),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surfaceAlt }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {language === 'en' ? 'Financial Goals ("Piggy Bank")' : 'Metas ("Cofrinho")'}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(30, insets.bottom + 20) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Resumo do Cofrinho */}
        <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
          <View style={styles.summaryTopRow}>
            <View style={styles.piggyIconBadge}>
              <Ionicons name="wallet-outline" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>
                {language === 'en' ? 'Total Saved in Goals' : 'Total Poupado no Cofrinho'}
              </Text>
              <Text style={styles.summaryAmount}>
                {formatMoney(totalGoalsSaved)}
              </Text>
            </View>
          </View>
          <Text style={styles.summarySub}>
            {goals.length}{' '}
            {goals.length === 1
              ? (language === 'en' ? 'active goal' : 'meta ativa')
              : (language === 'en' ? 'active goals' : 'metas ativas')}
          </Text>
        </View>

        {/* Título da Seção */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {language === 'en' ? 'Your Savings Objectives' : 'Seus Objetivos de Economia'}
          </Text>
          <TouchableOpacity onPress={openCreateModal} activeOpacity={0.7}>
            <Text style={[styles.newGoalLink, { color: theme.textPurple }]}>
              {language === 'en' ? '+ New' : '+ Nova Meta'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Metas (RF05) */}
        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="ribbon-outline" size={38} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {language === 'en' ? 'No goals created yet' : 'Nenhuma meta criada'}
            </Text>
            <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
              {language === 'en'
                ? 'Create a goal (Emergency fund, Trip, Buying a laptop) and track your accumulated progress!'
                : 'Defina metas (Reserva de Emergência, Viagem, Comprar um notebook) e acompanhe seu progresso acumulado!'}
            </Text>
            <TouchableOpacity
              style={[styles.createFirstBtn, { backgroundColor: theme.primary }]}
              onPress={openCreateModal}
              activeOpacity={0.85}
            >
              <Text style={styles.createFirstBtnText}>
                {language === 'en' ? '+ Create First Goal' : '+ Criar Primeira Meta'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => {
            const current = Number(goal.valorAtual || 0);
            const target = Number(goal.valorAlvo || 1);
            const pct = Math.min(100, Math.round((current / target) * 100));
            const isCompleted = current >= target;

            return (
              <View
                key={goal.id}
                style={[styles.goalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.goalTopRow}>
                  <View style={styles.goalTitleContainer}>
                    <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>
                      {goal.titulo}
                    </Text>
                    {goal.prazo ? (
                      <Text style={[styles.goalPrazo, { color: theme.textSecondary }]}>
                        {language === 'en' ? 'Deadline: ' : 'Prazo: '}{goal.prazo}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(goal)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Valores Atual e Alvo */}
                <View style={styles.valuesRow}>
                  <View>
                    <Text style={[styles.valueLabel, { color: theme.textSecondary }]}>
                      {language === 'en' ? 'Saved' : 'Poupado'}
                    </Text>
                    <Text style={[styles.currentValue, { color: theme.income }]}>
                      {formatMoney(current)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.valueLabel, { color: theme.textSecondary }]}>
                      {language === 'en' ? 'Target' : 'Meta Alvo'}
                    </Text>
                    <Text style={[styles.targetValue, { color: theme.textPrimary }]}>
                      {formatMoney(target)}
                    </Text>
                  </View>
                </View>

                {/* Barra de Progresso Visual (RF05) */}
                <View style={[styles.progressBarTrack, { backgroundColor: theme.surfaceAlt }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: isCompleted ? theme.income : theme.primary,
                      },
                    ]}
                  />
                </View>

                {/* Percentual Acumulado */}
                <View style={styles.progressFooterRow}>
                  <Text style={[styles.pctText, { color: isCompleted ? theme.incomeDark : theme.textSecondary }]}>
                    {isCompleted ? '🎉 ' : ''}{formatPercentage(pct, 0, language)}{' '}
                    {language === 'en' ? 'achieved' : 'alcançado'}
                  </Text>
                  <Text style={[styles.remainingText, { color: theme.textSecondary }]}>
                    {current < target
                      ? `${language === 'en' ? 'Remaining: ' : 'Falta: '}${formatMoney(target - current)}`
                      : (language === 'en' ? 'Goal achieved!' : 'Meta concluída!')}
                  </Text>
                </View>

                {/* Botões de Ação Rápida: Guardar ou Resgatar */}
                <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
                  <TouchableOpacity
                    style={[styles.depositBtn, { backgroundColor: theme.primaryLight }]}
                    onPress={() => openDepositModal(goal, 'deposit')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={theme.textPurple} style={{ marginRight: 4 }} />
                    <Text style={[styles.depositBtnText, { color: theme.textPurple }]}>
                      {language === 'en' ? 'Save Money' : 'Guardar Dinheiro'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.withdrawBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}
                    onPress={() => openDepositModal(goal, 'withdraw')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="remove-circle-outline" size={16} color={theme.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.withdrawBtnText, { color: theme.textSecondary }]}>
                      {language === 'en' ? 'Withdraw' : 'Resgatar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Criação de Meta */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                {language === 'en' ? 'New Financial Goal' : 'Nova Meta Financeira'}
              </Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Goal Name' : 'Nome do Objetivo'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                placeholder={language === 'en' ? 'e.g., Emergency Fund, Trip, Car...' : 'Ex: Reserva de Emergência, Viagem, Carro...'}
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Target Amount (R$)' : 'Valor Alvo (R$)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                placeholder="5000,00"
                placeholderTextColor={theme.textMuted}
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Already Saved (R$ - Optional)' : 'Valor Já Guardado (R$ - Opcional)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                placeholder="0,00"
                placeholderTextColor={theme.textMuted}
                value={initialAmount}
                onChangeText={setInitialAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Target Date / Period (Optional)' : 'Prazo Desejado (Opcional)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                placeholder={language === 'en' ? 'e.g., Dec 2026, 6 months' : 'Ex: Dezembro de 2026, 6 meses'}
                placeholderTextColor={theme.textMuted}
                value={prazo}
                onChangeText={setPrazo}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSaveGoal}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Depósito ou Resgate */}
      <Modal
        visible={depositModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                {depositType === 'deposit'
                  ? (language === 'en' ? 'Deposit to Goal' : 'Guardar no Cofrinho')
                  : (language === 'en' ? 'Withdraw from Goal' : 'Resgatar da Meta')}
              </Text>
              <TouchableOpacity onPress={() => setDepositModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {activeGoal?.titulo}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Amount (R$)' : 'Qual o valor? (R$)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                placeholder="100,00"
                placeholderTextColor={theme.textMuted}
                value={depositAmount}
                onChangeText={setDepositAmount}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: depositType === 'deposit' ? theme.income : theme.expense },
              ]}
              onPress={handleConfirmDeposit}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>
                {depositType === 'deposit'
                  ? (language === 'en' ? 'Confirm Deposit' : 'Confirmar Depósito')
                  : (language === 'en' ? 'Confirm Withdrawal' : 'Confirmar Resgate')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  piggyIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  summarySub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  newGoalLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  createFirstBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  createFirstBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  goalPrazo: {
    fontSize: 12,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  valueLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  currentValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  targetValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  depositBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  depositBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  withdrawBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  withdrawBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
