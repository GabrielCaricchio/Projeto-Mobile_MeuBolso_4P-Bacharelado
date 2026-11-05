// src/components/BalanceCard.js
// Card principal de saldo com toggle de visualização, receitas/despesas, temas e idioma

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { shadows } from '../styles/theme';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function BalanceCard({ onReceitasPress, onDespesasPress }) {
  const {
    currentTotalBalance,
    projectedFutureBalance,
    pendingExpenses,
    monthlyIncomes,
    monthlyExpenses,
    isBalanceVisible,
    toggleBalanceVisibility,
  } = useFinance();
  const { theme } = useTheme();
  const { t, formatMoney, language } = useLanguage();

  const formattedBalance = isBalanceVisible
    ? formatMoney(currentTotalBalance)
    : `${language === 'en' ? '$' : 'R$'} ••••••`;

  const formattedIncomes = isBalanceVisible
    ? formatMoney(monthlyIncomes)
    : '••••••';

  const formattedExpenses = isBalanceVisible
    ? formatMoney(monthlyExpenses)
    : '••••••';

  return (
    <View style={[styles.card, { backgroundColor: theme.primary }]}>
      {/* Topo do card: Rótulo e Botão de Ocultar/Exibir Saldo */}
      <View style={styles.topRow}>
        <Text style={styles.label}>{t('dashboard.totalBalance')}</Text>
        <TouchableOpacity
          onPress={toggleBalanceVisibility}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isBalanceVisible ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Valor do Saldo Principal */}
      <Text style={styles.balanceValue}>{formattedBalance}</Text>

      {/* Linha inferior com dois cards translúcidos: Receitas e Despesas */}
      <View style={styles.subCardsRow}>
        {/* Sub-card Receitas */}
        <TouchableOpacity
          style={styles.subCard}
          activeOpacity={0.85}
          onPress={onReceitasPress}
        >
          <View style={styles.subCardHeader}>
            <View style={styles.incomeIconBadge}>
              <Ionicons
                name="arrow-down-outline"
                size={13}
                color="#FFFFFF"
                style={{ transform: [{ rotate: '45deg' }] }}
              />
            </View>
            <Text style={styles.subCardLabel}>{t('dashboard.incomesMonth')}</Text>
          </View>
          <Text style={styles.subCardValue}>{formattedIncomes}</Text>
        </TouchableOpacity>

        {/* Sub-card Despesas */}
        <TouchableOpacity
          style={styles.subCard}
          activeOpacity={0.85}
          onPress={onDespesasPress}
        >
          <View style={styles.subCardHeader}>
            <View style={styles.expenseIconBadge}>
              <Ionicons
                name="arrow-up-outline"
                size={13}
                color="#FFFFFF"
                style={{ transform: [{ rotate: '45deg' }] }}
              />
            </View>
            <Text style={styles.subCardLabel}>{t('dashboard.expensesMonth')}</Text>
          </View>
          <Text style={styles.subCardValue}>{formattedExpenses}</Text>
        </TouchableOpacity>
      </View>

      {/* RF06 – Projeção de Saldo Futuro com Gastos Pretendidos Mapeados */}
      <View style={styles.projectionRow}>
        <View style={styles.projectionLeft}>
          <Ionicons name="trending-up-outline" size={14} color="rgba(255, 255, 255, 0.9)" style={{ marginRight: 6 }} />
          <Text style={styles.projectionLabel}>
            {language === 'en' ? 'Projected Future Balance:' : 'Projeção de Saldo Futuro:'}
          </Text>
        </View>
        <Text style={styles.projectionValue}>
          {isBalanceVisible ? formatMoney(projectedFutureBalance) : '••••••'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    ...shadows.purpleCard,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  subCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  subCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    padding: 12,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  incomeIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  expenseIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  subCardLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    flex: 1,
  },
  subCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  projectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  projectionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
