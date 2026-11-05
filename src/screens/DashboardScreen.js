// src/screens/DashboardScreen.js
// TELA 2 – PÁGINA INICIAL / DASHBOARD: Saldo principal, evolução gráfica, transações recentes, tema e idioma

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Header from '../components/Header';
import BalanceCard from '../components/BalanceCard';
import EvolutionChart from '../components/EvolutionChart';
import TransactionItem from '../components/TransactionItem';
import CurrencyCard from '../components/CurrencyCard';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateDisplay } from '../utils/formatters';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const {
    currentMonthTransactions,
    deleteTransaction,
    convertPlannedToReal,
    budgetAlertCategory,
    goals,
    notes,
    totalGoalsSaved,
  } = useFinance();
  const { theme } = useTheme();
  const { t, formatMoney } = useLanguage();
  const insets = useSafeAreaInsets();

  const [selectedTx, setSelectedTx] = useState(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  // As 3 movimentações mais recentes do mês ativo
  const recentTransactions = currentMonthTransactions.slice(0, 3);

  function handleTransactionPress(tx) {
    setSelectedTx(tx);
  }

  function handleEditTransaction() {
    const tx = selectedTx;
    setSelectedTx(null);
    navigation.navigate('NovaMovimentacao', { transactionToEdit: tx });
  }

  function handleDeleteTransaction() {
    if (!selectedTx) return;
    Alert.alert(
      t('transactions.deleteTransactionTitle'),
      t('transactions.deleteTransactionConfirm', { description: selectedTx.description }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(selectedTx.id);
            setSelectedTx(null);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 85 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho com Logo Meu Bolso e Avatar */}
        <Header onAvatarPress={() => navigation.navigate('Profile')} />

        {/* Saudação Personalizada e Notificações */}
        <View style={styles.greetingContainer}>
          <View>
            <Text style={[styles.greetingText, { color: theme.textPrimary }]}>
              {t('dashboard.greeting', { name: user?.name || user?.fullName || 'Usuário' })}
            </Text>
            <Text style={[styles.greetingSubtext, { color: theme.textSecondary }]}>
              {t('dashboard.greetingSub')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bellButton, { backgroundColor: theme.actionBtnBg }]}
            onPress={() => setNotificationsVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.textPrimary} />
            {budgetAlertCategory ? (
              <View style={[styles.bellBadge, { backgroundColor: theme.expense }]} />
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Card Principal de Saldo Roxo */}
        <BalanceCard
          onReceitasPress={() => navigation.navigate('Movimentos', { filter: 'receitas' })}
          onDespesasPress={() => navigation.navigate('Movimentos', { filter: 'despesas' })}
        />

        {/* Hub de Ferramentas Rápidas: Metas/Cofrinho (RF05), Bloco de Notas (RF03) e Recorrentes */}
        <View style={styles.quickToolsRow}>
          <TouchableOpacity
            style={[styles.quickToolCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('Goals')}
            activeOpacity={0.75}
          >
            <View style={[styles.toolIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="ribbon" size={20} color={theme.income} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toolTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                Cofrinho & Metas
              </Text>
              <Text style={[styles.toolSubtitle, { color: theme.textSecondary }]}>
                {formatMoney(totalGoalsSaved)} poupados
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickToolCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('Notes')}
            activeOpacity={0.75}
          >
            <View style={[styles.toolIconCircle, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="document-text" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toolTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                Bloco de Notas
              </Text>
              <Text style={[styles.toolSubtitle, { color: theme.textSecondary }]}>
                {notes.length} notas e Pix
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Card RF08: Cotações em Tempo Real (AwesomeAPI - USD & EUR) */}
        <CurrencyCard />

        {/* Card Gráfico: Evolução do Saldo */}
        <EvolutionChart onMonthPress={() => navigation.navigate('Movimentos')} />

        {/* Seção: Últimas Movimentações */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {t('dashboard.recentTransactions')}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Movimentos')}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewAllLink, { color: theme.textPurple }]}>
                {t('common.seeAll')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card com lista das movimentações recentes */}
          <View
            style={[
              styles.transactionsCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={32} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {t('dashboard.noTransactions')}
                </Text>
              </View>
            ) : (
              recentTransactions.map((tx, idx) => (
                <View key={tx.id}>
                  <TransactionItem
                    transaction={tx}
                    onPress={() => handleTransactionPress(tx)}
                    onConvertPress={() => convertPlannedToReal(tx.id)}
                  />
                  {idx < recentTransactions.length - 1 && (
                    <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal de Detalhes da Movimentação */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {t('transactions.detailsTitle')}
              </Text>
              <TouchableOpacity onPress={() => setSelectedTx(null)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                <View style={styles.detailBody}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      {t('common.description')}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary, flex: 1, textAlign: 'right' }]}>
                      {selectedTx.description}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      {t('common.category')}
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color:
                            selectedTx.type === 'receita'
                              ? theme.income
                              : theme.expense,
                        },
                      ]}
                    >
                      {selectedTx.type === 'receita'
                        ? t('common.income')
                        : t('common.expense')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      {t('common.amount')}
                    </Text>
                    <Text style={[styles.detailValueLarge, { color: theme.textPrimary }]}>
                      {formatMoney(selectedTx.amount)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Categoria
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                      {selectedTx.category}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      {t('common.date')}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                      {formatDateDisplay(selectedTx.date, 'pt')}
                    </Text>
                  </View>

                  {/* Observações com container que nunca estoura o pop-up */}
                  {selectedTx.observations ? (
                    <View style={[styles.detailObservationBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary, marginBottom: 4 }]}>
                        {t('common.observations')}
                      </Text>
                      <Text style={[styles.detailObservationText, { color: theme.textPrimary }]}>
                        {selectedTx.observations}
                      </Text>
                    </View>
                  ) : null}

                  {/* RF02: Efetivar Gasto Planejado com 1 toque */}
                  {selectedTx.status === 'pretendido' && (
                    <TouchableOpacity
                      style={[styles.convertRealButton, { backgroundColor: theme.income }]}
                      onPress={async () => {
                        await convertPlannedToReal(selectedTx.id);
                        setSelectedTx(null);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.convertRealButtonText}>
                        Efetivar Gasto (Converter com 1 toque)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Ações: Editar e Excluir */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: theme.primary }]}
                      onPress={handleEditTransaction}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        {
                          borderColor: theme.expense,
                          backgroundColor: theme.surfaceAlt,
                        },
                      ]}
                      onPress={handleDeleteTransaction}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.expense}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.deleteButtonText, { color: theme.expense }]}>
                        {t('common.delete')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Notificações com navegação direta ao motivo/categoria */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {t('dashboard.notifications')}
              </Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            {budgetAlertCategory ? (
              <TouchableOpacity
                style={[
                  styles.notificationClickableCard,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.warningBorder,
                  },
                ]}
                onPress={() => {
                  setNotificationsVisible(false);
                  navigation.navigate('Orcamento', { highlightCategory: budgetAlertCategory.id });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.notificationItem}>
                  <Ionicons
                    name="information-circle"
                    size={24}
                    color={theme.expense}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notificationTitle, { color: theme.textPrimary }]}>
                      {t('dashboard.budgetAlertTitle')}
                    </Text>
                    <Text style={[styles.notificationDesc, { color: theme.textSecondary }]}>
                      {budgetAlertCategory.name}{' '}
                      {budgetAlertCategory.isOverLimit
                        ? t('budget.budgetAlertOver')
                        : t('budget.budgetAlertNear')}{' '}
                      {budgetAlertCategory.percent}% {t('budget.usedWord')}.
                    </Text>
                    <View style={styles.notificationActionBadge}>
                      <Text style={[styles.notificationActionText, { color: theme.primary }]}>
                        Toque para abrir no Orçamento →
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyNotifications}>
                <Ionicons
                  name="notifications-off-outline"
                  size={28}
                  color={theme.textMuted}
                  style={{ marginBottom: 6 }}
                />
                <Text style={[styles.emptyNotificationText, { color: theme.textSecondary }]}>
                  {t('dashboard.noNotifications')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  greetingSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 9,
    right: 10,
  },
  transactionsSection: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  itemDivider: {
    height: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailBody: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValueLarge: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailObservationBox: {
    padding: 12,
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    width: '100%',
  },
  detailObservationText: {
    fontSize: 14,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  notificationClickableCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  notificationActionBadge: {
    marginTop: 8,
  },
  notificationActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyNotificationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickToolsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  quickToolCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  toolIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  toolSubtitle: {
    fontSize: 11,
  },
  convertRealButton: {
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  convertRealButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
