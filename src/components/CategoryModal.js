// src/components/CategoryModal.js
// Modal completo para criação e edição de categorias de despesas com ícone, cor e limite de orçamento

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
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const AVAILABLE_ICONS = [
  'pricetag-outline',
  'home-outline',
  'restaurant-outline',
  'bus-outline',
  'film-outline',
  'receipt-outline',
  'medkit-outline',
  'school-outline',
  'cart-outline',
  'car-outline',
  'paw-outline',
  'fitness-outline',
  'game-controller-outline',
  'gift-outline',
  'cafe-outline',
  'airplane-outline',
  'shirt-outline',
  'build-outline',
  'barbell-outline',
  'book-outline',
];

const AVAILABLE_COLORS = [
  '#5B36EC',
  '#8B5CF6',
  '#A78BFA',
  '#EC4899',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
];

export default function CategoryModal({ visible, onClose, categoryToEdit = null, onSaved = null }) {
  const { addCategory, updateCategory, deleteCategory, budgets } = useFinance();
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  const isEditing = !!categoryToEdit;

  const [name, setName] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pricetag-outline');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');

  useEffect(() => {
    if (visible) {
      if (categoryToEdit) {
        setName(categoryToEdit.name || '');
        const currentLimit = budgets?.categories?.[categoryToEdit.id] !== undefined
          ? budgets.categories[categoryToEdit.id]
          : (categoryToEdit.limit !== undefined ? categoryToEdit.limit : '');
        setBudgetLimit(currentLimit ? String(currentLimit) : '');
        setSelectedIcon(categoryToEdit.icon || 'pricetag-outline');
        setSelectedColor(categoryToEdit.color || '#8B5CF6');
      } else {
        setName('');
        setBudgetLimit('');
        setSelectedIcon('pricetag-outline');
        setSelectedColor('#8B5CF6');
      }
    }
  }, [visible, categoryToEdit, budgets]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(
        t('common.attention'),
        language === 'en' ? 'Please enter a category name.' : 'Por favor, informe o nome da categoria.'
      );
      return;
    }

    const payload = {
      name: trimmed,
      icon: selectedIcon,
      color: selectedColor,
      budgetLimit: budgetLimit.trim() ? parseFloat(budgetLimit.replace(',', '.')) : undefined,
    };

    if (isEditing) {
      const res = await updateCategory(categoryToEdit.id, payload);
      if (res.success) {
        if (onSaved) onSaved({ id: categoryToEdit.id, ...payload });
        onClose();
      } else {
        Alert.alert(t('common.error'), res.message || 'Erro ao atualizar categoria.');
      }
    } else {
      const res = await addCategory(payload);
      if (res.success) {
        if (onSaved) onSaved(res.category);
        onClose();
      } else {
        Alert.alert(t('common.error'), res.message || 'Erro ao criar categoria.');
      }
    }
  }

  function handleDelete() {
    if (!categoryToEdit) return;

    Alert.alert(
      language === 'en' ? 'Delete Category' : 'Excluir Categoria',
      language === 'en'
        ? `Are you sure you want to delete "${categoryToEdit.name}"?`
        : `Deseja realmente excluir a categoria "${categoryToEdit.name}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(categoryToEdit.id);
            onClose();
          },
        },
      ]
    );
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.previewIconCircle, { backgroundColor: selectedColor }]}>
                <Ionicons name={selectedIcon} size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {isEditing
                  ? (language === 'en' ? 'Edit Category' : 'Editar Categoria')
                  : (language === 'en' ? 'New Expense Category' : 'Nova Categoria de Despesa')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceAlt }]}
            >
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Nome da Categoria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Category Name' : 'Nome da Categoria'}
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
                value={name}
                onChangeText={setName}
                placeholder={language === 'en' ? 'e.g. Subscriptions, Pets, Books' : 'Ex: Streaming, Pet Shop, Cursos'}
                placeholderTextColor={theme.textMuted}
                maxLength={30}
              />
            </View>

            {/* Limite de Orçamento Mensal Opcional */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                {language === 'en' ? `Monthly Budget Limit (${currencySymbol})` : `Limite Mensal de Orçamento (${currencySymbol})`}
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
                value={budgetLimit}
                onChangeText={setBudgetLimit}
                placeholder="500"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
              />
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                {language === 'en'
                  ? 'Optional. Define how much you plan to spend in this category per month.'
                  : 'Opcional. Defina o valor máximo planejado para gastar nesta categoria por mês.'}
              </Text>
            </View>

            {/* Seleção de Cor */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Category Color' : 'Cor de Identificação'}
              </Text>
              <View style={styles.colorPaletteGrid}>
                {AVAILABLE_COLORS.map((col) => {
                  const isSelected = selectedColor === col;
                  return (
                    <TouchableOpacity
                      key={col}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: col },
                        isSelected && styles.colorSwatchSelected,
                      ]}
                      onPress={() => setSelectedColor(col)}
                      activeOpacity={0.8}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Seleção de Ícone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Category Icon' : 'Ícone Representativo'}
              </Text>
              <View style={styles.iconGrid}>
                {AVAILABLE_ICONS.map((ico) => {
                  const isSelected = selectedIcon === ico;
                  return (
                    <TouchableOpacity
                      key={ico}
                      style={[
                        styles.iconOption,
                        {
                          backgroundColor: isSelected ? selectedColor : theme.surfaceAlt,
                          borderColor: isSelected ? selectedColor : theme.borderDark,
                        },
                      ]}
                      onPress={() => setSelectedIcon(ico)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={ico}
                        size={22}
                        color={isSelected ? '#FFFFFF' : theme.textPrimary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Botões de Ação */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {isEditing
                    ? (language === 'en' ? 'Save Changes' : 'Salvar Alterações')
                    : (language === 'en' ? 'Create Category' : 'Criar Categoria')}
                </Text>
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { borderColor: theme.expense }]}
                  onPress={handleDelete}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.expense} style={{ marginRight: 6 }} />
                  <Text style={[styles.deleteBtnText, { color: theme.expense }]}>
                    {language === 'en' ? 'Delete Category' : 'Excluir Categoria'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
    maxHeight: '90%',
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
  previewIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
    marginBottom: 18,
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsContainer: {
    marginTop: 10,
    gap: 10,
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
