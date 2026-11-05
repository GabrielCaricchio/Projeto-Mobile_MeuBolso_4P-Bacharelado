// src/screens/NewTransactionScreen.js
// TELA DE NOVA MOVIMENTAÇÃO / EDIÇÃO: Registro limpo, digitação instantânea sem delay, calendário visual e campos otimizados

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Header from '../components/Header';
import CategoryModal from '../components/CategoryModal';
import CalendarPickerModal from '../components/CalendarPickerModal';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CATEGORIES_EXPENSE, CATEGORIES_INCOME } from '../utils/constants';
import { formatDateDisplay } from '../utils/formatters';

export default function NewTransactionScreen({ navigation, route }) {
  const transactionToEdit = route?.params?.transactionToEdit;
  const isEditing = !!transactionToEdit;

  const { addTransaction, updateTransaction, addRecurringExpense, categoriesExpense } = useFinance();
  const { theme } = useTheme();
  const { t, translateCategory } = useLanguage();

  const getTodayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Estados do formulário estritamente limpos por padrão
  const [type, setType] = useState('despesa');
  const [amountRaw, setAmountRaw] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES_EXPENSE[0].name);
  const [selectedCategoryId, setSelectedCategoryId] = useState(CATEGORIES_EXPENSE[0].id);
  const [date, setDate] = useState(getTodayISO());
  const [status, setStatus] = useState('realizado'); // 'realizado' ou 'pretendido'
  const [observations, setObservations] = useState('');

  // Estados para Gastos Recorrentes Mensais
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState(String(new Date().getDate() || 5));

  // Modais de Categoria e Calendário
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [createCategoryModalVisible, setCreateCategoryModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  // Categorias disponíveis de acordo com o tipo
  const availableCategories = type === 'receita'
    ? CATEGORIES_INCOME
    : (categoriesExpense && categoriesExpense.length > 0 ? categoriesExpense : CATEGORIES_EXPENSE);

  // Inicializa ou limpa os campos ao abrir a tela
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'despesa');
      setAmountRaw(String(transactionToEdit.amount || ''));
      const num = Math.round(Number(transactionToEdit.amount || 0) * 100);
      const cents = num % 100;
      const whole = Math.floor(num / 100);
      const centsStr = cents < 10 ? `0${cents}` : `${cents}`;
      const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      setAmountDisplay(`${wholeStr},${centsStr}`);
      setDescription(transactionToEdit.description || '');
      setSelectedCategory(transactionToEdit.category || CATEGORIES_EXPENSE[0].name);
      setSelectedCategoryId(transactionToEdit.categoryId || CATEGORIES_EXPENSE[0].id);
      setDate(transactionToEdit.date || getTodayISO());
      setStatus(transactionToEdit.status || 'realizado');
      setObservations(transactionToEdit.observations || '');
      setIsRecurring(transactionToEdit.isRecurring || false);
      const dayFromDate = transactionToEdit.date ? parseInt(transactionToEdit.date.split('-')[2], 10) : 5;
      setRecurringDay(String(dayFromDate || 5));
    } else {
      setType('despesa');
      setAmountRaw('');
      setAmountDisplay('');
      setDescription('');
      const firstExp = availableCategories[0] || CATEGORIES_EXPENSE[0];
      setSelectedCategory(firstExp.name);
      setSelectedCategoryId(firstExp.id);
      setDate(getTodayISO());
      setStatus('realizado');
      setObservations('');
      setIsRecurring(false);
      setRecurringDay(String(new Date().getDate() || 5));
    }
  }, [route?.params]);

  // Ajusta categoria padrão ao alternar o tipo
  useEffect(() => {
    if (!isEditing) {
      if (type === 'receita') {
        setSelectedCategory(CATEGORIES_INCOME[0].name);
        setSelectedCategoryId(CATEGORIES_INCOME[0].id);
        setIsRecurring(false);
      } else {
        const firstExpense = availableCategories[0] || CATEGORIES_EXPENSE[0];
        setSelectedCategory(firstExpense.name);
        setSelectedCategoryId(firstExpense.id);
      }
    }
  }, [type, isEditing]);

  // Formatação instantânea de moeda pura em string sem delay de Intl/toLocaleString
  function handleAmountChange(text) {
    const digitsOnly = text.replace(/\D/g, '');
    if (!digitsOnly) {
      setAmountDisplay('');
      setAmountRaw('');
      return;
    }
    const num = parseInt(digitsOnly, 10);
    const cents = num % 100;
    const whole = Math.floor(num / 100);
    const centsStr = cents < 10 ? `0${cents}` : `${cents}`;
    const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setAmountRaw(String(num / 100));
    setAmountDisplay(`${wholeStr},${centsStr}`);
  }

  // Ao selecionar uma data no calendário
  function handleDateSelected(newDate) {
    setDate(newDate);
    const today = getTodayISO();
    if (newDate > today && !isEditing) {
      setStatus('pretendido');
    }
  }

  async function handleSave() {
    const numericAmount = parseFloat(amountRaw);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Atenção', 'Informe um valor válido maior que zero.');
      return;
    }

    // Descrição é opcional: caso vazia, utiliza automaticamente o nome da categoria
    const finalDescription = description.trim() || selectedCategory;

    const payload = {
      description: finalDescription,
      descricao: finalDescription,
      amount: numericAmount,
      valor: numericAmount,
      type,
      tipo: type === 'receita' ? 'entrada' : 'despesa',
      category: selectedCategory,
      categoria: selectedCategory,
      categoryId: selectedCategoryId,
      date,
      dataVencimento: date,
      status, // 'realizado' ou 'pretendido'
      observations: observations.trim(),
      isRecurring: type === 'despesa' && isRecurring,
    };

    if (isEditing) {
      const res = await updateTransaction(transactionToEdit.id, payload);
      if (res.success) {
        Alert.alert('Sucesso', 'Movimentação atualizada com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Erro', res.message || 'Não foi possível salvar a movimentação.');
      }
    } else {
      // Se marcado como recorrente, cadastra a regra para automação nos próximos meses
      if (type === 'despesa' && isRecurring) {
        const dayNum = parseInt(recurringDay, 10) || parseInt(date.split('-')[2], 10) || 5;
        await addRecurringExpense({
          description: finalDescription,
          amount: numericAmount,
          category: selectedCategory,
          categoryId: selectedCategoryId,
          dayOfMonth: dayNum,
          observations: observations.trim(),
          active: true,
        });
      }

      const res = await addTransaction(payload);
      if (res.success) {
        Alert.alert('Sucesso', 'Movimentação cadastrada com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Erro', res.message || 'Não foi possível salvar a movimentação.');
      }
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabeçalho com Logo e Botão Fechar X */}
          <Header rightAction="close" onRightPress={() => navigation.goBack()} />

          {/* Título e Subtítulo */}
          <View style={styles.titleSection}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
              {isEditing ? 'Editar Movimentação' : 'Nova Movimentação'}
            </Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              Preencha os dados abaixo para registrar suas finanças
            </Text>
          </View>

          {/* Card do Formulário */}
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Seletor de Tipo (Despesa / Receita) */}
            <View style={[styles.typeSelectorTrack, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'despesa' && [styles.typeButtonExpenseActive, { backgroundColor: theme.expense }],
                ]}
                onPress={() => setType('despesa')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={18}
                  color={type === 'despesa' ? '#FFFFFF' : theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: type === 'despesa' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  Despesa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'receita' && [styles.typeButtonIncomeActive, { backgroundColor: theme.income }],
                ]}
                onPress={() => setType('receita')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={18}
                  color={type === 'receita' ? '#FFFFFF' : theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: type === 'receita' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  Receita
                </Text>
              </TouchableOpacity>
            </View>

            {/* Status do Lançamento (Realizado ou Pretendido/Futuro) */}
            <View style={styles.statusSection}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Status do Lançamento
              </Text>
              <View style={[styles.statusToggleTrack, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
                <TouchableOpacity
                  style={[
                    styles.statusToggleBtn,
                    status === 'realizado' && [styles.statusToggleBtnActive, { backgroundColor: theme.primary }],
                  ]}
                  onPress={() => setStatus('realizado')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color={status === 'realizado' ? '#FFFFFF' : theme.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.statusToggleText,
                      { color: status === 'realizado' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Realizado
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusToggleBtn,
                    status === 'pretendido' && [styles.statusToggleBtnActive, { backgroundColor: '#F59E0B' }],
                  ]}
                  onPress={() => setStatus('pretendido')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={status === 'pretendido' ? '#FFFFFF' : theme.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.statusToggleText,
                      { color: status === 'pretendido' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Planejado (Futuro)
                  </Text>
                </TouchableOpacity>
              </View>
              {status === 'pretendido' && (
                <Text style={[styles.statusHintText, { color: theme.textSecondary }]}>
                  Gastos planejados não descontam do saldo atual imediatamente; entram na projeção futura e disparam alertas.
                </Text>
              )}
            </View>

            {/* Campo Valor com digitação fluida e instantânea */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Valor
              </Text>
              <View style={[styles.amountInputRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
                <Text style={[styles.currencyPrefix, { color: type === 'receita' ? theme.income : theme.expense }]}>
                  R$
                </Text>
                <TextInput
                  style={[styles.amountInput, { color: theme.textPrimary }]}
                  value={amountDisplay}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  autoCorrect={false}
                  placeholder="0,00"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* Campo Descrição (Opcional) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithOptionalRow}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Descrição
                </Text>
                <Text style={[styles.optionalBadge, { color: theme.textMuted }]}>
                  (opcional)
                </Text>
              </View>
              <View style={[styles.standardInputContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={theme.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.standardInput, { color: theme.textPrimary }]}
                  placeholder={type === 'receita' ? `Ex: ${selectedCategory}` : 'Ex: Almoço, Compras, Gasolina...'}
                  placeholderTextColor={theme.textMuted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Seletor de Categoria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Categoria
              </Text>
              <TouchableOpacity
                style={[styles.selectInputContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}
                onPress={() => setCategoryModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.selectLeft}>
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={theme.primary}
                    style={styles.inputIcon}
                  />
                  <Text style={[styles.selectValueText, { color: theme.textPrimary }]}>
                    {translateCategory(selectedCategory)}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Seletor de Data com Calendário */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Data da Movimentação
              </Text>
              <TouchableOpacity
                style={[styles.selectInputContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}
                onPress={() => setCalendarModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.selectLeft}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={theme.primary}
                    style={styles.inputIcon}
                  />
                  <Text style={[styles.selectValueText, { color: theme.textPrimary }]}>
                    {formatDateDisplay(date, 'pt')}
                  </Text>
                </View>
                <View style={styles.calendarTriggerBadge}>
                  <Ionicons name="calendar" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.calendarTriggerText, { color: theme.primary }]}>
                    Abrir calendário
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Opção de Gasto Recorrente Mensal (Apenas para Despesas) */}
            {type === 'despesa' && (
              <View style={[styles.recurringBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
                <View style={styles.recurringHeaderRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="repeat" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.recurringTitle, { color: theme.textPrimary }]}>
                        Gasto recorrente mensal
                      </Text>
                    </View>
                    <Text style={[styles.recurringSub, { color: theme.textSecondary }]}>
                      Lança automaticamente esta despesa todo mês no dia escolhido
                    </Text>
                  </View>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: theme.borderDark, true: theme.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {isRecurring && (
                  <View style={[styles.recurringDayRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.recurringDayLabel, { color: theme.textPrimary }]}>
                      Dia de vencimento todo mês:
                    </Text>
                    <View style={[styles.dayInputWrapper, { backgroundColor: theme.surface, borderColor: theme.borderDark }]}>
                      <TextInput
                        style={[styles.dayInput, { color: theme.textPrimary }]}
                        value={recurringDay}
                        onChangeText={setRecurringDay}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Campo Observações */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithOptionalRow}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Observações
                </Text>
                <Text style={[styles.optionalBadge, { color: theme.textMuted }]}>
                  (opcional)
                </Text>
              </View>
              <View style={[styles.standardInputContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={theme.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.standardInput, { color: theme.textPrimary }]}
                  placeholder="Informações adicionais ou detalhes..."
                  placeholderTextColor={theme.textMuted}
                  value={observations}
                  onChangeText={setObservations}
                />
              </View>
            </View>

            {/* Botão de Salvar */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Atualizar Movimentação' : 'Salvar Movimentação'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Seleção de Categoria */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Selecione a Categoria
              </Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {availableCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      isSelected && [styles.categoryOptionSelected, { backgroundColor: theme.primaryLight }],
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.name);
                      setSelectedCategoryId(cat.id);
                      setCategoryModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.catLeft}>
                      <View
                        style={[
                          styles.catIconCircle,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.surfaceAlt,
                          },
                        ]}
                      >
                        <Ionicons
                          name={cat.icon}
                          size={18}
                          color={isSelected ? '#FFFFFF' : theme.textPrimary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.catName,
                          { color: isSelected ? theme.textPurple : theme.textPrimary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {translateCategory(cat.name)}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {type === 'despesa' && (
              <TouchableOpacity
                style={[styles.addNewCatInPickerBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
                onPress={() => setCreateCategoryModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.addNewCatInPickerText, { color: theme.primary }]}>
                  + Criar Nova Categoria de Despesa
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Criação de Categoria de Despesa */}
      <CategoryModal
        visible={createCategoryModalVisible}
        onClose={() => setCreateCategoryModalVisible(false)}
        onSaved={(newCat) => {
          setSelectedCategory(newCat.name);
          setSelectedCategoryId(newCat.id);
          setCategoryModalVisible(false);
        }}
      />

      {/* Modal Interativo de Calendário */}
      <CalendarPickerModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        selectedDate={date}
        onSelectDate={handleDateSelected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
    marginTop: 4,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
  },
  formCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  typeSelectorTrack: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonExpenseActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeButtonIncomeActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusSection: {
    marginBottom: 18,
  },
  statusToggleTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
  },
  statusToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusToggleBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusHintText: {
    fontSize: 11,
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 15,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelWithOptionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionalBadge: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    height: '100%',
    fontSize: 22,
    fontWeight: '700',
  },
  standardInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  standardInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  selectInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectValueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarTriggerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calendarTriggerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recurringBox: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  recurringHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recurringSub: {
    fontSize: 12,
    marginTop: 2,
  },
  recurringDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  recurringDayLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  dayInputWrapper: {
    width: 60,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  categoryOptionSelected: {},
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catName: {
    fontSize: 14,
    fontWeight: '500',
  },
  addNewCatInPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  addNewCatInPickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
