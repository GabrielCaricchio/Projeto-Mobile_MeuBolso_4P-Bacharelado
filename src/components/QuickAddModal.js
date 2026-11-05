// src/components/QuickAddModal.js
// Modal de Registro Relâmpago em 3 Segundos (Crítica 13 da Tabela de Pesquisa de Mercado)
// Focado puramente na digitação rápida do valor e salvamento instantâneo para compras na rua

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function QuickAddModal({ visible, onClose }) {
  const { addTransaction } = useFinance();
  const { theme } = useTheme();
  const { language, formatMoney } = useLanguage();

  const [amountRaw, setAmountRaw] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [selectedQuickTag, setSelectedQuickTag] = useState('Café / Lanche');
  const [selectedCategory, setSelectedCategory] = useState('Alimentação');

  const quickPresets = [
    { label: 'Café / Lanche', category: 'Alimentação', icon: 'cafe-outline' },
    { label: 'Transporte / Uber', category: 'Transporte', icon: 'car-outline' },
    { label: 'Farmácia', category: 'Saúde', icon: 'medkit-outline' },
    { label: 'Bala / Pequeno Gasto', category: 'Lazer', icon: 'pricetag-outline' },
  ];

  function handleAmountChange(text) {
    const digitsOnly = text.replace(/\D/g, '');
    if (!digitsOnly) {
      setAmountDisplay('');
      setAmountRaw('');
      return;
    }
    const numericVal = parseInt(digitsOnly, 10) / 100;
    setAmountRaw(String(numericVal));
    setAmountDisplay(
      numericVal.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  async function handleQuickSave() {
    const num = parseFloat(amountRaw);
    if (!num || num <= 0) return;

    await addTransaction({
      description: selectedQuickTag,
      descricao: selectedQuickTag,
      amount: num,
      valor: num,
      type: 'despesa',
      tipo: 'despesa',
      category: selectedCategory,
      categoria: selectedCategory,
      status: 'realizado',
      date: new Date().toISOString().split('T')[0],
      observations: 'Registro rápido (Regra dos 3 segundos)',
    });

    setAmountRaw('');
    setAmountDisplay('');
    onClose();
  }

  const currencySymbol = language === 'en' ? '$' : 'R$';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="flash" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  {language === 'en' ? '3-Second Quick Add' : 'Registro Relâmpago (3 Segundos)'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {language === 'en' ? 'Type the amount and save instantly' : 'Digite o valor e salve na hora sem burocracia'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Campo de Valor em Destaque Gigante */}
          <View style={[styles.amountContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
            <Text style={[styles.currencyPrefix, { color: theme.textSecondary }]}>{currencySymbol}</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.textPrimary }]}
              placeholder="0,00"
              placeholderTextColor={theme.textMuted}
              value={amountDisplay}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              autoFocus
            />
          </View>

          {/* Presets de 1 toque */}
          <View style={styles.presetsGrid}>
            {quickPresets.map((preset) => {
              const isSelected = selectedQuickTag === preset.label;
              return (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected ? theme.primaryLight : theme.surfaceAlt,
                      borderColor: isSelected ? theme.primary : theme.borderDark,
                    },
                  ]}
                  onPress={() => {
                    setSelectedQuickTag(preset.label);
                    setSelectedCategory(preset.category);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={preset.icon}
                    size={14}
                    color={isSelected ? theme.primary : theme.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.presetLabel,
                      { color: isSelected ? theme.primary : theme.textPrimary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botão de Salvar Imediato */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: amountRaw ? theme.primary : theme.borderDark },
            ]}
            onPress={handleQuickSave}
            disabled={!amountRaw}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>
              {language === 'en' ? 'Save in 1 Tap' : 'Salvar em 1 Toque'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 34,
    fontWeight: '700',
    minWidth: 120,
    textAlign: 'center',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetLabel: {
    fontSize: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
