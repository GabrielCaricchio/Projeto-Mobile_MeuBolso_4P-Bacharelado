// src/components/BudgetModal.js
// Modal interativo para edição do orçamento mensal e limites por categoria com suporte dinâmico a categorias personalizadas

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function BudgetModal({ visible, onClose }) {
  const { budgets, updateBudgets, categoriesExpense } = useFinance();
  const { theme } = useTheme();
  const { t, language, translateCategory } = useLanguage();

  const [totalPlanned, setTotalPlanned] = useState('');
  const [categoryLimits, setCategoryLimits] = useState({});

  useEffect(() => {
    if (visible && budgets) {
      setTotalPlanned(String(budgets.totalPlanned || 4800));
      const limits = {};
      (categoriesExpense || []).forEach((cat) => {
        const val = budgets.categories?.[cat.id] !== undefined
          ? budgets.categories[cat.id]
          : (budgets.categories?.[cat.name.toLowerCase()] !== undefined ? budgets.categories[cat.name.toLowerCase()] : 500);
        limits[cat.id] = String(val !== undefined ? val : 500);
      });
      setCategoryLimits(limits);
    }
  }, [budgets, categoriesExpense, visible]);

  function handleLimitChange(catId, text) {
    setCategoryLimits((prev) => ({
      ...prev,
      [catId]: text,
    }));
  }

  async function handleSave() {
    const parsedCategories = {};
    Object.keys(categoryLimits).forEach((catId) => {
      parsedCategories[catId] = parseFloat(categoryLimits[catId]) || 0;
    });

    const updated = {
      totalPlanned: parseFloat(totalPlanned) || 0,
      categories: parsedCategories,
    };

    await updateBudgets(updated);
    onClose();
  }

  const currencySymbol = language === 'en' ? '$' : 'R$';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}
      >
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
          {/* Header do Modal */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t('budget.adjustLimits')}
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Orçamento Geral */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                {t('budget.totalLimit')} ({currencySymbol})
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderDark,
                    color: theme.textPrimary,
                  },
                ]}
                value={totalPlanned}
                onChangeText={setTotalPlanned}
                keyboardType="numeric"
                placeholder="4800"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <Text style={[styles.sectionDivider, { color: theme.textSecondary }]}>
              {t('budget.categoriesSection')}
            </Text>

            {(categoriesExpense || []).map((cat) => (
              <View key={cat.id} style={styles.inputGroup}>
                <View style={styles.catLabelRow}>
                  <View style={[styles.catIconMini, { backgroundColor: cat.color || theme.primary }]}>
                    <Ionicons name={cat.icon || 'pricetag-outline'} size={14} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.label, { color: theme.textPrimary, marginBottom: 0 }]}>
                    {translateCategory(cat.name)} ({currencySymbol})
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderDark,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={categoryLimits[cat.id] !== undefined ? categoryLimits[cat.id] : '500'}
                  onChangeText={(val) => handleLimitChange(cat.id, val)}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            ))}

            {/* Botão Salvar */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>{t('budget.saveLimits')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  catLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  catIconMini: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  sectionDivider: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 14,
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
