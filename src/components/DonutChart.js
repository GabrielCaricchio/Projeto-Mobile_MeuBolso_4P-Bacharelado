// src/components/DonutChart.js
// Gráfico Donut com anel circular SVG e legenda de despesas por período

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function DonutChart({ reportData, categoryReport, title, emptyMessage }) {
  const { theme } = useTheme();
  const { t, formatMoney, translateCategory } = useLanguage();

  const effectiveReport = reportData || categoryReport;
  const { items = [], totalExpense = 0, topExpense = null } = effectiveReport || {};

  const size = 130;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  function polarToCartesian(centerX, centerY, rad, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(angleInRadians),
      y: centerY + rad * Math.sin(angleInRadians),
    };
  }

  function describeArc(x, y, rad, startAngle, endAngle) {
    const start = polarToCartesian(x, y, rad, endAngle);
    const end = polarToCartesian(x, y, rad, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', start.x, start.y,
      'A', rad, rad, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  }

  const arcs = items.map((item, index) => {
    const prevSweep = items.slice(0, index).reduce((acc, prev) => {
      const pct = totalExpense > 0 ? prev.amount / totalExpense : 0;
      return acc + Math.max(1, pct * 360);
    }, 0);
    const percentage = totalExpense > 0 ? item.amount / totalExpense : 0;
    const sweepAngle = Math.max(1, percentage * 360);
    const startAngle = -90 + prevSweep;
    const endAngle = startAngle + sweepAngle;

    return {
      ...item,
      path: describeArc(center, center, radius, startAngle, endAngle - 1.5),
    };
  });

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {title || t('reports.whereMoneyWent')}
      </Text>

      <View style={styles.contentRow}>
        {/* Gráfico Donut SVG */}
        <View style={styles.donutWrapper}>
          <Svg width={size} height={size}>
            <G>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={theme.borderDark}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {arcs.map((arc, index) => (
                <Path
                  key={`arc-${arc.category || index}`}
                  d={arc.path}
                  stroke={arc.color || theme.primary}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                />
              ))}
            </G>
          </Svg>
          <View style={styles.donutCenter}>
            <Text style={[styles.donutTotalLabel, { color: theme.textSecondary }]}>
              {t('common.total')}
            </Text>
            <Text style={[styles.donutTotalValue, { color: theme.textPrimary }]}>
              {formatMoney(totalExpense)}
            </Text>
          </View>
        </View>

        {/* Legenda Lateral */}
        <View style={styles.legendContainer}>
          {items.length === 0 ? (
            <Text style={[styles.emptyLegendText, { color: theme.textMuted }]}>
              {emptyMessage || t('reports.noExpensesPeriod')}
            </Text>
          ) : (
            items.slice(0, 4).map((item, index) => (
              <View key={`legend-${item.category || index}`} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color || theme.primary }]} />
                <View style={styles.legendTexts}>
                  <Text
                    style={[styles.legendName, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {translateCategory ? translateCategory(item.category) : item.category}
                  </Text>
                  <Text style={[styles.legendAmount, { color: theme.textSecondary }]}>
                    {formatMoney(item.amount)} ({item.percentage || 0}%)
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Destaque do Maior Gasto */}
      {topExpense && (
        <View style={[styles.topExpenseBox, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.topExpenseText, { color: theme.textSecondary }]}>
            {t('reports.topExpense')}:{' '}
            <Text style={{ fontWeight: '700', color: theme.expense }}>
              {translateCategory ? translateCategory(topExpense.category) : topExpense.category} ({formatMoney(topExpense.amount)})
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donutWrapper: {
    width: 130,
    height: 130,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTotalLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  donutTotalValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendTexts: {
    flex: 1,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendAmount: {
    fontSize: 11,
    marginTop: 1,
  },
  topExpenseBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  topExpenseText: {
    fontSize: 12,
  },
  emptyLegendText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
