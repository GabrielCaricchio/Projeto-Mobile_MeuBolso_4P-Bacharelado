// src/contexts/FinanceContext.js
// Gerenciamento global de transações, cálculos financeiros, orçamentos, relatórios e automação de gastos recorrentes com separação total por conta

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { currencyService } from '../services/currencyService';
import { notificationService } from '../notifications/notificationService';
import { useAuth } from './AuthContext';
import {
  INITIAL_TRANSACTIONS,
  DEFAULT_BUDGETS,
  INITIAL_INITIAL_BALANCE,
  HISTORICAL_MONTHS,
  CATEGORIES_EXPENSE,
  DEFAULT_RECURRING_EXPENSES,
} from '../utils/constants';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [categoriesExpense, setCategoriesExpense] = useState(CATEGORIES_EXPENSE);
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesMessage, setRatesMessage] = useState('');
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [initialBalance, setInitialBalance] = useState(INITIAL_INITIAL_BALANCE);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // --- Inovações Proposta Amanda (Mesada Livre, Notificação Interceptada, Carteira Casal, Visibilidade) ---
  const [freeAllowance, setFreeAllowance] = useState({
    limit: 500,
    spent: 0,
    alertTriggered: false,
    silentMode: false,
  });

  const [pendingBankNotification, setPendingBankNotification] = useState(null);

  const [sharedWallet, setSharedWallet] = useState({
    isConnected: false,
    partnerName: '',
    pairCode: '',
    splitRatio: 50,
    expenses: [],
  });

  const [balanceMode, setBalanceMode] = useState('available'); // 'available' ou 'net_worth'

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [loading, setLoading] = useState(true);

  /**
   * Monitora a sessão do usuário.
   * Quando uma conta é conectada ou criada, carrega exclusivamente os dados dela.
   * Se não houver usuário logado (logout), limpa imediatamente o estado em memória.
   */
  useEffect(() => {
    if (user?.id) {
      loadFinanceData(user.id);
    } else {
      setTransactions([]);
      setRecurringExpenses([]);
      setNotes([]);
      setGoals([]);
      setBudgets(DEFAULT_BUDGETS);
      setInitialBalance(INITIAL_INITIAL_BALANCE);
      setCategoriesExpense(CATEGORIES_EXPENSE);
      setFreeAllowance({ limit: 500, spent: 0, alertTriggered: false, silentMode: false });
      setSharedWallet({ isConnected: false, partnerName: '', pairCode: '', splitRatio: 50, expenses: [] });
      setPendingBankNotification(null);
      setLoading(false);
    }
  }, [user?.id]);

  // Sincroniza e gera despesas recorrentes automaticamente quando o mês/ano mudar, apenas se o usuário possuir despesas cadastradas
  useEffect(() => {
    if (!loading && user?.id && recurringExpenses.length > 0) {
      checkAndApplyRecurringExpenses(selectedYear, selectedMonth, transactions, recurringExpenses, user.id)
        .catch((error) => console.error('Erro ao aplicar gastos recorrentes:', error));
    }
  }, [selectedYear, selectedMonth]);

  /**
   * Verifica se há gastos recorrentes ativos pertencentes a este usuário não lançados no mês selecionado
   * e gera as movimentações automaticamente no dia agendado.
   */
  async function checkAndApplyRecurringExpenses(year, monthIndex, currentTxs, recList, userId) {
    const targetUserId = userId || user?.id;
    if (!targetUserId || !recList || recList.length === 0) return 0;

    const m = monthIndex + 1;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const monthKey = `${year}-${mStr}`;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const activeRecs = (recList || []).filter((r) => r.active !== false);
    const newTxsToCreate = [];

    activeRecs.forEach((rec) => {
      const alreadyExists = (currentTxs || []).some((tx) => {
        if (!tx.date || !tx.date.startsWith(monthKey)) return false;
        if (tx.recurringExpenseId && tx.recurringExpenseId === rec.id) return true;
        if (
          tx.type === 'despesa' &&
          tx.description.trim().toLowerCase() === rec.description.trim().toLowerCase() &&
          Math.abs(Number(tx.amount) - Number(rec.amount)) < 0.01
        ) {
          return true;
        }
        return false;
      });

      if (!alreadyExists) {
        const dayNum = Math.min(daysInMonth, Math.max(1, parseInt(rec.dayOfMonth, 10) || 5));
        const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
        const autoDate = `${monthKey}-${dayStr}`;

        newTxsToCreate.push({
          id: `tx-auto-${rec.id}-${monthKey}`,
          description: rec.description,
          descricao: rec.description,
          amount: Number(rec.amount),
          valor: Number(rec.amount),
          type: 'despesa',
          tipo: 'despesa',
          category: rec.category,
          categoria: rec.category,
          categoryId: rec.categoryId,
          date: autoDate,
          dataVencimento: autoDate,
          status: 'realizado',
          observations: rec.observations || 'Lançamento automático de gasto recorrente',
          isRecurring: true,
          recurringExpenseId: rec.id,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (newTxsToCreate.length > 0) {
      const updated = [...newTxsToCreate, ...currentTxs];
      await storageService.saveTransactions(updated, targetUserId);
      setTransactions(updated);
      return newTxsToCreate.length;
    }

    return 0;
  }

  /**
   * Carrega os dados financeiros da conta especificada.
   * Contas recém-criadas iniciam com listas vazias (zero dados de testes ou de outra conta).
   */
  async function loadFinanceData(userId) {
    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      setTransactions([]);
      setRecurringExpenses([]);
      setNotes([]);
      setGoals([]);
      setBudgets(DEFAULT_BUDGETS);
      setInitialBalance(INITIAL_INITIAL_BALANCE);
      setCategoriesExpense(CATEGORIES_EXPENSE);
      setFreeAllowance({ limit: 500, spent: 0, alertTriggered: false, silentMode: false });
      setSharedWallet({ isConnected: false, partnerName: '', pairCode: '', splitRatio: 50, expenses: [] });
      setPendingBankNotification(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await storageService.initializeDefaults();

      // Carrega exclusivamente os dados indexados pelo ID deste usuário
      const txs = await storageService.getTransactions(targetUserId);
      const bds = await storageService.getBudgets(targetUserId);
      const initBal = await storageService.getInitialBalance(targetUserId);
      const recs = await storageService.getRecurringExpenses(targetUserId);
      const nts = await storageService.getNotes(targetUserId);
      const gls = await storageService.getGoals(targetUserId);
      const cats = await storageService.getCategories(targetUserId);
      const allowance = await storageService.getFreeAllowance(targetUserId);
      const wallet = await storageService.getSharedWallet(targetUserId);

      setRecurringExpenses(recs || []);
      setBudgets(bds || DEFAULT_BUDGETS);
      setInitialBalance(initBal !== null ? initBal : INITIAL_INITIAL_BALANCE);
      setNotes(nts || []);
      setGoals(gls || []);
      setCategoriesExpense(cats && cats.length > 0 ? cats : CATEGORIES_EXPENSE);
      setFreeAllowance(allowance || { limit: 500, spent: 0, alertTriggered: false, silentMode: false });
      setSharedWallet(wallet || { isConnected: false, partnerName: '', pairCode: '', splitRatio: 50, expenses: [] });

      // RF09: Lembrete diário
      notificationService.scheduleDailyReminder(20, 0);

      // RF08: Cotações em tempo real da AwesomeAPI
      refreshExchangeRates();

      // Aplica automação de despesas recorrentes APENAS se o usuário possuir regras cadastradas por ele
      let finalTxs = txs || [];
      if (recs && recs.length > 0) {
        const m = selectedMonth + 1;
        const mStr = m < 10 ? `0${m}` : `${m}`;
        const monthKey = `${selectedYear}-${mStr}`;
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

        const newTxs = [];
        recs.filter((r) => r.active !== false).forEach((rec) => {
          const exists = finalTxs.some((tx) => {
            if (!tx.date || !tx.date.startsWith(monthKey)) return false;
            if (tx.recurringExpenseId === rec.id) return true;
            if (
              tx.type === 'despesa' &&
              tx.description.trim().toLowerCase() === rec.description.trim().toLowerCase() &&
              Math.abs(Number(tx.amount) - Number(rec.amount)) < 0.01
            ) {
              return true;
            }
            return false;
          });

          if (!exists) {
            const dayNum = Math.min(daysInMonth, Math.max(1, parseInt(rec.dayOfMonth, 10) || 5));
            const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
            newTxs.push({
              id: `tx-auto-${rec.id}-${monthKey}`,
              descricao: rec.description,
              description: rec.description,
              valor: Number(rec.amount),
              amount: Number(rec.amount),
              tipo: 'despesa',
              type: 'despesa',
              categoria: rec.category,
              category: rec.category,
              categoryId: rec.categoryId,
              dataVencimento: `${monthKey}-${dayStr}`,
              date: `${monthKey}-${dayStr}`,
              status: 'realizado',
              observations: rec.observations || 'Lançamento automático de gasto recorrente',
              isRecurring: true,
              recurringExpenseId: rec.id,
              createdAt: new Date().toISOString(),
            });
          }
        });

        if (newTxs.length > 0) {
          finalTxs = [...newTxs, ...finalTxs];
          await storageService.saveTransactions(finalTxs, targetUserId);
        }
      }

      setTransactions(finalTxs);
    } catch (e) {
      console.error('Erro ao carregar dados financeiros:', e);
    } finally {
      setLoading(false);
    }
  }

  // --- Navegação entre meses ---
  function prevMonth() {
    setSelectedMonth((prev) => {
      if (prev === 0) {
        setSelectedYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }

  function nextMonth() {
    setSelectedMonth((prev) => {
      if (prev === 11) {
        setSelectedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }

  function setMonthAndYear(year, monthIndex) {
    setSelectedYear(year);
    setSelectedMonth(monthIndex);
  }

  function toggleBalanceVisibility() {
    setIsBalanceVisible((prev) => !prev);
  }

  // --- Operações CRUD de Transações (RF01 e RF02) Isoladas por Conta ---
  async function addTransaction(transactionData) {
    if (!user?.id) return { success: false, message: 'Usuário não autenticado.' };

    try {
      const installmentsCount = parseInt(transactionData.installments, 10);
      const isPretendido = transactionData.status === 'pretendido';

      // Suporte a Compras Parceladas com Desdobramento Futuro Instantâneo (Crítica 8 do Documento)
      if (installmentsCount && installmentsCount > 1 && transactionData.type !== 'receita' && transactionData.tipo !== 'entrada') {
        const totalVal = Number(transactionData.valor !== undefined ? transactionData.valor : transactionData.amount || 0);
        const installmentAmount = Number((totalVal / installmentsCount).toFixed(2));
        const baseDate = transactionData.date || transactionData.dataVencimento || new Date().toISOString().split('T')[0];
        const dateParts = baseDate.split('-');
        let startY = parseInt(dateParts[0], 10);
        let startM = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);

        const newInstallments = [];
        const baseDesc = transactionData.description || transactionData.descricao || 'Compra Parcelada';

        for (let i = 0; i < installmentsCount; i++) {
          let currM = startM + i;
          let currY = startY + Math.floor(currM / 12);
          currM = currM % 12;
          const mStr = String(currM + 1).padStart(2, '0');
          const dStr = String(Math.min(new Date(currY, currM + 1, 0).getDate(), day)).padStart(2, '0');
          const instDate = `${currY}-${mStr}-${dStr}`;
          const isFirst = i === 0;

          newInstallments.push({
            ...transactionData,
            id: `tx-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
            description: `${baseDesc} (${i + 1}/${installmentsCount})`,
            descricao: `${baseDesc} (${i + 1}/${installmentsCount})`,
            amount: installmentAmount,
            valor: installmentAmount,
            type: 'despesa',
            tipo: 'despesa',
            category: transactionData.category || transactionData.categoria,
            categoria: transactionData.categoria || transactionData.category,
            categoryId: transactionData.categoryId,
            date: instDate,
            dataVencimento: instDate,
            status: isFirst ? (transactionData.status || 'realizado') : 'pretendido',
            isInstallment: true,
            installmentIndex: i + 1,
            totalInstallments: installmentsCount,
            createdAt: new Date().toISOString(),
          });
        }

        const updated = [...newInstallments, ...transactions];
        await storageService.saveTransactions(updated, user.id);
        setTransactions(updated);
        return { success: true, transaction: newInstallments[0], transactions: newInstallments };
      }

      const newTx = {
        ...transactionData,
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        descricao: transactionData.descricao || transactionData.description,
        description: transactionData.description || transactionData.descricao,
        valor: Number(transactionData.valor !== undefined ? transactionData.valor : transactionData.amount || 0),
        amount: Number(transactionData.amount !== undefined ? transactionData.amount : transactionData.valor || 0),
        tipo: transactionData.tipo || (transactionData.type === 'receita' ? 'entrada' : 'despesa'),
        type: transactionData.type || (transactionData.tipo === 'entrada' ? 'receita' : 'despesa'),
        categoria: transactionData.categoria || transactionData.category,
        category: transactionData.category || transactionData.categoria,
        status: isPretendido ? 'pretendido' : 'realizado',
        dataVencimento: transactionData.dataVencimento || transactionData.date || new Date().toISOString().split('T')[0],
        date: transactionData.date || transactionData.dataVencimento || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      const updated = [newTx, ...transactions];
      await storageService.saveTransactions(updated, user.id);
      setTransactions(updated);

      // RF09: Se for despesa pretendida futura, agenda alerta para a data de vencimento
      if (isPretendido && newTx.type === 'despesa') {
        notificationService.scheduleExpenseDueAlert(newTx);
      }

      return { success: true, transaction: newTx };
    } catch (error) {
      return { success: false, message: 'Falha ao salvar a movimentação.' };
    }
  }

  /**
   * RF02 – Converte uma despesa ou receita pretendida/planejada em realizada com APENAS UM TOQUE
   */
  async function convertPlannedToReal(id) {
    if (!user?.id) return { success: false };

    try {
      const updated = transactions.map((tx) =>
        tx.id === id ? { ...tx, status: 'realizado' } : tx
      );
      await storageService.saveTransactions(updated, user.id);
      setTransactions(updated);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Falha ao converter gasto planejado em realizado.' };
    }
  }

  async function updateTransaction(id, updatedData) {
    if (!user?.id) return { success: false };

    try {
      const updated = transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updatedData } : tx
      );
      await storageService.saveTransactions(updated, user.id);
      setTransactions(updated);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Falha ao atualizar movimentação.' };
    }
  }

  async function deleteTransaction(id) {
    if (!user?.id) return { success: false };

    try {
      const updated = transactions.filter((tx) => tx.id !== id);
      await storageService.saveTransactions(updated, user.id);
      setTransactions(updated);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Falha ao excluir movimentação.' };
    }
  }

  // --- RF03: Bloco de Anotações Financeiras (@meubolso_anotacoes) Isolado por Conta ---
  async function addNote(noteData) {
    if (!user?.id) return { success: false };

    try {
      const newNote = {
        id: `nota-${Date.now()}`,
        titulo: noteData.titulo || noteData.title || 'Nova Anotação',
        title: noteData.title || noteData.titulo || 'Nova Anotação',
        conteudo: noteData.conteudo || noteData.content || '',
        content: noteData.content || noteData.conteudo || '',
        tag: noteData.tag || 'geral', // 'pix', 'economia', 'lembrete', 'geral'
        dataCriacao: new Date().toISOString(),
      };

      const updated = [newNote, ...notes];
      setNotes(updated);
      await storageService.saveNotes(updated, user.id);
      return { success: true, note: newNote };
    } catch (e) {
      return { success: false, message: 'Erro ao salvar anotação.' };
    }
  }

  async function updateNote(id, updatedData) {
    if (!user?.id) return { success: false };

    try {
      const updated = notes.map((n) => (n.id === id ? { ...n, ...updatedData } : n));
      setNotes(updated);
      await storageService.saveNotes(updated, user.id);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erro ao atualizar anotação.' };
    }
  }

  async function deleteNote(id) {
    if (!user?.id) return { success: false };

    try {
      const updated = notes.filter((n) => n.id !== id);
      setNotes(updated);
      await storageService.saveNotes(updated, user.id);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erro ao excluir anotação.' };
    }
  }

  // --- RF05: Metas Financeiras ("Cofrinho" / @meubolso_metas) Isoladas por Conta ---
  async function addGoal(goalData) {
    if (!user?.id) return { success: false };

    try {
      const newGoal = {
        id: `meta-${Date.now()}`,
        titulo: goalData.titulo || goalData.title || 'Novo Objetivo',
        title: goalData.title || goalData.titulo || 'Novo Objetivo',
        valorAlvo: Number(goalData.valorAlvo || goalData.targetAmount || 0),
        targetAmount: Number(goalData.targetAmount || goalData.valorAlvo || 0),
        valorAtual: Number(goalData.valorAtual || goalData.currentAmount || 0),
        currentAmount: Number(goalData.currentAmount || goalData.valorAtual || 0),
        categoria: goalData.categoria || 'Economia',
        prazo: goalData.prazo || '',
        dataCriacao: new Date().toISOString(),
      };

      const updated = [newGoal, ...goals];
      setGoals(updated);
      await storageService.saveGoals(updated, user.id);
      return { success: true, goal: newGoal };
    } catch (e) {
      return { success: false, message: 'Erro ao criar meta.' };
    }
  }

  async function updateGoal(id, updatedData) {
    if (!user?.id) return { success: false };

    try {
      const updated = goals.map((g) => (g.id === id ? { ...g, ...updatedData } : g));
      setGoals(updated);
      await storageService.saveGoals(updated, user.id);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erro ao atualizar meta.' };
    }
  }

  async function deleteGoal(id) {
    if (!user?.id) return { success: false };

    try {
      const updated = goals.filter((g) => g.id !== id);
      setGoals(updated);
      await storageService.saveGoals(updated, user.id);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erro ao excluir meta.' };
    }
  }

  async function depositToGoal(id, amount) {
    if (!user?.id) return { success: false };

    try {
      const numeric = parseFloat(amount) || 0;
      const updated = goals.map((g) =>
        g.id === id ? { ...g, valorAtual: (Number(g.valorAtual) || 0) + numeric } : g
      );
      setGoals(updated);
      await storageService.saveGoals(updated, user.id);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erro ao guardar valor na meta.' };
    }
  }

  async function withdrawFromGoal(id, amount) {
    if (!user?.id) return { success: false };

    try {
      const numeric = parseFloat(amount) || 0;
      const updated = goals.map((g) =>
        g.id === id ? { ...g, valorAtual: Math.max(0, (Number(g.valorAtual) || 0) - numeric) } : g
      );
      setGoals(updated);
      await storageService.saveGoals(updated, user.id);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erro ao retirar valor da meta.' };
    }
  }

  // --- RF08: Consulta e Atualização de Cotações de Moedas (AwesomeAPI) ---
  async function refreshExchangeRates(force = false) {
    setLoadingRates(true);
    try {
      const res = await currencyService.getExchangeRates(force);
      if (res.data) {
        setExchangeRates(res.data);
      }
      setRatesMessage(res.message || '');
      return res;
    } catch (e) {
      console.warn('Erro ao atualizar cotações cambiais:', e);
    } finally {
      setLoadingRates(false);
    }
  }

  // --- Gerenciamento de Gastos Recorrentes Mensais Isolados por Conta ---
  async function addRecurringExpense(recData) {
    if (!user?.id) return { success: false };

    try {
      const newRec = {
        ...recData,
        id: `rec-${Date.now()}`,
        active: recData.active !== undefined ? recData.active : true,
        dayOfMonth: parseInt(recData.dayOfMonth, 10) || 5,
        createdAt: new Date().toISOString(),
      };

      const updatedRecs = [newRec, ...recurringExpenses];
      setRecurringExpenses(updatedRecs);
      await storageService.saveRecurringExpenses(updatedRecs, user.id);

      if (newRec.active) {
        checkAndApplyRecurringExpenses(selectedYear, selectedMonth, transactions, updatedRecs, user.id);
      }

      return { success: true, recurringExpense: newRec };
    } catch (e) {
      return { success: false, message: 'Falha ao salvar gasto recorrente.' };
    }
  }

  async function updateRecurringExpense(id, updatedData) {
    if (!user?.id) return { success: false };

    try {
      const updated = recurringExpenses.map((r) =>
        r.id === id ? { ...r, ...updatedData } : r
      );
      setRecurringExpenses(updated);
      await storageService.saveRecurringExpenses(updated, user.id);

      // Quando alterar o dia do vencimento (ou outros dados) do gasto recorrente,
      // atualiza automaticamente a data de todas as transações geradas por ele
      const newDayNum = updatedData.dayOfMonth !== undefined ? parseInt(updatedData.dayOfMonth, 10) : null;
      let txsChanged = false;

      const updatedTxs = transactions.map((tx) => {
        if (tx.recurringExpenseId === id) {
          txsChanged = true;
          let newDate = tx.date;
          if (newDayNum && tx.date) {
            const parts = tx.date.split('-');
            if (parts.length === 3) {
              const y = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10);
              const daysInMonth = new Date(y, m, 0).getDate();
              const safeDay = Math.min(daysInMonth, Math.max(1, newDayNum));
              const dStr = String(safeDay).padStart(2, '0');
              const mStr = String(m).padStart(2, '0');
              newDate = `${y}-${mStr}-${dStr}`;
            }
          }
          return {
            ...tx,
            date: newDate,
            dataVencimento: newDate,
            description: updatedData.description !== undefined ? updatedData.description : tx.description,
            descricao: updatedData.description !== undefined ? updatedData.description : tx.descricao,
            amount: updatedData.amount !== undefined ? Number(updatedData.amount) : tx.amount,
            valor: updatedData.amount !== undefined ? Number(updatedData.amount) : tx.valor,
            category: updatedData.category !== undefined ? updatedData.category : tx.category,
            categoria: updatedData.category !== undefined ? updatedData.category : tx.categoria,
            categoryId: updatedData.categoryId !== undefined ? updatedData.categoryId : tx.categoryId,
            observations: updatedData.observations !== undefined ? updatedData.observations : tx.observations,
          };
        }
        return tx;
      });

      if (txsChanged) {
        setTransactions(updatedTxs);
        await storageService.saveTransactions(updatedTxs, user.id);
      }

      return { success: true };
    } catch (e) {
      return { success: false, message: 'Falha ao atualizar gasto recorrente.' };
    }
  }

  async function deleteRecurringExpense(id) {
    if (!user?.id) return { success: false };

    try {
      const updated = recurringExpenses.filter((r) => r.id !== id);
      setRecurringExpenses(updated);
      await storageService.saveRecurringExpenses(updated, user.id);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Falha ao excluir gasto recorrente.' };
    }
  }

  async function toggleRecurringExpense(id) {
    if (!user?.id) return { success: false };

    try {
      const rec = recurringExpenses.find((r) => r.id === id);
      if (!rec) return { success: false };

      const updated = recurringExpenses.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r
      );
      setRecurringExpenses(updated);
      await storageService.saveRecurringExpenses(updated, user.id);

      if (!rec.active) {
        checkAndApplyRecurringExpenses(selectedYear, selectedMonth, transactions, updated, user.id);
      }

      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  async function syncRecurringForCurrentMonth() {
    if (!user?.id) return { success: false, addedCount: 0 };
    const count = checkAndApplyRecurringExpenses(selectedYear, selectedMonth, transactions, recurringExpenses, user.id);
    return { success: true, addedCount: count };
  }

  async function updateBudgets(newBudgets) {
    if (!user?.id) return { success: false };

    try {
      setBudgets(newBudgets);
      await storageService.saveBudgets(newBudgets, user.id);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Falha ao atualizar orçamento.' };
    }
  }

  async function updateInitialBalance(amount) {
    if (!user?.id) return { success: false };

    try {
      const num = parseFloat(amount) || 0;
      setInitialBalance(num);
      await storageService.saveInitialBalance(num, user.id);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erro ao atualizar saldo inicial.' };
    }
  }

  // --- Gerenciamento de Categorias de Despesa (Criação, Edição e Exclusão) ---
  async function addCategory(categoryData) {
    if (!user?.id) return { success: false, message: 'Usuário não autenticado.' };

    try {
      const sanitizedName = (categoryData.name || '').trim();
      if (!sanitizedName) {
        return { success: false, message: 'Nome da categoria é obrigatório.' };
      }

      const id = `cat_${Date.now()}`;
      const newCat = {
        id,
        name: sanitizedName,
        icon: categoryData.icon || 'pricetag-outline',
        iconType: 'Ionicons',
        color: categoryData.color || '#8B5CF6',
        isCustom: true,
      };

      const updatedCats = [...categoriesExpense, newCat];
      setCategoriesExpense(updatedCats);
      await storageService.saveCategories(updatedCats, user.id);

      // Se informou limite de orçamento, define no orçamento da categoria
      if (categoryData.budgetLimit !== undefined && categoryData.budgetLimit !== null && categoryData.budgetLimit !== '') {
        const numLimit = parseFloat(categoryData.budgetLimit) || 0;
        const updatedBudgets = {
          ...budgets,
          categories: {
            ...(budgets?.categories || {}),
            [id]: numLimit,
          },
        };
        setBudgets(updatedBudgets);
        await storageService.saveBudgets(updatedBudgets, user.id);
      }

      return { success: true, category: newCat };
    } catch (e) {
      console.error('Erro ao adicionar categoria:', e);
      return { success: false, message: 'Falha ao salvar categoria.' };
    }
  }

  async function updateCategory(id, updatedData) {
    if (!user?.id) return { success: false };

    try {
      const prevCat = categoriesExpense.find((c) => c.id === id);
      const newName = (updatedData.name || '').trim();

      const updatedCats = categoriesExpense.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            name: newName || c.name,
            icon: updatedData.icon || c.icon,
            color: updatedData.color || c.color,
          };
        }
        return c;
      });

      setCategoriesExpense(updatedCats);
      await storageService.saveCategories(updatedCats, user.id);

      // Atualiza movimentações se o nome da categoria foi renomeado
      if (prevCat && newName && prevCat.name !== newName) {
        const oldName = prevCat.name;
        const updatedTxs = transactions.map((tx) => {
          if (tx.categoryId === id || tx.category === oldName || tx.categoria === oldName) {
            return {
              ...tx,
              category: newName,
              categoria: newName,
              categoryId: id,
            };
          }
          return tx;
        });
        setTransactions(updatedTxs);
        await storageService.saveTransactions(updatedTxs, user.id);
      }

      // Atualiza limite de orçamento se fornecido
      if (updatedData.budgetLimit !== undefined && updatedData.budgetLimit !== null && updatedData.budgetLimit !== '') {
        const numLimit = parseFloat(updatedData.budgetLimit) || 0;
        const updatedBudgets = {
          ...budgets,
          categories: {
            ...(budgets?.categories || {}),
            [id]: numLimit,
          },
        };
        setBudgets(updatedBudgets);
        await storageService.saveBudgets(updatedBudgets, user.id);
      }

      return { success: true };
    } catch (e) {
      console.error('Erro ao atualizar categoria:', e);
      return { success: false, message: 'Falha ao atualizar categoria.' };
    }
  }

  async function deleteCategory(id) {
    if (!user?.id) return { success: false };

    try {
      const updatedCats = categoriesExpense.filter((c) => c.id !== id);
      setCategoriesExpense(updatedCats);
      await storageService.saveCategories(updatedCats, user.id);

      // Remove do orçamento
      const updatedCategoriesBudget = { ...(budgets?.categories || {}) };
      delete updatedCategoriesBudget[id];
      const updatedBudgets = {
        ...budgets,
        categories: updatedCategoriesBudget,
      };
      setBudgets(updatedBudgets);
      await storageService.saveBudgets(updatedBudgets, user.id);

      return { success: true };
    } catch (e) {
      console.error('Erro ao excluir categoria:', e);
      return { success: false, message: 'Falha ao excluir categoria.' };
    }
  }

  async function resetAllData() {
    try {
      if (user?.id) {
        await storageService.resetUserData(user.id);
      }
      setTransactions([]);
      setRecurringExpenses([]);
      setNotes([]);
      setGoals([]);
      setBudgets(DEFAULT_BUDGETS);
      setInitialBalance(INITIAL_INITIAL_BALANCE);
      setCategoriesExpense(CATEGORIES_EXPENSE);
      setFreeAllowance({ limit: 500, spent: 0, alertTriggered: false, silentMode: false });
      setSharedWallet({ isConnected: false, partnerName: '', pairCode: '', splitRatio: 50, expenses: [] });
      setPendingBankNotification(null);
      return true;
    } catch (error) {
      return { success: false };
    }
  }

  // =========================================================================
  // PILAR 1: MESADA LIVRE INTELIGENTE (Passo 1 do Documento Proposta Amanda)
  // =========================================================================
  async function updateFreeAllowanceLimit(limit) {
    if (!user?.id) return { success: false };
    const num = Math.max(0, parseFloat(limit) || 0);
    const updated = {
      ...freeAllowance,
      limit: num,
    };
    setFreeAllowance(updated);
    await storageService.saveFreeAllowance(updated, user.id);
    return { success: true };
  }

  async function deductFromFreeAllowance(amount, description, category = 'Lazer') {
    if (!user?.id) return { success: false };
    const num = parseFloat(amount) || 0;
    if (num <= 0) return { success: false };

    const newSpent = (freeAllowance.spent || 0) + num;
    const isOver = newSpent >= freeAllowance.limit;
    let newAlertTriggered = freeAllowance.alertTriggered;
    let shouldNotify = false;

    // Regra de Notificação Única e Modo Silencioso (Item 4 do Documento):
    // Dispara apenas um único alerta definitivo avisando sobre o estouro.
    // Gastos subsequentes continuam sendo contabilizados sem gerar novos pop-ups.
    if (isOver && !freeAllowance.alertTriggered) {
      newAlertTriggered = true;
      shouldNotify = true;
    }

    const updatedAllowance = {
      ...freeAllowance,
      spent: newSpent,
      alertTriggered: newAlertTriggered,
      silentMode: isOver,
    };

    setFreeAllowance(updatedAllowance);
    await storageService.saveFreeAllowance(updatedAllowance, user.id);

    // Registra como movimentação realizada no extrato oficial
    const desc = description || 'Mesada Livre';
    await addTransaction({
      description: desc,
      descricao: desc,
      amount: num,
      valor: num,
      type: 'despesa',
      tipo: 'despesa',
      category: category || 'Lazer',
      categoria: category || 'Lazer',
      isFreeAllowance: true,
      status: 'realizado',
      date: new Date().toISOString().split('T')[0],
      observations: 'Abatido automaticamente da Mesada Livre',
    });

    return {
      success: true,
      newSpent,
      remaining: Math.max(0, updatedAllowance.limit - newSpent),
      isOver,
      shouldNotify,
    };
  }

  async function resetFreeAllowanceCycle() {
    if (!user?.id) return { success: false };
    const updated = {
      ...freeAllowance,
      spent: 0,
      alertTriggered: false,
      silentMode: false,
    };
    setFreeAllowance(updated);
    await storageService.saveFreeAllowance(updated, user.id);
    return { success: true };
  }

  // =========================================================================
  // PILAR 2: CAPTURA INVISÍVEL (Passo 2 do Documento - Intercepção Notificações)
  // =========================================================================
  function triggerBankNotification(bank = 'Nubank', amount = 25.0, merchant = "McDonald's", category = 'Alimentação') {
    const formattedVal = Number(amount).toFixed(2).replace('.', ',');
    const notification = {
      id: `bank-notif-${Date.now()}`,
      bank,
      amount: Number(amount),
      merchant,
      category,
      rawText: `Compra aprovada no ${bank} de R$ ${formattedVal} em ${merchant}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setPendingBankNotification(notification);
    return notification;
  }

  async function acceptBankNotification(notificationId, target = 'mesada') {
    if (!pendingBankNotification || pendingBankNotification.id !== notificationId) {
      return { success: false };
    }

    const notif = pendingBankNotification;
    setPendingBankNotification(null);

    if (target === 'mesada') {
      return await deductFromFreeAllowance(notif.amount, notif.merchant, notif.category);
    } else {
      return await addTransaction({
        description: notif.merchant,
        descricao: notif.merchant,
        amount: notif.amount,
        valor: notif.amount,
        type: 'despesa',
        tipo: 'despesa',
        category: notif.category,
        categoria: notif.category,
        status: 'realizado',
        date: new Date().toISOString().split('T')[0],
        observations: `Capturado via notificação bancária (${notif.bank})`,
      });
    }
  }

  function dismissBankNotification() {
    setPendingBankNotification(null);
  }

  // =========================================================================
  // PILAR 3: IA DE COMANDO DE VOZ RÁPIDO EM < 2 SEGUNDOS (Passo 3 do Documento)
  // =========================================================================
  async function processVoiceCommand(rawTranscript) {
    const startTime = Date.now();
    if (!rawTranscript || !rawTranscript.trim()) {
      return { success: false, message: 'Nenhum áudio ou texto identificado.' };
    }

    const text = rawTranscript.trim();
    const lower = text.toLowerCase();

    // 1. Extração do valor com suporte a decimais e moeda
    let parsedAmount = null;
    const amountRegex = /(?:r\$\s*|rs\s*)?(\d+(?:[.,]\d{1,2})?)(?:\s*(?:reais|real))?/i;
    const match = text.match(amountRegex);
    if (match && match[1]) {
      parsedAmount = parseFloat(match[1].replace(',', '.'));
    }

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return {
        success: false,
        message: 'Não identificamos o valor na fala. Fale por exemplo: "Gastei 45 reais de gasolina no posto Shell".',
      };
    }

    // 2. Dicionário Semântico Anti-Erro de PIX (Crítica 6 da Tabela de Pesquisa):
    // Não assume automaticamente que 'PIX' é despesa; reconhece o contexto de 'PIX recebido'
    const isIncome =
      lower.includes('pix recebido') ||
      lower.includes('recebi') ||
      lower.includes('salário') ||
      lower.includes('salario') ||
      lower.includes('depósito') ||
      lower.includes('deposito') ||
      lower.includes('renda extra') ||
      lower.includes('rendimento');

    const type = isIncome ? 'receita' : 'despesa';

    // 3. Reconhecimento Contextual de Categorias e Estabelecimento
    let category = isIncome ? 'Salário' : 'Outros';
    let establishment = text;

    if (isIncome) {
      if (lower.includes('pix')) category = 'Renda extra';
      else if (lower.includes('investimento') || lower.includes('rendimento')) category = 'Investimentos';
      else category = 'Salário';
      establishment = text.replace(/(recebi|pix recebido de|salário|salario|depósito|deposito)/gi, '').trim() || 'Recebimento';
    } else {
      if (
        lower.includes('gasolina') ||
        lower.includes('posto') ||
        lower.includes('combustivel') ||
        lower.includes('combustível') ||
        lower.includes('uber') ||
        lower.includes('onibus') ||
        lower.includes('estacionamento')
      ) {
        category = 'Transporte';
      } else if (
        lower.includes('almoço') ||
        lower.includes('almoco') ||
        lower.includes('jantar') ||
        lower.includes('lanche') ||
        lower.includes('mcdonald') ||
        lower.includes('mcdonalds') ||
        lower.includes('cafe') ||
        lower.includes('café') ||
        lower.includes('restaurante') ||
        lower.includes('supermercado') ||
        lower.includes('mercado') ||
        lower.includes('padaria')
      ) {
        category = 'Alimentação';
      } else if (
        lower.includes('aluguel') ||
        lower.includes('condominio') ||
        lower.includes('condomínio') ||
        lower.includes('luz') ||
        lower.includes('agua') ||
        lower.includes('água') ||
        lower.includes('internet')
      ) {
        category = 'Moradia';
      } else if (
        lower.includes('cinema') ||
        lower.includes('filme') ||
        lower.includes('praia') ||
        lower.includes('show') ||
        lower.includes('festa') ||
        lower.includes('bar') ||
        lower.includes('cerveja')
      ) {
        category = 'Lazer';
      } else if (
        lower.includes('farmacia') ||
        lower.includes('farmácia') ||
        lower.includes('remedio') ||
        lower.includes('remédio') ||
        lower.includes('medico') ||
        lower.includes('médico') ||
        lower.includes('hospital')
      ) {
        category = 'Saúde';
      } else if (
        lower.includes('curso') ||
        lower.includes('faculdade') ||
        lower.includes('livro') ||
        lower.includes('escola')
      ) {
        category = 'Educação';
      }

      // Limpa termos desnecessários do texto para isolar o nome do local
      establishment = text
        .replace(/(gastei|paguei|comprei|pix enviado de|reais|real|\d+(?:[.,]\d+)?)/gi, '')
        .replace(/(no|na|de|com|em|para)\s+/gi, '')
        .trim();
      if (!establishment) establishment = category;
      establishment = establishment.charAt(0).toUpperCase() + establishment.slice(1);
    }

    const newTx = {
      description: establishment,
      descricao: establishment,
      amount: parsedAmount,
      valor: parsedAmount,
      type,
      tipo: type === 'receita' ? 'entrada' : 'despesa',
      category,
      categoria: category,
      status: 'realizado',
      date: new Date().toISOString().split('T')[0],
      observations: `Comando de voz da IA: "${text}"`,
    };

    const res = await addTransaction(newTx);
    const executionTimeMs = Date.now() - startTime;

    return {
      success: res.success,
      transaction: res.transaction,
      executionTimeMs,
      extracted: {
        amount: parsedAmount,
        type,
        category,
        description: establishment,
      },
    };
  }

  // =========================================================================
  // PILAR 4: CARTEIRA COMPARTILHADA PARA CASAIS (Passo 4 - Arrastar para Dividir)
  // =========================================================================
  async function connectSharedWallet(partnerName, pairCode = null) {
    if (!user?.id) return { success: false };
    const code = pairCode || `CASAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const updated = {
      ...sharedWallet,
      isConnected: true,
      partnerName: partnerName || 'Parceiro(a)',
      pairCode: code,
      splitRatio: sharedWallet.splitRatio || 50,
    };
    setSharedWallet(updated);
    await storageService.saveSharedWallet(updated, user.id);
    return { success: true, wallet: updated };
  }

  async function disconnectSharedWallet() {
    if (!user?.id) return { success: false };
    const updated = {
      isConnected: false,
      partnerName: '',
      pairCode: '',
      splitRatio: 50,
      expenses: [],
    };
    setSharedWallet(updated);
    await storageService.saveSharedWallet(updated, user.id);
    return { success: true };
  }

  async function splitTransactionWithPartner(txId, customSplitRatio = null) {
    if (!user?.id) return { success: false };
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx) return { success: false, message: 'Movimentação não encontrada.' };

    const ratio = customSplitRatio !== null ? customSplitRatio : (sharedWallet.splitRatio || 50);
    const partnerSharePercent = 100 - ratio;
    const totalVal = Number(targetTx.amount || 0);
    const partnerDebit = Number(((totalVal * partnerSharePercent) / 100).toFixed(2));

    const sharedEntry = {
      id: `shared-${Date.now()}`,
      originalTxId: txId,
      description: targetTx.description,
      totalAmount: totalVal,
      paidBy: user.name || 'Você',
      partnerName: sharedWallet.partnerName || 'Parceiro(a)',
      splitRatio: ratio,
      partnerShareAmount: partnerDebit,
      date: targetTx.date || new Date().toISOString().split('T')[0],
      category: targetTx.category || 'Gastos Comuns',
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = [sharedEntry, ...(sharedWallet.expenses || [])];
    const updatedWallet = {
      ...sharedWallet,
      expenses: updatedExpenses,
    };

    setSharedWallet(updatedWallet);
    await storageService.saveSharedWallet(updatedWallet, user.id);
    return { success: true, sharedEntry };
  }

  async function addSharedExpense(expenseData) {
    if (!user?.id) return { success: false };
    const totalVal = Number(expenseData.amount || 0);
    const ratio = expenseData.splitRatio !== undefined ? expenseData.splitRatio : (sharedWallet.splitRatio || 50);
    const partnerSharePercent = 100 - ratio;
    const partnerDebit = Number(((totalVal * partnerSharePercent) / 100).toFixed(2));

    const sharedEntry = {
      id: `shared-${Date.now()}`,
      description: expenseData.description || 'Gasto Comum',
      totalAmount: totalVal,
      paidBy: expenseData.paidBy || user.name || 'Você',
      partnerName: sharedWallet.partnerName || 'Parceiro(a)',
      splitRatio: ratio,
      partnerShareAmount: partnerDebit,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      category: expenseData.category || 'Gastos Comuns',
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = [sharedEntry, ...(sharedWallet.expenses || [])];
    const updatedWallet = {
      ...sharedWallet,
      expenses: updatedExpenses,
    };

    setSharedWallet(updatedWallet);
    await storageService.saveSharedWallet(updatedWallet, user.id);
    return { success: true, sharedEntry };
  }

  async function settleSharedDebts() {
    if (!user?.id) return { success: false };
    const updatedExpenses = (sharedWallet.expenses || []).map((e) => ({
      ...e,
      status: 'acertado',
    }));
    const updatedWallet = {
      ...sharedWallet,
      expenses: updatedExpenses,
    };
    setSharedWallet(updatedWallet);
    await storageService.saveSharedWallet(updatedWallet, user.id);
    return { success: true };
  }

  // Balanço de acertos do casal (quem deve para quem)
  const sharedWalletSummary = useMemo(() => {
    let partnerOwesUser = 0;
    let userOwesPartner = 0;
    let totalCommonSpent = 0;

    (sharedWallet.expenses || []).forEach((exp) => {
      totalCommonSpent += Number(exp.totalAmount || 0);
      if (exp.status !== 'acertado') {
        if (exp.paidBy === (user?.name || 'Você')) {
          partnerOwesUser += Number(exp.partnerShareAmount || 0);
        } else {
          const userShare = Number(exp.totalAmount || 0) - Number(exp.partnerShareAmount || 0);
          userOwesPartner += userShare;
        }
      }
    });

    const netDifference = partnerOwesUser - userOwesPartner;

    return {
      totalCommonSpent,
      partnerOwesUser,
      userOwesPartner,
      netDifference,
      summaryText:
        netDifference > 0
          ? `${sharedWallet.partnerName || 'Parceiro'} deve R$ ${netDifference.toFixed(2).replace('.', ',')} para você`
          : netDifference < 0
          ? `Você deve R$ ${Math.abs(netDifference).toFixed(2).replace('.', ',')} para ${sharedWallet.partnerName || 'Parceiro'}`
          : 'Contas do casal 100% acertadas!',
    };
  }, [sharedWallet, user]);

  // =========================================================================
  // CRÍTICA 7: CHAVE DE VISIBILIDADE DE SALDO (Saldo Disponível vs Patrimônio)
  // =========================================================================
  function toggleBalanceMode() {
    setBalanceMode((prev) => (prev === 'available' ? 'net_worth' : 'available'));
  }

  // =========================================================================
  // CRÍTICA 11: EXPORTAÇÃO REAL DE DADOS EM CSV / EXCEL
  // =========================================================================
  function exportDataToCSV() {
    const headers = 'ID,Data,Tipo,Descricao,Categoria,Valor,Status,Observacoes\n';
    const rows = transactions
      .map((t) => {
        const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
        const cat = `"${(t.category || '').replace(/"/g, '""')}"`;
        const obs = `"${(t.observations || '').replace(/"/g, '""')}"`;
        return `${t.id},${t.date},${t.type},${desc},${cat},${(t.amount || 0).toFixed(2)},${t.status},${obs}`;
      })
      .join('\n');
    return headers + rows;
  }

  // Total mensal fixo de gastos recorrentes ativos
  const recurringMonthlyTotal = useMemo(() => {
    return (recurringExpenses || [])
      .filter((r) => r.active !== false)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [recurringExpenses]);

  // Chave do mês selecionado 'YYYY-MM'
  const currentMonthKey = useMemo(() => {
    const m = selectedMonth + 1;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${selectedYear}-${mStr}`;
  }, [selectedYear, selectedMonth]);

  // Transações do mês selecionado ordenadas cronologicamente
  const currentMonthTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.date && tx.date.startsWith(currentMonthKey))
      .sort((a, b) => {
        if (a.date !== b.date) {
          return (b.date || '').localeCompare(a.date || '');
        }
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [transactions, currentMonthKey]);

  // Totais do mês selecionado separando realizados até hoje e pretendidos/futuros
  const {
    monthlyIncomes,
    monthlyExpenses,
    monthlyResult,
    pendingExpenses,
    pendingIncomes,
  } = useMemo(() => {
    let incReal = 0;
    let expReal = 0;
    let incPend = 0;
    let expPend = 0;

    const todayISO = new Date().toISOString().split('T')[0];

    currentMonthTransactions.forEach((tx) => {
      const val = Number(tx.valor !== undefined ? tx.valor : tx.amount || 0);
      const isFutureDate = tx.date && tx.date > todayISO;
      const isPret = tx.status === 'pretendido' || isFutureDate;

      if (tx.type === 'receita' || tx.tipo === 'entrada') {
        if (isPret) incPend += val;
        else incReal += val;
      } else {
        if (isPret) expPend += val;
        else expReal += val;
      }
    });

    return {
      monthlyIncomes: incReal,
      monthlyExpenses: expReal,
      monthlyResult: incReal - expReal,
      pendingExpenses: expPend,
      pendingIncomes: incPend,
    };
  }, [currentMonthTransactions]);

  // RF06 – Saldo Atual Líquido Disponível (apenas movimentações realizadas até hoje)
  const currentTotalBalance = useMemo(() => {
    return initialBalance + monthlyResult;
  }, [initialBalance, monthlyResult]);

  // Total acumulado em Metas ("Cofrinho")
  const totalGoalsSaved = useMemo(() => {
    return (goals || []).reduce((acc, curr) => acc + (Number(curr.valorAtual) || 0), 0);
  }, [goals]);

  // Saldo exibido baseado na chave de visibilidade (Saldo Disponível vs Patrimônio Líquido Total com Metas/Cofrinho)
  const displayBalance = useMemo(() => {
    if (balanceMode === 'net_worth') {
      return currentTotalBalance + totalGoalsSaved;
    }
    return currentTotalBalance;
  }, [balanceMode, currentTotalBalance, totalGoalsSaved]);

  // RF06 – Projeção de Saldo Futuro baseado nos gastos pretendidos e futuros mapeados
  const projectedFutureBalance = useMemo(() => {
    return currentTotalBalance + pendingIncomes - pendingExpenses;
  }, [currentTotalBalance, pendingIncomes, pendingExpenses]);

  // Orçamento: Cálculos de utilização e disponibilidade
  const budgetSummary = useMemo(() => {
    const planned = Number(budgets?.totalPlanned) || 4800;
    const used = monthlyExpenses;
    const available = Math.max(0, planned - used);
    const percentage = planned > 0 ? Math.round((used / planned) * 100) : 0;

    return {
      planned,
      used,
      available,
      percentage,
    };
  }, [budgets, monthlyExpenses]);

  // Orçamento por Categoria (dinâmico baseado em todas as categorias de despesa do usuário)
  const categoryBudgetsStatus = useMemo(() => {
    const spentByCategory = {};
    currentMonthTransactions
      .filter((tx) => tx.type === 'despesa' || tx.tipo === 'despesa')
      .forEach((tx) => {
        const catId = tx.categoryId || tx.category?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const catName = (tx.category || tx.categoria || '').trim().toLowerCase();
        const val = Number(tx.amount !== undefined ? tx.amount : tx.valor || 0);
        if (catId) {
          spentByCategory[catId] = (spentByCategory[catId] || 0) + val;
        }
        if (catName) {
          spentByCategory[catName] = (spentByCategory[catName] || 0) + val;
        }
      });

    const list = (categoriesExpense || []).map((cat) => {
      const normalizedName = (cat.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const spent = spentByCategory[cat.id] || spentByCategory[cat.name.toLowerCase()] || spentByCategory[normalizedName] || 0;
      const limit = budgets?.categories?.[cat.id] !== undefined
        ? budgets.categories[cat.id]
        : (budgets?.categories?.[normalizedName] !== undefined ? budgets.categories[normalizedName] : 500);
      const remaining = Math.max(0, limit - spent);
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const isNearLimit = spent > 0 && percent >= 90 && percent < 100;
      const isOverLimit = spent > 0 && percent >= 100;

      return {
        ...cat,
        spent,
        limit,
        remaining,
        percent,
        isNearLimit,
        isOverLimit,
      };
    });

    return list;
  }, [currentMonthTransactions, budgets, categoriesExpense]);

  const budgetAlertCategory = useMemo(() => {
    if (!currentMonthTransactions || currentMonthTransactions.length === 0) {
      return null;
    }
    const hasAnyExpense = currentMonthTransactions.some(
      (tx) => (tx.type === 'despesa' || tx.tipo === 'despesa') && Number(tx.amount || tx.valor || 0) > 0
    );
    if (!hasAnyExpense) {
      return null;
    }
    return categoryBudgetsStatus.find((c) => (c.isNearLimit || c.isOverLimit) && c.spent > 0);
  }, [categoryBudgetsStatus, currentMonthTransactions]);

  // Função utilitária para gerar relatório de categorias em qualquer lista de transações (dia, semana, mês, ano)
  const getCategoryReportForTransactions = useCallback(
    (txList) => {
      const spentByCategory = {};
      let totalExpense = 0;

      (txList || [])
        .filter((tx) => tx.type === 'despesa' || tx.tipo === 'despesa')
        .forEach((tx) => {
          const name = tx.category || tx.categoria || 'Outros';
          const val = Number(tx.amount !== undefined ? tx.amount : tx.valor || 0);
          spentByCategory[name] = (spentByCategory[name] || 0) + val;
          totalExpense += val;
        });

      const colorsMap = {};
      (categoriesExpense || []).forEach((c) => {
        if (c.name && c.color) {
          colorsMap[c.name] = c.color;
        }
      });

      const fallbackColors = [
        '#5B36EC',
        '#8B5CF6',
        '#A78BFA',
        '#C4B5FD',
        '#DDD6FE',
        '#F59E0B',
        '#3B82F6',
        '#10B981',
        '#EC4899',
        '#06B6D4',
      ];

      const categories = Object.keys(spentByCategory).sort((a, b) => spentByCategory[b] - spentByCategory[a]);

      const items = categories.map((catName, idx) => {
        const amount = spentByCategory[catName];
        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        return {
          name: catName,
          amount,
          percentage: Number(percentage.toFixed(1)),
          color: colorsMap[catName] || fallbackColors[idx % fallbackColors.length],
        };
      });

      const top = items.length > 0 ? items[0] : null;

      return {
        items,
        totalExpense,
        topExpense: top,
      };
    },
    [categoriesExpense]
  );

  // Relatório de gastos por categoria para o mês selecionado
  const categoryReport = useMemo(() => {
    return getCategoryReportForTransactions(currentMonthTransactions);
  }, [getCategoryReportForTransactions, currentMonthTransactions]);

  // Gráfico de Barras comparativo dinâmico baseado nas transações reais
  const barChartComparison = useMemo(() => {
    const shortMonthNamesPT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const targetMonths = [];

    // Compara os 3 últimos meses até o mês selecionado
    for (let offset = 2; offset >= 0; offset--) {
      let targetM = selectedMonth - offset;
      let targetY = selectedYear;
      if (targetM < 0) {
        targetM += 12;
        targetY -= 1;
      }
      const mNum = targetM + 1;
      const mKey = `${targetY}-${mNum < 10 ? `0${mNum}` : mNum}`;

      let inc = 0;
      let exp = 0;
      (transactions || []).forEach((tx) => {
        if (tx.date && tx.date.startsWith(mKey)) {
          const val = Number(tx.amount) || 0;
          if (tx.type === 'receita') inc += val;
          else exp += val;
        }
      });

      targetMonths.push({
        monthKey: mKey,
        monthLabel: shortMonthNamesPT[targetM],
        monthIndex: targetM,
        year: targetY,
        incomes: inc,
        expenses: exp,
        saved: inc - exp,
      });
    }

    const currentEntry = targetMonths[2];
    const previousMonth = targetMonths[1];
    let expenseDiffPct = 0;
    let savedDiffPct = 0;

    if (previousMonth) {
      if (previousMonth.expenses > 0) {
        expenseDiffPct = ((currentEntry.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;
      }
      if (previousMonth.saved > 0) {
        savedDiffPct = ((currentEntry.saved - previousMonth.saved) / previousMonth.saved) * 100;
      }
    }

    return {
      months: targetMonths,
      expenseDiffPct: Math.abs(expenseDiffPct).toFixed(1).replace('.', ','),
      expenseWentDown: expenseDiffPct <= 0,
      savedDiffPct: Math.abs(savedDiffPct).toFixed(1).replace('.', ','),
      savedWentUp: savedDiffPct >= 0,
    };
  }, [transactions, selectedYear, selectedMonth]);

  // Pontos da curva suave de evolução do saldo ao longo dos dias do mês
  const evolutionPoints = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [1, 5, 10, 15, 20, 25, daysInMonth];
    const shortMonthNamesPT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const monthAbbr = shortMonthNamesPT[selectedMonth] || 'out';

    const txByDay = {};
    currentMonthTransactions.forEach((tx) => {
      const dateStr = tx.date || tx.dataVencimento;
      if (!dateStr || typeof dateStr !== 'string') return;
      const parts = dateStr.split('-');
      if (parts.length < 3) return;
      const d = parseInt(parts[2], 10);
      if (!txByDay[d]) txByDay[d] = 0;
      txByDay[d] += tx.type === 'receita' ? Number(tx.amount || 0) : -Number(tx.amount || 0);
    });

    const points = days.map((day) => {
      let balanceAtDay = initialBalance;
      Object.keys(txByDay).forEach((dStr) => {
        const d = parseInt(dStr, 10);
        if (d <= day) {
          balanceAtDay += txByDay[d];
        }
      });

      return {
        day,
        label: day === 1 ? `01 ${monthAbbr}` : day === daysInMonth ? `${daysInMonth} ${monthAbbr}` : `${day < 10 ? '0' : ''}${day}`,
        balance: balanceAtDay,
      };
    });

    return points;
  }, [initialBalance, currentMonthTransactions, selectedYear, selectedMonth]);

  return (
    <FinanceContext.Provider
      value={{
        loading,
        transactions,
        recurringExpenses,
        recurringMonthlyTotal,
        budgets,
        initialBalance,
        isBalanceVisible,
        selectedYear,
        selectedMonth,
        currentMonthKey,
        currentMonthTransactions,
        monthlyIncomes,
        monthlyExpenses,
        monthlyResult,
        currentTotalBalance,
        liquidCurrentBalance: currentTotalBalance,
        displayBalance,
        balanceMode,
        toggleBalanceMode,
        pendingExpenses,
        pendingIncomes,
        projectedFutureBalance,
        // Proposta Amanda: Mesada Livre Inteligente
        freeAllowance,
        updateFreeAllowanceLimit,
        deductFromFreeAllowance,
        resetFreeAllowanceCycle,
        // Proposta Amanda: Captura Invisível (Intercepção de Notificações Bancárias)
        pendingBankNotification,
        triggerBankNotification,
        acceptBankNotification,
        dismissBankNotification,
        // Proposta Amanda: IA de Comando de Voz Rápido (< 2 segundos)
        processVoiceCommand,
        // Proposta Amanda: Carteira Compartilhada para Casais (Arrastar para Dividir)
        sharedWallet,
        connectSharedWallet,
        disconnectSharedWallet,
        splitTransactionWithPartner,
        addSharedExpense,
        settleSharedDebts,
        sharedWalletSummary,
        // Crítica 11: Exportação Real de Dados (CSV / Excel)
        exportDataToCSV,
        // RF05: Metas / Cofrinho
        goals,
        totalGoalsSaved,
        addGoal,
        updateGoal,
        deleteGoal,
        depositToGoal,
        withdrawFromGoal,
        // RF03: Bloco de Anotações
        notes,
        addNote,
        updateNote,
        deleteNote,
        // RF08: Cotações AwesomeAPI
        exchangeRates,
        loadingRates,
        ratesMessage,
        refreshExchangeRates,
        // RF02: Converter Planejado em Realizado
        convertPlannedToReal,
        budgetSummary,
        categoryBudgetsStatus,
        budgetAlertCategory,
        categoryReport,
        barChartComparison,
        evolutionPoints,
        // Funções de Transação
        toggleBalanceVisibility,
        prevMonth,
        nextMonth,
        setMonthAndYear,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudgets,
        updateInitialBalance,
        resetAllData,
        // Categorias de Despesas Personalizadas (Criação, Edição e Exclusão)
        categoriesExpense,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryReportForTransactions,
        // Funções de Gastos Recorrentes
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        toggleRecurringExpense,
        syncRecurringForCurrentMonth,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
}
