// src/components/FreeAllowanceCard.js
// Card da Mesada Livre Inteligente (Passo 1 do documento de Amanda)
// Provisiona teto de gastos livres e protege o restante das contas fixas e metas de economia

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function FreeAllowanceCard() {
  const { freeAllowance, updateFreeAllowanceLimit, resetFreeAllowanceCycle } = useFinance();
  const { theme } = useTheme();
  const { language, formatMoney } = useLanguage();

  const [modalVisible, setModalVisible] = useState(false);
  const [newLimit, setNewLimit] = useState(String(freeAllowance.limit || 500));

  const limit = freeAllowance.limit || 500;
  const spent = freeAllowance.spent || 0;
  const remaining = Math.max(0, limit - spent);
  const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const isOver = spent >= limit;

  async function handleSaveLimit() {
    await updateFreeAllowanceLimit(newLimit);
    setModalVisible(false);
  }

  const currencySymbol = language === 'en' ? '$' : 'R$';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Topo do Card */}
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <View style={[styles.iconBadge, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="sparkles" size={18} color={theme.primary} />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Smart Free Allowance' : 'Mesada Livre Inteligente'}
              </Text>
              {freeAllowance.silentMode && (
                <View style={[styles.silentBadge, { backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name="volume-mute-outline" size={12} color={theme.textSecondary} style={{ marginRight: 3 }} />
                  <Text style={[styles.silentBadgeText, { color: theme.textSecondary }]}>
                    {language === 'en' ? 'Silent Mode' : 'Modo Silencioso'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {language === 'en'
                ? 'Free spending money protecting your fixed bills'
                : 'Lazer e variáveis blindando contas fixas e metas'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: theme.surfaceAlt }]}
          onPress={() => {
            setNewLimit(String(limit));
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={17} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Valores: Restante e Teto */}
      <View style={styles.valuesRow}>
        <View>
          <Text style={[styles.valueLabel, { color: theme.textSecondary }]}>
            {language === 'en' ? 'Available to spend' : 'Disponível para gastar'}
          </Text>
          <Text
            style={[
              styles.remainingValue,
              { color: isOver ? theme.expense : theme.income },
            ]}
          >
            {formatMoney(remaining)}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.valueLabel, { color: theme.textSecondary }]}>
            {language === 'en' ? 'Allowance cap' : 'Teto estipulado'}
          </Text>
          <Text style={[styles.limitValue, { color: theme.textPrimary }]}>
            {formatMoney(limit)}
          </Text>
        </View>
      </View>

      {/* Barra de Progresso do Teto */}
      <View style={[styles.progressTrack, { backgroundColor: theme.borderDark }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, percent)}%`,
              backgroundColor: isOver ? theme.expense : theme.primary,
            },
          ]}
        />
      </View>

      {/* Rodapé com porcentagem e aviso anti-estresse */}
      <View style={styles.footerRow}>
        <Text style={[styles.percentText, { color: isOver ? theme.expense : theme.textSecondary }]}>
          {percent}% {language === 'en' ? 'used' : 'utilizado'} ({formatMoney(spent)})
        </Text>
        {isOver ? (
          <Text style={[styles.alertNotice, { color: theme.expense }]}>
            {language === 'en' ? 'Cap reached (Zero spam active)' : 'Teto atingido (Sem spam de alertas)'}
          </Text>
        ) : (
          <Text style={[styles.safeNotice, { color: theme.income }]}>
            {language === 'en' ? 'Fixed bills protected' : 'Contas fixas protegidas'}
          </Text>
        )}
      </View>

      {/* Modal de Configuração do Teto da Mesada */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Configure Free Allowance' : 'Configurar Mesada Livre'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              {language === 'en'
                ? 'Set a safe cap for coffees, snacks, and leisure. The app locks this budget so you spend without guilt.'
                : 'Estipule um teto seguro para cafezinhos, lanches e lazer. O app provisiona esse valor para você gastar sem culpa e sem tocar nas despesas fixas.'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? `Allowance Limit (${currencySymbol})` : `Teto da Mesada (${currencySymbol})`}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderDark,
                    color: theme.textPrimary,
                  },
                ]}
                value={newLimit}
                onChangeText={setNewLimit}
                keyboardType="numeric"
                placeholder="500"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveLimit}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {language === 'en' ? 'Save Allowance' : 'Salvar Mesada Livre'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: theme.borderDark }]}
                onPress={async () => {
                  await resetFreeAllowanceCycle();
                  setModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>
                  {language === 'en' ? 'Reset Spent Counter' : 'Reiniciar Ciclo (Zerar Gasto)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
    marginTop: 2,
  },
  silentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  silentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  valueLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  remainingValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  limitValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertNotice: {
    fontSize: 12,
    fontWeight: '600',
  },
  safeNotice: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalActions: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  resetBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
