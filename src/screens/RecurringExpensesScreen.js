// src/screens/RecurringExpensesScreen.js
// TELA DE GASTOS RECORRENTES: Automação e gerenciamento de despesas fixas mensais

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CATEGORIES_EXPENSE } from '../utils/constants';

export default function RecurringExpensesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    recurringExpenses,
    recurringMonthlyTotal,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    syncRecurringForCurrentMonth,
  } = useFinance();

  const { theme } = useTheme();
  const { t, language, translateCategory, formatMoney } = useLanguage();

  // Estados do Modal de Criação / Edição
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Moradia');
  const [selectedCategoryId, setSelectedCategoryId] = useState('moradia');
  const [dayOfMonth, setDayOfMonth] = useState('5');
  const [observations, setObservations] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  function openCreateModal() {
    setEditingExpense(null);
    setDescription('');
    setAmount('');
    setSelectedCategory('Moradia');
    setSelectedCategoryId('moradia');
    setDayOfMonth('5');
    setObservations('');
    setModalVisible(true);
  }

  function openEditModal(item) {
    setEditingExpense(item);
    setDescription(item.description);
    setAmount(String(item.amount));
    setSelectedCategory(item.category);
    setSelectedCategoryId(item.categoryId || 'moradia');
    setDayOfMonth(String(item.dayOfMonth || 5));
    setObservations(item.observations || '');
    setModalVisible(true);
  }

  async function handleSave() {
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim()) {
      Alert.alert(t('common.attention'), t('newTransaction.requiredDescription'));
      return;
    }
    if (!numAmount || numAmount <= 0) {
      Alert.alert(t('common.attention'), t('newTransaction.invalidAmount'));
      return;
    }

    const dayNum = parseInt(dayOfMonth, 10);
    if (!dayNum || dayNum < 1 || dayNum > 31) {
      Alert.alert(t('common.attention'), 'Informe um dia de vencimento válido (entre 1 e 31).');
      return;
    }

    const payload = {
      description: description.trim(),
      amount: numAmount,
      category: selectedCategory,
      categoryId: selectedCategoryId,
      dayOfMonth: dayNum,
      observations: observations.trim(),
    };

    if (editingExpense) {
      await updateRecurringExpense(editingExpense.id, payload);
    } else {
      await addRecurringExpense(payload);
    }

    setModalVisible(false);
  }

  function handleDelete(item) {
    Alert.alert(
      t('recurring.deleteTitle'),
      t('recurring.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteRecurringExpense(item.id);
          },
        },
      ]
    );
  }

  async function handleManualSync() {
    const res = await syncRecurringForCurrentMonth();
    if (res.addedCount > 0) {
      setSyncFeedback(t('recurring.syncSuccess'));
    } else {
      setSyncFeedback(t('recurring.alreadySynced'));
    }
    setTimeout(() => setSyncFeedback(''), 3000);
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
          {t('recurring.title')}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(30, insets.bottom + 20) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Informativo de Automação */}
        <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryLabel}>{t('recurring.monthlyFixedTotal')}</Text>
              <Text style={styles.summaryValue}>{formatMoney(recurringMonthlyTotal)}</Text>
            </View>
            <View style={styles.countBadge}>
              <Ionicons name="repeat" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.countBadgeText}>
                {recurringExpenses.filter((r) => r.active !== false).length} ativos
              </Text>
            </View>
          </View>
          <Text style={styles.summaryDesc}>
            {t('recurring.subtitle')}
          </Text>

          {/* Botão para Lançar no mês atual */}
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleManualSync}
            activeOpacity={0.85}
          >
            <Ionicons name="flash-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.syncButtonText, { color: theme.primary }]}>
              {t('recurring.syncPending')}
            </Text>
          </TouchableOpacity>
        </View>

        {syncFeedback ? (
          <View style={[styles.feedbackBanner, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.feedbackText, { color: theme.textPurple }]}>
              {syncFeedback}
            </Text>
          </View>
        ) : null}

        {/* Lista de Gastos Recorrentes */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {language === 'en' ? 'Automated Expenses' : 'Despesas Automatizadas'}
        </Text>

        {recurringExpenses.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="repeat-outline" size={36} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {t('recurring.empty')}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              {t('recurring.emptySub')}
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
              onPress={openCreateModal}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddBtnText}>{t('recurring.addNew')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recurringExpenses.map((item) => {
            const isActive = item.active !== false;
            return (
              <View
                key={item.id}
                style={[
                  styles.expenseCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: isActive ? 1 : 0.65,
                  },
                ]}
              >
                <View style={styles.expenseTopRow}>
                  <View style={styles.expenseLeft}>
                    <View
                      style={[
                        styles.expenseIconCircle,
                        { backgroundColor: isActive ? theme.primaryLight : theme.surfaceAlt },
                      ]}
                    >
                      <Ionicons
                        name="repeat"
                        size={18}
                        color={isActive ? theme.primary : theme.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.expenseDescription, { color: theme.textPrimary }]}>
                        {item.description}
                      </Text>
                      <Text style={[styles.expenseCategory, { color: theme.textSecondary }]}>
                        {translateCategory(item.category)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.expenseAmount, { color: theme.expense }]}>
                    − {formatMoney(item.amount)}
                  </Text>
                </View>

                {/* Linha de Metadados: Dia do Vencimento e Status */}
                <View style={[styles.expenseMetaRow, { borderTopColor: theme.border }]}>
                  <View style={styles.dueDayPill}>
                    <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.dueDayText, { color: theme.textSecondary }]}>
                      {t('recurring.dueDayShort', { day: item.dayOfMonth || 5 })}
                    </Text>
                  </View>

                  <View style={styles.actionsRight}>
                    {/* Switch Ativo/Pausado */}
                    <View style={styles.switchWrapper}>
                      <Text style={[styles.switchStatusLabel, { color: isActive ? theme.income : theme.textMuted }]}>
                        {isActive ? t('recurring.active') : t('recurring.paused')}
                      </Text>
                      <Switch
                        value={isActive}
                        onValueChange={() => toggleRecurringExpense(item.id)}
                        trackColor={{ false: theme.borderDark, true: theme.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    {/* Editar */}
                    <TouchableOpacity
                      style={[styles.smallActionBtn, { backgroundColor: theme.surfaceAlt }]}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={16} color={theme.textPrimary} />
                    </TouchableOpacity>

                    {/* Excluir */}
                    <TouchableOpacity
                      style={[styles.smallActionBtn, { backgroundColor: theme.expenseLight }]}
                      onPress={() => handleDelete(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.expense} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Criação / Edição de Gasto Recorrente */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {editingExpense ? t('recurring.edit') : t('recurring.addNew')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Descrição */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('recurring.description')}
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderDark,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder={t('recurring.descriptionPlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Valor */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('recurring.amount')}
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderDark,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="0,00"
                  placeholderTextColor={theme.textMuted}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              {/* Categoria */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('common.category')}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.modalSelect,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderDark,
                    },
                  ]}
                  onPress={() => setCategoryModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalSelectText, { color: theme.textPrimary }]}>
                    {translateCategory(selectedCategory)}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Dia do Vencimento */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('recurring.dueDay')}
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderDark,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="Ex: 5, 10, 15, 20..."
                  placeholderTextColor={theme.textMuted}
                  value={dayOfMonth}
                  onChangeText={setDayOfMonth}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              {/* Observações */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('common.observations')}
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderDark,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="Detalhes adicionais..."
                  placeholderTextColor={theme.textMuted}
                  value={observations}
                  onChangeText={setObservations}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveModalBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveModalBtnText}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Seleção de Categoria */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {t('newTransaction.selectCategory')}
              </Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {CATEGORIES_EXPENSE.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catOptionItem,
                    selectedCategoryId === cat.id && { backgroundColor: theme.primaryLight },
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.name);
                    setSelectedCategoryId(cat.id);
                    setCategoryModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={cat.icon} size={18} color={theme.primary} style={{ marginRight: 10 }} />
                  <Text style={[styles.catOptionText, { color: theme.textPrimary }]}>
                    {translateCategory(cat.name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    padding: 22,
    marginBottom: 16,
    shadowColor: '#5B36EC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginBottom: 14,
  },
  syncButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 42,
    borderRadius: 14,
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expenseCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  expenseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  expenseIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  expenseMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  dueDayPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  switchStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  smallActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 24,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  modalSelectText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveModalBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  saveModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  catOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  catOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
