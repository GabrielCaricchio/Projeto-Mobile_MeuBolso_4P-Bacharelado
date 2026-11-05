// src/components/BarComparisonChart.js
// Gráfico vetorial de barras comparando receitas e despesas com suporte a tema e idioma

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function BarComparisonChart() {
  const { barChartComparison } = useFinance();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { months } = barChartComparison;

  const cardWidth = SCREEN_WIDTH - 40;
  const chartWidth = cardWidth - 36;
  const chartHeight = 150;
  const barWidth = 24;
  const barGap = 6;
  const highestValue = Math.max(0, ...(months || []).map((m) => Math.max(m.incomes || 0, m.expenses || 0)));
  const maxVal = highestValue > 0 ? highestValue * 1.25 : 1000;

  const enShortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Cabeçalho do Card */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('reports.incomesAndExpenses')}
        </Text>
        <Text style={[styles.unitText, { color: theme.textSecondary }]}>
          {language === 'en' ? 'in $' : 'em R$'}
        </Text>
      </View>

      {/* Legenda: Receitas e Despesas */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.chartIncome }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            {t('common.incomes')}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.chartExpense }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            {t('common.expenses')}
          </Text>
        </View>
      </View>

      {/* Gráfico SVG de Barras */}
      <View style={styles.svgContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {months.map((m, index) => {
            const groupWidth = barWidth * 2 + barGap;
            const groupSpacing = (chartWidth - groupWidth * months.length) / (months.length + 1);
            const groupX = groupSpacing + index * (groupWidth + groupSpacing);

            // Alturas proporcionais das barras
            const incomeBarHeight = (m.incomes / maxVal) * 105;
            const expenseBarHeight = (m.expenses / maxVal) * 105;

            const incomeY = chartHeight - 25 - incomeBarHeight;
            const expenseY = chartHeight - 25 - expenseBarHeight;

            // Rótulo do mês adaptado ao idioma
            let monthLabel = m.monthLabel;
            if (language === 'en' && m.monthIndex !== undefined) {
              monthLabel = enShortMonths[m.monthIndex];
            } else if (language === 'en') {
              if (m.monthLabel === 'Ago') monthLabel = 'Aug';
              if (m.monthLabel === 'Set') monthLabel = 'Sep';
              if (m.monthLabel === 'Out') monthLabel = 'Oct';
              if (m.monthLabel === 'Atual') monthLabel = 'Now';
            }

            return (
              <G key={`bar-group-${index}`}>
                {/* Rótulo de valor sobre a barra de receita */}
                <SvgText
                  x={groupX + barWidth / 2}
                  y={incomeY - 4}
                  fontSize="10"
                  fontWeight="600"
                  fill={theme.chartIncome}
                  textAnchor="middle"
                >
                  {Math.round(m.incomes).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}
                </SvgText>

                {/* Barra de Receita (Verde) */}
                {incomeBarHeight > 0 && (
                  <Rect
                    x={groupX}
                    y={incomeY}
                    width={barWidth}
                    height={Math.max(2, incomeBarHeight)}
                    rx="4"
                    ry="4"
                    fill={theme.chartIncome}
                  />
                )}

                {/* Rótulo de valor sobre a barra de despesa */}
                <SvgText
                  x={groupX + barWidth + barGap + barWidth / 2}
                  y={expenseY - 4}
                  fontSize="10"
                  fontWeight="600"
                  fill={theme.chartExpense}
                  textAnchor="middle"
                >
                  {Math.round(m.expenses).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}
                </SvgText>

                {/* Barra de Despesa (Salmão/Coral) */}
                {expenseBarHeight > 0 && (
                  <Rect
                    x={groupX + barWidth + barGap}
                    y={expenseY}
                    width={barWidth}
                    height={Math.max(2, expenseBarHeight)}
                    rx="4"
                    ry="4"
                    fill={theme.chartExpense}
                  />
                )}

                {/* Nome do Mês abaixo das barras */}
                <SvgText
                  x={groupX + groupWidth / 2}
                  y={chartHeight - 6}
                  fontSize="12"
                  fontWeight="600"
                  fill={theme.textPrimary}
                  textAnchor="middle"
                >
                  {monthLabel}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 12,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  svgContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
});
