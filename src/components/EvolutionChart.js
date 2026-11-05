// src/components/EvolutionChart.js
// Gráfico vetorial SVG da evolução do saldo ao longo do mês com suporte a temas e idioma

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function EvolutionChart({ onMonthPress }) {
  const {
    initialBalance,
    monthlyResult,
    evolutionPoints,
    selectedMonth,
  } = useFinance();
  const { theme } = useTheme();
  const { t, language, formatMoney } = useLanguage();

  const [activePoint, setActivePoint] = useState(null);

  const chartWidth = SCREEN_WIDTH - 40 - 32;
  const chartHeight = 120;
  const paddingX = 10;
  const paddingTop = 15;
  const paddingBottom = 20;

  const balances = evolutionPoints.map((p) => p.balance);
  const minVal = Math.min(...balances, initialBalance) * 0.8;
  const maxBalance = Math.max(...balances, initialBalance);
  const maxVal = (maxBalance > 0 ? maxBalance : 100) * 1.15;
  const range = maxVal - minVal || 1;

  const divisor = evolutionPoints.length > 1 ? evolutionPoints.length - 1 : 1;
  const coords = (evolutionPoints || []).map((pt, index) => {
    const x = paddingX + (index / divisor) * (chartWidth - paddingX * 2);
    const normalizedY = (pt.balance - minVal) / range;
    const y = paddingTop + (1 - normalizedY) * (chartHeight - paddingTop - paddingBottom);
    return { ...pt, x, y };
  });

  function buildSmoothPath(points) {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  const linePath = buildSmoothPath(coords);
  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x} ${chartHeight - paddingBottom} L ${coords[0].x} ${chartHeight - paddingBottom} Z`
    : '';

  const monthNamesPT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const monthNamesEN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = language === 'en' ? monthNamesEN[selectedMonth] : monthNamesPT[selectedMonth];

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Linha 1: Título e Seletor do Mês */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('dashboard.balanceEvolution')}
        </Text>
        <TouchableOpacity
          style={[styles.monthBadge, { backgroundColor: theme.surfaceAlt }]}
          onPress={onMonthPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.monthBadgeText, { color: theme.textPrimary }]}>
            {currentMonthName}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Linha 2: Saldo Inicial e Badge de Variação no Mês */}
      <View style={styles.subHeaderRow}>
        <Text style={[styles.initialBalanceText, { color: theme.textSecondary }]}>
          {t('dashboard.initialBalance')}: {formatMoney(initialBalance)}
        </Text>
        <View style={[styles.gainBadge, { backgroundColor: theme.incomeLight }]}>
          <Text style={[styles.gainBadgeText, { color: theme.incomeDark }]}>
            {monthlyResult >= 0 ? '+' : '−'} {formatMoney(Math.abs(monthlyResult))} {t('dashboard.inTheMonth')}
          </Text>
        </View>
      </View>

      {/* SVG da Curva */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.primary} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={theme.primary} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Área sombreada sob a curva */}
          {areaPath ? <Path d={areaPath} fill="url(#gradientArea)" /> : null}

          {/* Linha curva principal */}
          {linePath ? (
            <Path
              d={linePath}
              fill="none"
              stroke={theme.primary}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : null}

          {/* Pontos nos checkpoints de dias */}
          {coords.map((pt, idx) => (
            <Circle
              key={`dot-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={activePoint?.day === pt.day ? '5' : '3'}
              fill={theme.surface}
              stroke={theme.primary}
              strokeWidth="2"
              onPress={() => setActivePoint(pt)}
            />
          ))}

          {/* Rótulos de datas no eixo X */}
          {coords.map((pt, idx) => {
            if (idx === 0 || idx === coords.length - 1 || idx % 2 === 0) {
              return (
                <SvgText
                  key={`lbl-${idx}`}
                  x={pt.x}
                  y={chartHeight - 4}
                  fontSize="10"
                  fill={theme.textMuted}
                  textAnchor="middle"
                >
                  {pt.label}
                </SvgText>
              );
            }
            return null;
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
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
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  initialBalanceText: {
    fontSize: 12,
  },
  gainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gainBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
});
