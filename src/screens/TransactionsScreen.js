// src/screens/TransactionsScreen.js
// TELA 3 – MOVIMENTAÇÕES: Lista cronológica agrupada por data com filtros, busca, ações e suporte a tema e idioma

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Header from '../components/Header';
import MonthSelector from '../components/MonthSelector';
import FilterTabs from '../components/FilterTabs';
import TransactionItem from '../components/TransactionItem';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateGroup, formatDateDisplay } from '../utils/formatters';

export default function TransactionsScreen({ navigation, route }) {
  const initialFilter = route?.params?.filter || 'todas';
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchAllHistory, setSearchAllHistory] = useState(false);
  const [allMonthsMode, setAllMonthsMode] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const {
    transactions,
    currentMonthTransactions,
    deleteTransaction,
    convertPlannedToReal,
  } = useFinance();
  const { theme } = useTheme();
  const { t, formatMoney, translateCategory } = useLanguage();
  const insets = useSafeAreaInsets();

  // Define a lista base: busca em todo o histórico se allMonthsMode estiver ativo ou se searchAllHistory estiver ativo
  const baseTransactions = (allMonthsMode || (isSearchActive && searchAllHistory))
    ? transactions
    : currentMonthTransactions;

  // Filtra por tipo (todas, receitas, despesas, planejadas) e pesquisa avançada (valor, nome, categoria, descrição)
  const filteredTransactions = useMemo(() => {
    return baseTransactions.filter((tx) => {
      // Filtro de tipo e status (RF02)
      if (activeFilter === 'receitas' && tx.type !== 'receita') return false;
      if (activeFilter === 'despesas' && tx.type !== 'despesa') return false;
      if (activeFilter === 'planejadas' && tx.status !== 'pretendido') return false;

      // Pesquisa avançada por: valor, nome, categoria e descrição/observação
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();

        // 1. Nome (description ou descricao)
        const name = (tx.description || tx.descricao || '').toLowerCase();
        const matchName = name.includes(query);

        // 2. Categoria (nome original e traduzido)
        const catOrig = (tx.category || tx.categoria || '').toLowerCase();
        const catTranslated = (translateCategory(tx.category || tx.categoria || '') || '').toLowerCase();
        const matchCategory = catOrig.includes(query) || catTranslated.includes(query);

        // 3. Descrição / Observações (observations ou notes)
        const obs = (tx.observations || tx.notes || '').toLowerCase();
        const matchDescription = obs.includes(query);

        // 4. Valor (comparação numérica, texto com ponto, com vírgula e símbolos)
        const numAmount = Number(tx.amount !== undefined ? tx.amount : tx.valor || 0);
        const amountStr = String(numAmount);
        const amountFixed2 = numAmount.toFixed(2);
        const amountComma = amountFixed2.replace('.', ',');
        const cleanQueryNumber = query.replace(/[^\d.,]/g, '').trim();

        let matchValor = false;
        if (cleanQueryNumber) {
          const queryCleanComma = cleanQueryNumber.replace('.', ',');
          const queryCleanDot = cleanQueryNumber.replace(',', '.');
          matchValor =
            amountStr.includes(cleanQueryNumber) ||
            amountFixed2.includes(queryCleanDot) ||
            amountComma.includes(queryCleanComma);
        }

        return matchName || matchCategory || matchDescription || matchValor;
      }
      return true;
    });
  }, [baseTransactions, activeFilter, searchQuery, translateCategory]);

  // Agrupa as movimentações filtradas por data
  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach((tx) => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => ({
        date: dateKey,
        formattedHeader: formatDateGroup(dateKey, 'pt'),
        items: groups[dateKey],
      }));
  }, [filteredTransactions]);

  function handleEdit(tx) {
    setSelectedTx(null);
    navigation.navigate('NovaMovimentacao', { transactionToEdit: tx });
  }

  function handleDelete(tx) {
    Alert.alert(
      t('transactions.deleteTransactionTitle'),
      t('transactions.deleteTransactionConfirm', { description: tx.description }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(tx.id);
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
        {/* Cabeçalho */}
        <Header />

        {/* Título da Tela e Botão de Busca */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
              {t('transactions.title')}
            </Text>
            {allMonthsMode && (
              <Text style={[styles.allMonthsSubtitle, { color: theme.primary }]}>
                Exibindo todo o histórico de movimentações
              </Text>
            )}
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={[
                styles.allMonthsToggleBtn,
                allMonthsMode && [styles.allMonthsToggleBtnActive, { backgroundColor: theme.primary }],
                !allMonthsMode && { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark },
              ]}
              onPress={() => setAllMonthsMode(!allMonthsMode)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="layers-outline"
                size={16}
                color={allMonthsMode ? '#FFFFFF' : theme.textPrimary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.allMonthsToggleText,
                  { color: allMonthsMode ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                {allMonthsMode ? 'Todos os Meses' : 'Filtrar Todos'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: theme.actionBtnBg }]}
              onPress={() => setIsSearchActive(!isSearchActive)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSearchActive ? 'close-outline' : 'search-outline'}
                size={22}
                color={theme.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de Pesquisa Expansível Avançada (Valor, Nome, Categoria, Descrição) */}
        {isSearchActive && (
          <View style={styles.searchSectionWrapper}>
            <View
              style={[
                styles.searchBarContainer,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.borderDark,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.primary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Buscar por valor, nome, categoria, descrição..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Alternador de Escopo da Busca: Mês Atual vs Todo o Histórico */}
            <View style={styles.searchScopeRow}>
              <TouchableOpacity
                style={[
                  styles.scopeChip,
                  (!searchAllHistory && !allMonthsMode) && [styles.scopeChipActive, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
                  (searchAllHistory || allMonthsMode) && { borderColor: theme.borderDark },
                ]}
                onPress={() => {
                  setSearchAllHistory(false);
                  setAllMonthsMode(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={(!searchAllHistory && !allMonthsMode) ? theme.primary : theme.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.scopeChipText,
                    { color: (!searchAllHistory && !allMonthsMode) ? theme.primary : theme.textSecondary },
                    (!searchAllHistory && !allMonthsMode) && { fontWeight: '700' },
                  ]}
                >
                  Mês Selecionado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scopeChip,
                  (searchAllHistory || allMonthsMode) && [styles.scopeChipActive, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
                  (!searchAllHistory && !allMonthsMode) && { borderColor: theme.borderDark },
                ]}
                onPress={() => {
                  setSearchAllHistory(true);
                  setAllMonthsMode(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="file-tray-full-outline"
                  size={14}
                  color={(searchAllHistory || allMonthsMode) ? theme.primary : theme.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.scopeChipText,
                    { color: (searchAllHistory || allMonthsMode) ? theme.primary : theme.textSecondary },
                    (searchAllHistory || allMonthsMode) && { fontWeight: '700' },
                  ]}
                >
                  Todo o Histórico
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contador de Resultados Encontrados */}
            {searchQuery.trim().length > 0 && (
              <View style={styles.resultCountRow}>
                <Ionicons name="checkmark-done" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.resultCountText, { color: theme.textSecondary }]}>
                  {filteredTransactions.length}{' '}
                  {filteredTransactions.length === 1 ? 'movimentação encontrada' : 'movimentações encontradas'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Seletor de Mês e Ano com opção para todos os meses */}
        <MonthSelector
          isAllMonths={allMonthsMode}
          showAllMonthsOption={true}
          onSelectAllMonths={() => setAllMonthsMode(true)}
          onCalendarPress={() => {
            if (allMonthsMode) setAllMonthsMode(false);
          }}
        />

        {/* Abas de Filtro: Todas, Receitas, Despesas */}
        <FilterTabs
          activeFilter={activeFilter}
          onSelectFilter={(f) => setActiveFilter(f)}
        />

        {/* Lista de Movimentações Agrupadas */}
        {groupedByDate.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="receipt-outline" size={36} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {t('transactions.noTransactionsFound')}
            </Text>
          </View>
        ) : (
          groupedByDate.map((group) => (
            <View key={group.date} style={styles.dateGroupContainer}>
              <Text style={[styles.dateGroupHeader, { color: theme.textSecondary }]}>
                {group.formattedHeader}
              </Text>

              <View
                style={[
                  styles.transactionsCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                {group.items.map((tx, idx) => (
                  <View key={tx.id}>
                    <TransactionItem
                      transaction={tx}
                      showDateInSubtitle={false}
                      onPress={() => setSelectedTx(tx)}
                      onConvertPress={() => convertPlannedToReal(tx.id)}
                    />
                    {idx < group.items.length - 1 && (
                      <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
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

                  {/* Observações em bloco estruturado para não estourar o modal */}
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

                  {/* RF02: Botão de 1 toque para Efetivar Gasto Futuro Planejado */}
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
                        Efetivar Lançamento (Converter com 1 toque)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Ações: Editar e Excluir */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: theme.primary }]}
                      onPress={() => handleEdit(selectedTx)}
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
                      onPress={() => handleDelete(selectedTx)}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  allMonthsSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allMonthsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  allMonthsToggleBtnActive: {
    shadowColor: '#5B36EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  allMonthsToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchSectionWrapper: {
    marginBottom: 8,
  },
  searchScopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 6,
  },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  scopeChipActive: {},
  scopeChipText: {
    fontSize: 12,
  },
  resultCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 4,
  },
  resultCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  dateGroupContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  dateGroupHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  transactionsCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  itemDivider: {
    height: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
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
});
