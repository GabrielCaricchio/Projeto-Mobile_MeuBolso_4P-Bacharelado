// src/components/PeriodBarChart.js
// Gráfico de barras responsivo para visualização de gastos por períodos (Semana: 7 dias / Ano: 12 meses)

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function PeriodBarChart({
  title,
  subtitle = null,
  bars = [],
  highlightColor = null,
}) {
  const { theme } = useTheme();
  const { language, formatMoney } = useLanguage();

  const maxVal = Math.max(...bars.map((b) => Number(b.value) || 0), 10);
  const chartHeight = 110;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.chartContainer, { height: chartHeight + 35 }]}>
        <View style={styles.barsRow}>
          {bars.map((item, index) => {
            const val = Number(item.value) || 0;
            const heightPct = maxVal > 0 ? (val / maxVal) : 0;
            const barHeight = Math.max(val > 0 ? 8 : 2, Math.round(heightPct * chartHeight));
            const isHighlight = item.isHighlight;
            const activeColor = isHighlight
              ? (highlightColor || theme.primary)
              : (val > 0 ? theme.primary : theme.borderDark);

            return (
              <View key={`bar-${index}`} style={styles.barColumn}>
                {/* Valor acima da barra se houver espaço e valor */}
                <View style={styles.valueContainer}>
                  {val > 0 && (
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.barValueText,
                        { color: isHighlight ? theme.primary : theme.textSecondary },
                      ]}
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
                    </Text>
                  )}
                </View>

                {/* Coluna da barra */}
                <View style={[styles.barTrack, { height: chartHeight }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        backgroundColor: activeColor,
                        opacity: isHighlight ? 1 : 0.75,
                      },
                    ]}
                  />
                </View>

                {/* Rótulo inferior */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: isHighlight ? theme.textPurple : theme.textSecondary,
                      fontWeight: isHighlight ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chartContainer: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  valueContainer: {
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '600',
  },
  barTrack: {
    width: '55%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  label: {
    fontSize: 11,
    marginTop: 8,
  },
});

