// src/components/TransactionItem.js
// Item de movimentação financeira com ícone contextual, categoria, formatação de valor, tema, idioma e badge de recorrência

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDateShort } from '../utils/formatters';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

function getCategoryIcon(category, type, theme) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('supermercado') || cat.includes('alimenta') || cat.includes('food')) {
    return { name: 'basket-outline', bg: theme.primaryLight, color: theme.primary };
  }
  if (cat.includes('restaurante') || cat.includes('dining')) {
    return { name: 'restaurant-outline', bg: theme.primaryLight, color: theme.primary };
  }
  if (cat.includes('transporte') || cat.includes('transport')) {
    return { name: 'bus-outline', bg: theme.primaryLight, color: theme.primary };
  }
  if (cat.includes('freelance') || cat.includes('renda') || cat.includes('side')) {
    return { name: 'briefcase-outline', bg: theme.incomeLight, color: theme.income };
  }
  if (cat.includes('cinema') || cat.includes('lazer') || cat.includes('passeio') || cat.includes('leisure')) {
    return { name: 'ticket-outline', bg: theme.primaryLight, color: theme.primary };
  }
  if (cat.includes('contas') || cat.includes('serviço') || cat.includes('outros') || cat.includes('others')) {
    return { name: 'receipt-outline', bg: theme.primaryLight, color: theme.primary };
  }
  if (cat.includes('salário') || cat.includes('salario') || cat.includes('salary')) {
    return { name: 'wallet-outline', bg: theme.incomeLight, color: theme.income };
  }
  if (cat.includes('aluguel') || cat.includes('moradia') || cat.includes('housing')) {
    return { name: 'home-outline', bg: theme.primaryLight, color: theme.primary };
  }
  if (type === 'receita') {
    return { name: 'arrow-down-circle-outline', bg: theme.incomeLight, color: theme.income };
  }
  return { name: 'card-outline', bg: theme.primaryLight, color: theme.primary };
}

export default function TransactionItem({
  transaction,
  onPress,
  onConvertPress,
  showDateInSubtitle = true,
}) {
  const { description, amount, type, category, date, isRecurring, status } = transaction;
  const { theme } = useTheme();
  const { language, translateCategory, formatMoney, t } = useLanguage();

  const isIncome = type === 'receita';
  const isPlanned = status === 'pretendido';
  const iconConfig = getCategoryIcon(category, type, theme);

  const formattedAmount = isIncome
    ? `+ ${formatMoney(amount)}`
    : `− ${formatMoney(amount)}`;

  const translatedCat = translateCategory(category);
  const subtitleText = showDateInSubtitle && date
    ? `${translatedCat} · ${formatDateShort(date, language)}`
    : translatedCat;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Ícone contextual da categoria */}
      <View style={[styles.iconCircle, { backgroundColor: isPlanned ? 'rgba(245, 158, 11, 0.15)' : iconConfig.bg }]}>
        <Ionicons
          name={isPlanned ? 'time-outline' : iconConfig.name}
          size={18}
          color={isPlanned ? '#F59E0B' : iconConfig.color}
        />
      </View>

      {/* Informações centrais: Descrição e Categoria/Data */}
      <View style={styles.textContainer}>
        <View style={styles.descRow}>
          <Text
            style={[styles.description, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {description}
          </Text>
          {isPlanned && (
            <View style={[styles.plannedBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="time" size={10} color="#D97706" style={{ marginRight: 3 }} />
              <Text style={[styles.plannedBadgeText, { color: '#D97706' }]}>
                {language === 'en' ? 'Planned' : 'Planejado'}
              </Text>
            </View>
          )}
          {isRecurring && (
            <View style={[styles.recurringBadge, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="repeat" size={10} color={theme.textPurple} style={{ marginRight: 3 }} />
              <Text style={[styles.recurringBadgeText, { color: theme.textPurple }]}>
                {t('recurring.badge')}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {subtitleText}
        </Text>
      </View>

      {/* Ação rápida de 1 toque para efetivar gasto futuro planejado (RF02) */}
      {isPlanned && onConvertPress ? (
        <TouchableOpacity
          style={[styles.convertBtn, { backgroundColor: theme.incomeLight, borderColor: theme.income }]}
          onPress={onConvertPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done" size={14} color={theme.incomeDark} style={{ marginRight: 4 }} />
          <Text style={[styles.convertBtnText, { color: theme.incomeDark }]}>
            {language === 'en' ? 'Pay' : 'Efetivar'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Valor monetário formatado */}
      <Text
        style={[
          styles.amount,
          { color: isIncome ? theme.income : isPlanned ? '#D97706' : theme.expense },
        ]}
      >
        {formattedAmount}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 6,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recurringBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  plannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  plannedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  convertBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
