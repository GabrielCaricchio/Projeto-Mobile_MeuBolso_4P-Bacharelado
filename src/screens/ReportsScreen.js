// src/screens/ReportsScreen.js
// TELA 6 – RELATÓRIOS: Visão analítica completa com visualização de gastos por categoria, dia, semana, mês e ano

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Header from '../components/Header';
import MonthSelector from '../components/MonthSelector';
import BarComparisonChart from '../components/BarComparisonChart';
import PeriodBarChart from '../components/PeriodBarChart';
import DonutChart from '../components/DonutChart';
import TransactionItem from '../components/TransactionItem';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateDisplay } from '../utils/formatters';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const {
    transactions,
    currentMonthTransactions,
    monthlyResult,
    barChartComparison,
    categoryReport,
    getCategoryReportForTransactions,
    selectedYear,
    selectedMonth,
    exportDataToCSV,
  } = useFinance();
  const { theme } = useTheme();
  const { t, formatMoney, language } = useLanguage();

  // Período selecionado: 'dia' | 'semana' | 'mes' | 'ano' (padrão 'mes')
  const [selectedPeriod, setSelectedPeriod] = useState('mes');

  // Estado para navegação do Dia
  const todayISO = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [activeDayISO, setActiveDayISO] = useState(todayISO);

  // Estado para navegação da Semana (offset de semanas a partir de hoje)
  const [weekOffset, setWeekOffset] = useState(0);

  // Estado para navegação do Ano
  const [activeYear, setActiveYear] = useState(selectedYear || 2026);

  const { savedDiffPct, savedWentUp } = barChartComparison;

  async function handleExport() {
    try {
      const csvData = exportDataToCSV();
      if (!csvData) {
        Alert.alert('Atenção', 'Nenhuma movimentação para exportar.');
        return;
      }
      await Share.share({
        title: 'Relatório Financeiro - Meu Bolso',
        message: csvData,
      });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível compartilhar o relatório.');
    }
  }

  // --- Funções de Navegação de Períodos ---
  function changeDay(delta) {
    const parts = activeDayISO.split('-');
    const cur = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    cur.setDate(cur.getDate() + delta);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    setActiveDayISO(`${y}-${m}-${d}`);
  }

  function changeWeek(delta) {
    setWeekOffset((prev) => prev + delta);
  }

  function changeYear(delta) {
    setActiveYear((prev) => prev + delta);
  }

  // --- Cálculos para o Período: DIA ---
  const dayData = useMemo(() => {
    const dayTxs = (transactions || []).filter((tx) => tx.date === activeDayISO);
    let spent = 0;
    let income = 0;

    dayTxs.forEach((tx) => {
      const val = Number(tx.amount !== undefined ? tx.amount : tx.valor || 0);
      if (tx.type === 'despesa' || tx.tipo === 'despesa') {
        spent += val;
      } else {
        income += val;
      }
    });

    const catReport = getCategoryReportForTransactions(dayTxs);

    return {
      txs: dayTxs,
      spent,
      income,
      balance: income - spent,
      categoryReport: catReport,
    };
  }, [transactions, activeDayISO, getCategoryReportForTransactions]);

  // --- Cálculos para o Período: SEMANA ---
  const weekData = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);

    // Encontra Segunda-feira da semana
    const dayOfWeek = d.getDay(); // 0 = Domingo, 1 = Segunda...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const weekDays = [];
    const weekTxs = [];
    let weekSpent = 0;
    let weekIncome = 0;

    const shortDayNames = language === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);

      const y = dayDate.getFullYear();
      const m = String(dayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayDate.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${dd}`;

      let daySpent = 0;
      (transactions || []).forEach((tx) => {
        if (tx.date === iso) {
          const val = Number(tx.amount !== undefined ? tx.amount : tx.valor || 0);
          weekTxs.push(tx);
          if (tx.type === 'despesa' || tx.tipo === 'despesa') {
            daySpent += val;
            weekSpent += val;
          } else {
            weekIncome += val;
          }
        }
      });

      weekDays.push({
        label: shortDayNames[i],
        secondaryLabel: `${dd}/${m}`,
        dateISO: iso,
        value: daySpent,
        isHighlight: iso === todayISO,
      });
    }

    const startStr = `${monday.getDate()}/${monday.getMonth() + 1}`;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endStr = `${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;

    const catReport = getCategoryReportForTransactions(weekTxs);

    return {
      rangeLabel: `${startStr} - ${endStr}`,
      txs: weekTxs,
      spent: weekSpent,
      income: weekIncome,
      dailyAverage: weekSpent / 7,
      bars: weekDays,
      categoryReport: catReport,
    };
  }, [transactions, weekOffset, todayISO, language, getCategoryReportForTransactions]);

  // --- Cálculos para o Período: ANO ---
  const yearData = useMemo(() => {
    const yearPrefix = `${activeYear}-`;
    const yearTxs = (transactions || []).filter((tx) => tx.date && tx.date.startsWith(yearPrefix));

    let yearSpent = 0;
    let yearIncome = 0;

    const shortMonths = language === 'en'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const monthBars = [];

    for (let m = 0; m < 12; m++) {
      const mStr = String(m + 1).padStart(2, '0');
      const monthKey = `${activeYear}-${mStr}`;

      let mSpent = 0;
      yearTxs.forEach((tx) => {
        if (tx.date.startsWith(monthKey)) {
          const val = Number(tx.amount !== undefined ? tx.amount : tx.valor || 0);
          if (tx.type === 'despesa' || tx.tipo === 'despesa') {
            mSpent += val;
            yearSpent += val;
          } else {
            yearIncome += val;
          }
        }
      });

      monthBars.push({
        label: shortMonths[m],
        value: mSpent,
        isHighlight: m === selectedMonth && activeYear === selectedYear,
      });
    }

    const catReport = getCategoryReportForTransactions(yearTxs);

    return {
      year: activeYear,
      txs: yearTxs,
      spent: yearSpent,
      income: yearIncome,
      saved: yearIncome - yearSpent,
      bars: monthBars,
      categoryReport: catReport,
    };
  }, [transactions, activeYear, selectedMonth, selectedYear, language, getCategoryReportForTransactions]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 85 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <Header />

        {/* Título da Tela e Ação de Exportar */}
        <View style={styles.titleRow}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            {t('reports.title')}
          </Text>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: theme.actionBtnBg }]}
            onPress={handleExport}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Abas de Seleção de Período: DIA | SEMANA | MÊS | ANO */}
        <View style={[styles.periodTabsContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
          <TouchableOpacity
            style={[
              styles.periodTab,
              selectedPeriod === 'dia' && [styles.periodTabActive, { backgroundColor: theme.primary }],
            ]}
            onPress={() => setSelectedPeriod('dia')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodTabText,
                { color: selectedPeriod === 'dia' ? '#FFFFFF' : theme.textSecondary },
                selectedPeriod === 'dia' && { fontWeight: '700' },
              ]}
            >
              {t('reports.periodDay')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodTab,
              selectedPeriod === 'semana' && [styles.periodTabActive, { backgroundColor: theme.primary }],
            ]}
            onPress={() => setSelectedPeriod('semana')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodTabText,
                { color: selectedPeriod === 'semana' ? '#FFFFFF' : theme.textSecondary },
                selectedPeriod === 'semana' && { fontWeight: '700' },
              ]}
            >
              {t('reports.periodWeek')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodTab,
              selectedPeriod === 'mes' && [styles.periodTabActive, { backgroundColor: theme.primary }],
            ]}
            onPress={() => setSelectedPeriod('mes')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodTabText,
                { color: selectedPeriod === 'mes' ? '#FFFFFF' : theme.textSecondary },
                selectedPeriod === 'mes' && { fontWeight: '700' },
              ]}
            >
              {t('reports.periodMonth')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodTab,
              selectedPeriod === 'ano' && [styles.periodTabActive, { backgroundColor: theme.primary }],
            ]}
            onPress={() => setSelectedPeriod('ano')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodTabText,
                { color: selectedPeriod === 'ano' ? '#FFFFFF' : theme.textSecondary },
                selectedPeriod === 'ano' && { fontWeight: '700' },
              ]}
            >
              {t('reports.periodYear')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ==================== VISUALIZAÇÃO POR DIA ==================== */}
        {selectedPeriod === 'dia' && (
          <View>
            {/* Navegador de Dias */}
            <View style={[styles.navigatorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity onPress={() => changeDay(-1)} style={styles.navArrowBtn}>
                <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.navDateMain, { color: theme.textPrimary }]}>
                  {formatDateDisplay(activeDayISO, language)}
                </Text>
                {activeDayISO === todayISO && (
                  <View style={[styles.todayBadge, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.todayBadgeText, { color: theme.primary }]}>
                      {t('reports.today')}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={() => changeDay(1)} style={styles.navArrowBtn}>
                <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Resumo do Dia */}
            <View style={[styles.metricsGrid, { marginHorizontal: 20, marginTop: 12 }]}>
              <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  {t('reports.spentInDay')}
                </Text>
                <Text style={[styles.metricValue, { color: theme.expense }]}>
                  {formatMoney(dayData.spent)}
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  {t('reports.incomesInDay')}
                </Text>
                <Text style={[styles.metricValue, { color: theme.income }]}>
                  {formatMoney(dayData.income)}
                </Text>
              </View>
            </View>

            {/* Gráfico Donut de Gastos por Categoria no Dia */}
            <DonutChart
              reportData={dayData.categoryReport}
              title={`${t('reports.whereMoneyWent')} (${t('reports.periodDay')})`}
              emptyMessage={t('reports.noExpensesPeriod')}
            />

            {/* Movimentações Realizadas no Dia */}
            <View style={[styles.txDaySection, { marginHorizontal: 20, marginTop: 16 }]}>
              <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                {t('reports.transactionsOfPeriod')} ({dayData.txs.length})
              </Text>

              {dayData.txs.length === 0 ? (
                <View style={[styles.emptyDayBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="receipt-outline" size={28} color={theme.textMuted} />
                  <Text style={[styles.emptyDayText, { color: theme.textSecondary }]}>
                    {t('reports.noExpensesPeriod')}
                  </Text>
                </View>
              ) : (
                <View style={[styles.dayTxCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {dayData.txs.map((tx, idx) => (
                    <View key={tx.id}>
                      <TransactionItem transaction={tx} showDateInSubtitle={false} />
                      {idx < dayData.txs.length - 1 && (
                        <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ==================== VISUALIZAÇÃO POR SEMANA ==================== */}
        {selectedPeriod === 'semana' && (
          <View>
            {/* Navegador de Semanas */}
            <View style={[styles.navigatorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.navArrowBtn}>
                <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.navDateMain, { color: theme.textPrimary }]}>
                  {weekData.rangeLabel}
                </Text>
                {weekOffset === 0 && (
                  <View style={[styles.todayBadge, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.todayBadgeText, { color: theme.primary }]}>
                      {t('reports.thisWeek')}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={() => changeWeek(1)} style={styles.navArrowBtn}>
                <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Resumo da Semana */}
            <View style={[styles.metricsGrid, { marginHorizontal: 20, marginTop: 12 }]}>
              <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  {t('reports.spentInWeek')}
                </Text>
                <Text style={[styles.metricValue, { color: theme.expense }]}>
                  {formatMoney(weekData.spent)}
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  {t('reports.dailyAverage')}
                </Text>
                <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                  {formatMoney(weekData.dailyAverage)}
                </Text>
              </View>
            </View>

            {/* Gráfico Donut de Gastos por Categoria na Semana */}
            <DonutChart
              reportData={weekData.categoryReport}
              title={`${t('reports.whereMoneyWent')} (${t('reports.periodWeek')})`}
              emptyMessage={t('reports.noExpensesPeriod')}
            />

            {/* Gráfico de Barras dos 7 Dias da Semana */}
            <PeriodBarChart
              title={t('reports.weeklyDistribution')}
              subtitle={language === 'en' ? 'Daily expenses from Monday to Sunday' : 'Gastos diários de segunda a domingo'}
              bars={weekData.bars}
            />
          </View>
        )}

        {/* ==================== VISUALIZAÇÃO POR MÊS ==================== */}
        {selectedPeriod === 'mes' && (
          <View>
            {/* Seletor de Mês e Ano */}
            <MonthSelector />

            {/* Card 1: Total Economizado no Mês - Verde para positivo, Vermelho para negativo */}
            <View style={[styles.savedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.savedLeft}>
                <Text style={[styles.savedLabel, { color: theme.textSecondary }]}>
                  {t('reports.totalSavedMonth')}
                </Text>
                <Text
                  style={[
                    styles.savedValue,
                    { color: monthlyResult >= 0 ? theme.income : theme.expense },
                  ]}
                >
                  {monthlyResult >= 0
                    ? `+ ${formatMoney(monthlyResult)}`
                    : `- ${formatMoney(Math.abs(monthlyResult))}`}
                </Text>
              </View>

              {/* Badge de comparação com o mês anterior */}
              <View
                style={[
                  styles.diffBadge,
                  {
                    backgroundColor:
                      monthlyResult >= 0 ? theme.primaryLight : theme.expenseLight,
                  },
                ]}
              >
                <Ionicons
                  name={savedWentUp ? 'arrow-up-outline' : 'arrow-down-outline'}
                  size={14}
                  color={monthlyResult >= 0 ? theme.primary : theme.expense}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.diffText,
                    { color: monthlyResult >= 0 ? theme.primary : theme.expense },
                  ]}
                >
                  {savedDiffPct}%
                </Text>
              </View>
            </View>

            {/* Card 2: Gráfico Donut de Distribuição por Categoria no Mês */}
            <DonutChart
              reportData={categoryReport}
              title={`${t('reports.whereMoneyWent')} (${t('reports.periodMonth')})`}
              emptyMessage={t('reports.noExpensesInMonth')}
            />

            {/* Card 3: Gráfico de Barras Comparativo entre Meses */}
            <BarComparisonChart />
          </View>
        )}

        {/* ==================== VISUALIZAÇÃO POR ANO ==================== */}
        {selectedPeriod === 'ano' && (
          <View>
            {/* Navegador de Ano */}
            <View style={[styles.navigatorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity onPress={() => changeYear(-1)} style={styles.navArrowBtn}>
                <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.navDateMain, { color: theme.textPrimary }]}>
                  {yearData.year}
                </Text>
                {activeYear === new Date().getFullYear() && (
                  <View style={[styles.todayBadge, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.todayBadgeText, { color: theme.primary }]}>
                      {t('reports.thisYear')}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={() => changeYear(1)} style={styles.navArrowBtn}>
                <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Resumo Anual */}
            <View style={[styles.metricsGrid, { marginHorizontal: 20, marginTop: 12 }]}>
              <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  {t('reports.spentInYear')}
                </Text>
                <Text style={[styles.metricValue, { color: theme.expense }]}>
                  {formatMoney(yearData.spent)}
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  {t('reports.incomesInYear')}
                </Text>
                <Text style={[styles.metricValue, { color: theme.income }]}>
                  {formatMoney(yearData.income)}
                </Text>
              </View>
            </View>

            {/* Gráfico Donut de Gastos por Categoria no Ano */}
            <DonutChart
              reportData={yearData.categoryReport}
              title={`${t('reports.whereMoneyWent')} (${t('reports.periodYear')} ${activeYear})`}
              emptyMessage={t('reports.noExpensesPeriod')}
            />

            {/* Gráfico de Barras dos 12 Meses do Ano */}
            <PeriodBarChart
              title={t('reports.yearlyDistribution')}
              subtitle={language === 'en' ? `Monthly expense evolution throughout ${activeYear}` : `Evolução mensal de gastos ao longo de ${activeYear}`}
              bars={yearData.bars}
            />
          </View>
        )}
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
  exportButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navigatorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderWidth: 1,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navDateMain: {
    fontSize: 16,
    fontWeight: '700',
  },
  todayBadge: {
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  savedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  savedLeft: {
    flex: 1,
  },
  savedLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  savedValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  diffText: {
    fontSize: 12,
    fontWeight: '700',
  },
  txDaySection: {
    marginTop: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyDayBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
  },
  emptyDayText: {
    fontSize: 14,
  },
  dayTxCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  itemDivider: {
    height: 1,
  },
});
