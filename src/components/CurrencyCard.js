// src/components/CurrencyCard.js
// RF08 – Consulta de Cotação da AwesomeAPI Economia (USD e EUR em relação ao BRL)
// RNF03 – Funcionamento Offline com try/catch e cache
// RNF04 – Feedback visual assíncrono com ActivityIndicator

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function CurrencyCard() {
  const { exchangeRates, loadingRates, ratesMessage, refreshExchangeRates } = useFinance();
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  const [converterOpen, setConverterOpen] = useState(false);
  const [brlInput, setBrlInput] = useState('100');

  const usdRate = exchangeRates?.usd?.bid || 5.42;
  const eurRate = exchangeRates?.eur?.bid || 5.88;
  const usdPct = exchangeRates?.usd?.pctChange || 0;
  const eurPct = exchangeRates?.eur?.pctChange || 0;
  const isOffline = exchangeRates?.isOffline || false;

  const brlNumeric = parseFloat(brlInput.replace(',', '.')) || 0;
  const inUSD = usdRate > 0 ? (brlNumeric / usdRate).toFixed(2) : '0.00';
  const inEUR = eurRate > 0 ? (brlNumeric / eurRate).toFixed(2) : '0.00';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Cabeçalho do Card */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="globe-outline" size={18} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {language === 'en' ? 'Exchange Rates (Live)' : 'Cotação de Moedas'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              AwesomeAPI Economia · USD & EUR
            </Text>
          </View>
        </View>

        {/* Botão Atualizar (com ActivityIndicator nativo RNF04) */}
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}
          onPress={() => refreshExchangeRates(true)}
          disabled={loadingRates}
          activeOpacity={0.7}
        >
          {loadingRates ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={16} color={theme.textPrimary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Banner de Modo Offline se aplicável (RNF03) */}
      {isOffline ? (
        <View style={[styles.offlineBanner, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
          <Ionicons name="cloud-offline-outline" size={14} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={[styles.offlineText, { color: '#D97706' }]}>
            {ratesMessage || (language === 'en' ? 'Offline mode · Showing cached rates' : 'Modo offline · Exibindo última cotação salva')}
          </Text>
        </View>
      ) : null}

      {/* Grid de Cotações: Dólar e Euro */}
      <View style={styles.ratesGrid}>
        {/* Card Dólar */}
        <View style={[styles.rateItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
          <View style={styles.rateTopRow}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyFlag}>🇺🇸</Text>
              <Text style={[styles.currencyCode, { color: theme.textPrimary }]}>USD</Text>
            </View>
            <View style={[styles.pctBadge, { backgroundColor: usdPct >= 0 ? theme.incomeLight : theme.expenseLight }]}>
              <Ionicons
                name={usdPct >= 0 ? 'arrow-up' : 'arrow-down'}
                size={11}
                color={usdPct >= 0 ? theme.incomeDark : theme.expense}
              />
              <Text style={[styles.pctText, { color: usdPct >= 0 ? theme.incomeDark : theme.expense }]}>
                {Math.abs(usdPct).toFixed(2)}%
              </Text>
            </View>
          </View>
          <Text style={[styles.rateValue, { color: theme.textPrimary }]}>
            R$ {Number(usdRate).toFixed(2).replace('.', ',')}
          </Text>
          <Text style={[styles.rateSub, { color: theme.textSecondary }]}>
            {language === 'en' ? 'US Dollar' : 'Dólar Comercial'}
          </Text>
        </View>

        {/* Card Euro */}
        <View style={[styles.rateItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
          <View style={styles.rateTopRow}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyFlag}>🇪🇺</Text>
              <Text style={[styles.currencyCode, { color: theme.textPrimary }]}>EUR</Text>
            </View>
            <View style={[styles.pctBadge, { backgroundColor: eurPct >= 0 ? theme.incomeLight : theme.expenseLight }]}>
              <Ionicons
                name={eurPct >= 0 ? 'arrow-up' : 'arrow-down'}
                size={11}
                color={eurPct >= 0 ? theme.incomeDark : theme.expense}
              />
              <Text style={[styles.pctText, { color: eurPct >= 0 ? theme.incomeDark : theme.expense }]}>
                {Math.abs(eurPct).toFixed(2)}%
              </Text>
            </View>
          </View>
          <Text style={[styles.rateValue, { color: theme.textPrimary }]}>
            R$ {Number(eurRate).toFixed(2).replace('.', ',')}
          </Text>
          <Text style={[styles.rateSub, { color: theme.textSecondary }]}>
            {language === 'en' ? 'Euro' : 'Euro Comercial'}
          </Text>
        </View>
      </View>

      {/* Botão para Expandir Conversor Rápido de Câmbio */}
      <TouchableOpacity
        style={[styles.converterToggle, { borderTopColor: theme.border }]}
        onPress={() => setConverterOpen(!converterOpen)}
        activeOpacity={0.7}
      >
        <Text style={[styles.converterToggleText, { color: theme.textPurple }]}>
          {converterOpen
            ? (language === 'en' ? 'Hide Converter' : 'Ocultar Conversor')
            : (language === 'en' ? '⚡ Quick Currency Converter' : '⚡ Conversor Rápido de Moedas')}
        </Text>
        <Ionicons
          name={converterOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.textPurple}
        />
      </TouchableOpacity>

      {/* Conversor Interativo de Moeda */}
      {converterOpen && (
        <View style={[styles.converterBox, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.converterLabel, { color: theme.textSecondary }]}>
            {language === 'en' ? 'Enter amount in BRL (R$):' : 'Digite o valor em Reais (R$):'}
          </Text>
          <TextInput
            style={[styles.converterInput, { color: theme.textPrimary, borderColor: theme.borderDark, backgroundColor: theme.surface }]}
            value={brlInput}
            onChangeText={setBrlInput}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={theme.textMuted}
          />
          <View style={styles.convertedResultsRow}>
            <View style={styles.convertedCol}>
              <Text style={[styles.convertedCode, { color: theme.textSecondary }]}>🇺🇸 USD</Text>
              <Text style={[styles.convertedVal, { color: theme.textPrimary }]}>$ {inUSD}</Text>
            </View>
            <View style={[styles.convertedDivider, { backgroundColor: theme.border }]} />
            <View style={styles.convertedCol}>
              <Text style={[styles.convertedCode, { color: theme.textSecondary }]}>🇪🇺 EUR</Text>
              <Text style={[styles.convertedVal, { color: theme.textPrimary }]}>€ {inEUR}</Text>
            </View>
          </View>
        </View>
      )}
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
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  ratesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  rateItem: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  rateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  pctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pctText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  rateSub: {
    fontSize: 11,
    marginTop: 2,
  },
  converterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  converterToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  converterBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
  },
  converterLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  converterInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  convertedResultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  convertedCol: {
    alignItems: 'center',
  },
  convertedCode: {
    fontSize: 11,
    marginBottom: 2,
  },
  convertedVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  convertedDivider: {
    width: 1,
    height: 24,
  },
});
