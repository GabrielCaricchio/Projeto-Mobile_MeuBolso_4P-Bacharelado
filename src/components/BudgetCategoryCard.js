// src/components/BudgetCategoryCard.js
// Linha de progresso e limites de orçamento por categoria com suporte a temas e idioma

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function BudgetCategoryCard({ categoryData, onEditPress }) {
  const { theme } = useTheme();
  const { translateCategory, language } = useLanguage();

  const {
    name,
    icon,
    spent,
    limit,
    percent,
    isNearLimit,
    isOverLimit,
  } = categoryData;

  const clampedPercent = Math.min(100, Math.max(0, percent));
  const barColor = isOverLimit ? theme.expense : theme.primary;
  const currencySymbol = language === 'en' ? '$' : 'R$';

  return (
    <View style={styles.container}>
      {/* Topo: Ícone, Nome da Categoria, Ícone de Alerta e Valores */}
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name={icon || 'receipt-outline'} size={18} color={theme.primary} />
          </View>
          <Text style={[styles.categoryName, { color: theme.textPrimary }]}>
            {translateCategory(name)}
          </Text>
          {isNearLimit && (
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={theme.primary}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.amountsText, { color: theme.textSecondary }]}>
            {currencySymbol} {Math.round(spent).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')} / {Math.round(limit).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}
          </Text>
          {onEditPress && (
            <TouchableOpacity
              onPress={onEditPress}
              style={[styles.editIconBtn, { backgroundColor: theme.surfaceAlt }]}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={13} color={theme.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Barra de Progresso Horizontal */}
      <View style={[styles.progressBarTrack, { backgroundColor: theme.borderDark }]}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${clampedPercent}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Linha inferior: Restante e Percentual */}
      <View style={styles.bottomRow}>
        <Text style={[styles.remainingText, { color: theme.textSecondary }]}>
          {isOverLimit ? (
            <Text style={{ color: theme.expense, fontWeight: '600' }}>
              {language === 'en' ? 'Limit exceeded' : 'Limite ultrapassado'}
            </Text>
          ) : (
            `${language === 'en' ? 'Remaining' : 'Restam'}: ${currencySymbol} ${Math.round(Math.max(0, limit - spent)).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}`
          )}
        </Text>
        <Text
          style={[
            styles.percentText,
            { color: isOverLimit ? theme.expense : theme.textSecondary },
          ]}
        >
          {percent}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 12,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
