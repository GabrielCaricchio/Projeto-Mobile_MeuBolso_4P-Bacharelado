// src/screens/BudgetScreen.js
// TELA 5 – ORÇAMENTO: Planejamento financeiro, limites por categoria, progresso, gastos recorrentes, temas e idioma

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Header from '../components/Header';
import MonthSelector from '../components/MonthSelector';
import BudgetCategoryCard from '../components/BudgetCategoryCard';
import BudgetModal from '../components/BudgetModal';
import CategoryModal from '../components/CategoryModal';
import CalendarPickerModal from '../components/CalendarPickerModal';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPercentage } from '../utils/formatters';

export default function BudgetScreen({ navigation, route }) {
  const highlightCategory = route?.params?.highlightCategory;
  const insets = useSafeAreaInsets();

  const {
    budgetSummary,
    categoryBudgetsStatus,
    budgetAlertCategory,
    recurringMonthlyTotal,
    recurringExpenses,
    selectedYear,
    selectedMonth,
    setMonthAndYear,
  } = useFinance();
  const { theme } = useTheme();
  const { t, formatMoney, language } = useLanguage();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const { planned, used, available, percentage } = budgetSummary;
  const activeRecurringCount = (recurringExpenses || []).filter((r) => r.active !== false).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 85 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <Header />

        {/* Título da Tela e Ícone de Ajuste de Limites */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
              {t('budget.title')}
            </Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              {t('budget.subtitle')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.optionsButton, { backgroundColor: theme.actionBtnBg }]}
            onPress={() => setEditModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Seletor de Mês e Ano com abertura do calendário */}
        <MonthSelector onCalendarPress={() => setCalendarModalVisible(true)} />

        {/* Card Resumo do Orçamento Geral */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.summaryValuesRow}>
            {/* Planejado no mês */}
            <View>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                {t('budget.plannedInMonth')}
              </Text>
              <Text style={[styles.plannedValue, { color: theme.textPrimary }]}>
                {formatMoney(planned)}
              </Text>
            </View>

            {/* Já utilizado */}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                {t('budget.alreadyUsed')}
              </Text>
              <Text style={[styles.usedValue, { color: theme.textPrimary }]}>
                {formatMoney(used)}
              </Text>
            </View>
          </View>

          {/* Barra de Progresso Principal */}
          <View style={[styles.mainProgressTrack, { backgroundColor: theme.borderDark }]}>
            <View
              style={[
                styles.mainProgressFill,
                {
                  width: `${Math.min(100, percentage)}%`,
                  backgroundColor: percentage > 100 ? theme.expense : theme.primary,
                },
              ]}
            />
          </View>

          {/* Linha inferior: Disponível e Porcentagem */}
          <View style={styles.summaryFooterRow}>
            <Text style={[styles.availableText, { color: theme.textSecondary }]}>
              {t('budget.available')}:{' '}
              <Text style={[styles.availableValue, { color: theme.income }]}>
                {formatMoney(available)}
              </Text>
            </Text>
            <Text style={[styles.percentageText, { color: theme.textSecondary }]}>
              {formatPercentage(percentage, 0, language)} {t('budget.used')}
            </Text>
          </View>
        </View>

        {/* Card Didático de Alerta (quando categoria passa de 90%) */}
        {budgetAlertCategory && (
          <View
            style={[
              styles.alertCard,
              {
                backgroundColor: theme.warningBg,
                borderColor: theme.warningBorder,
              },
            ]}
          >
            <View style={styles.alertTopRow}>
              <View style={[styles.alertIconBadge, { backgroundColor: theme.primary }]}>
                <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.alertTitle, { color: theme.warningText }]}>
                {t('budget.budgetAlertTitle')}
              </Text>
            </View>
            <Text style={[styles.alertDescription, { color: theme.textPrimary }]}>
              <Text style={{ fontWeight: '700' }}>{budgetAlertCategory.name}</Text>{' '}
              {budgetAlertCategory.isOverLimit
                ? t('budget.budgetAlertOver')
                : t('budget.budgetAlertNear')}{' '}
              <Text style={{ fontWeight: '700', color: theme.expense }}>
                {budgetAlertCategory.percent}% {t('budget.usedWord')}
              </Text>
              .
            </Text>
          </View>
        )}

        {/* Seção: Limites por Categoria */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {t('budget.categoriesSection')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategoryToEdit(null);
                  setCategoryModalVisible(true);
                }}
                style={[styles.addCategoryHeaderBtn, { backgroundColor: theme.primaryLight }]}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={theme.primary} />
                <Text style={[styles.addCategoryHeaderText, { color: theme.primary }]}>
                  {language === 'en' ? 'New Category' : 'Nova Categoria'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditModalVisible(true)}
                activeOpacity={0.7}
                style={{ marginLeft: 12 }}
              >
                <Text style={[styles.editLimitLink, { color: theme.textPurple }]}>
                  {t('common.edit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista dos cards de categoria */}
          <View
            style={[
              styles.categoriesContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {categoryBudgetsStatus.map((cat, index) => {
              const isHighlighted = highlightCategory === cat.id || highlightCategory === cat.name;
              return (
                <View
                  key={cat.id}
                  style={isHighlighted ? [styles.highlightedCategoryWrapper, { borderColor: theme.primary }] : null}
                >
                  <BudgetCategoryCard
                    categoryData={cat}
                    onEditPress={() => {
                      setSelectedCategoryToEdit(cat);
                      setCategoryModalVisible(true);
                    }}
                  />
                  {index < categoryBudgetsStatus.length - 1 && (
                    <View style={[styles.categoryDivider, { backgroundColor: theme.border }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Card de Automação de Gastos Recorrentes */}
        <View
          style={[
            styles.recurringCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.recurringTopRow}>
            <View style={[styles.recurringIconBadge, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="repeat" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recurringCardTitle, { color: theme.textPrimary }]}>
                {t('recurring.title')}
              </Text>
              <Text style={[styles.recurringCardSub, { color: theme.textSecondary }]}>
                {t('recurring.quickBannerDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.recurringBottomRow}>
            <View>
              <Text style={[styles.recurringTotalLabel, { color: theme.textSecondary }]}>
                {t('recurring.monthlyFixedTotal')}
              </Text>
              <Text style={[styles.recurringTotalVal, { color: theme.textPrimary }]}>
                {formatMoney(recurringMonthlyTotal)} ({activeRecurringCount} ativos)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.manageBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('RecurringExpenses')}
              activeOpacity={0.85}
            >
              <Text style={styles.manageBtnText}>{t('common.edit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal Didático de Ajuste de Limites */}
      <BudgetModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
      />

      {/* Modal de Criação e Edição de Categorias de Despesas */}
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => {
          setCategoryModalVisible(false);
          setSelectedCategoryToEdit(null);
        }}
        categoryToEdit={selectedCategoryToEdit}
      />

      {/* Modal de Calendário para Navegação Rápida entre Meses/Anos e Dias Específicos */}
      <CalendarPickerModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSelectMonthYear={(year, month) => {
          setMonthAndYear(year, month);
        }}
        onSelectDate={(dateStr) => {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            setMonthAndYear(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1);
          }
        }}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  optionsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  plannedValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  usedValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  mainProgressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  mainProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  summaryFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableText: {
    fontSize: 13,
    fontWeight: '500',
  },
  availableValue: {
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  alertCard: {
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  editLimitLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  addCategoryHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addCategoryHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  categoriesContainer: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  highlightedCategoryWrapper: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 2,
    marginVertical: 4,
  },
  categoryDivider: {
    height: 1,
  },
  recurringCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  recurringTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recurringIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recurringCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  recurringCardSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  recurringBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  recurringTotalLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  recurringTotalVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  manageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
