// src/services/storageService.js
// Camada de persistência em armazenamento local usando AsyncStorage com suporte total a separação de contas

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_BUDGETS,
  INITIAL_INITIAL_BALANCE,
  CATEGORIES_EXPENSE,
} from '../utils/constants.js';

const KEYS = {
  USERS: '@meubolso_users',
  CURRENT_USER: '@meubolso_current_user',
  TRANSACTIONS: '@meubolso_transacoes',
  TRANSACTIONS_LEGACY: '@meubolso_transactions',
  NOTES: '@meubolso_anotacoes',
  GOALS: '@meubolso_metas',
  BUDGETS: '@meubolso_budgets',
  INITIAL_BALANCE: '@meubolso_initial_balance',
  INITIALIZED: '@meubolso_clean_init_v7',
  THEME: '@meubolso_theme',
  LANGUAGE: '@meubolso_language',
  RECURRING_EXPENSES: '@meubolso_recurring_expenses',
  EXCHANGE_CACHE: '@meubolso_cotacoes_cache',
  CATEGORIES_EXPENSE: '@meubolso_categorias_despesa',
  FREE_ALLOWANCE: '@meubolso_mesada_livre',
  SHARED_WALLET: '@meubolso_carteira_compartilhada',
};

export const storageService = {
  /**
   * Constrói uma chave isolada para cada usuário
   * Garante a separação estrita de contas: cada conta tem suas próprias transações, notas, metas e orçamentos
   */
  getUserKey(baseKey, userId) {
    if (!userId) return baseKey;
    return `${baseKey}_${userId}`;
  },

  /**
   * Obtém o ID do usuário efetivo caso não tenha sido explicitamente fornecido
   */
  async getEffectiveUserId(userId) {
    if (userId) return userId;
    const currentUser = await this.getCurrentUser();
    return currentUser?.id || null;
  },

  /**
   * Inicializa a base de dados de forma totalmente limpa
   * Remove resquícios de dados globais de teste sem comprometer usuários já cadastrados
   */
  async initializeDefaults() {
    try {
      const alreadyClean = await AsyncStorage.getItem(KEYS.INITIALIZED);
      if (!alreadyClean) {
        // Limpa resquícios globais e garante que não haja sessão fictícia ativa
        await AsyncStorage.removeItem(KEYS.CURRENT_USER);
        await AsyncStorage.removeItem(KEYS.TRANSACTIONS);
        await AsyncStorage.removeItem(KEYS.TRANSACTIONS_LEGACY);
        await AsyncStorage.removeItem(KEYS.NOTES);
        await AsyncStorage.removeItem(KEYS.GOALS);
        await AsyncStorage.removeItem(KEYS.RECURRING_EXPENSES);
        await AsyncStorage.setItem(KEYS.INITIALIZED, 'true');
      }
    } catch (error) {
      console.error('Erro ao inicializar base limpa:', error);
    }
  },

  /**
   * Inicializa o armazenamento de um novo usuário cadastrado totalmente VAZIO
   * Não insere nenhum dado de teste, nenhuma transação automática ou dados de outra conta
   */
  async initializeUserStorage(userId) {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(this.getUserKey(KEYS.TRANSACTIONS, userId), JSON.stringify([]));
      await AsyncStorage.setItem(this.getUserKey(KEYS.NOTES, userId), JSON.stringify([]));
      await AsyncStorage.setItem(this.getUserKey(KEYS.GOALS, userId), JSON.stringify([]));
      await AsyncStorage.setItem(this.getUserKey(KEYS.RECURRING_EXPENSES, userId), JSON.stringify([]));
      await AsyncStorage.setItem(this.getUserKey(KEYS.BUDGETS, userId), JSON.stringify(DEFAULT_BUDGETS));
      await AsyncStorage.setItem(this.getUserKey(KEYS.INITIAL_BALANCE, userId), JSON.stringify(INITIAL_INITIAL_BALANCE));
      await AsyncStorage.setItem(this.getUserKey(KEYS.CATEGORIES_EXPENSE, userId), JSON.stringify(CATEGORIES_EXPENSE));
      await AsyncStorage.setItem(this.getUserKey(KEYS.FREE_ALLOWANCE, userId), JSON.stringify({ limit: 500, spent: 0, alertTriggered: false, silentMode: false }));
      await AsyncStorage.setItem(this.getUserKey(KEYS.SHARED_WALLET, userId), JSON.stringify({ isConnected: false, partnerName: '', pairCode: '', splitRatio: 50, expenses: [] }));
    } catch (e) {
      console.error('Erro ao inicializar armazenamento limpo do usuário:', e);
    }
  },

  // --- Usuários e Sessão ---
  async getUsers() {
    try {
      const data = await AsyncStorage.getItem(KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveUsers(users) {
    try {
      await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Erro ao salvar usuários:', e);
    }
  },

  async getCurrentUser() {
    try {
      const data = await AsyncStorage.getItem(KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async setCurrentUser(user) {
    try {
      if (user) {
        await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Erro ao salvar sessão:', e);
    }
  },

  async updateUser(updatedUser) {
    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(
        (u) => u.email.toLowerCase() === updatedUser.email.toLowerCase() || u.id === updatedUser.id
      );

      let newUsers;
      if (userIndex !== -1) {
        newUsers = [...users];
        newUsers[userIndex] = { ...newUsers[userIndex], ...updatedUser };
      } else {
        newUsers = [...users, updatedUser];
      }

      await this.saveUsers(newUsers);
      await this.setCurrentUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, message: 'Erro ao persistir alterações.' };
    }
  },

  // --- Transações / Movimentações (Tabela 1: @meubolso_transacoes) Isoladas por Conta ---
  async getTransactions(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.TRANSACTIONS, effId);
      const data = await AsyncStorage.getItem(key);

      // Se a conta for nova e ainda não tiver transações registradas, retorna vazio imediato
      if (!data) {
        return [];
      }

      const list = JSON.parse(data);
      // Garante a presença dos atributos definidos na Tabela 1 da Engenharia de Requisitos
      return list.map((tx) => ({
        ...tx,
        id: tx.id || `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        descricao: tx.descricao || tx.description || 'Sem descrição',
        description: tx.description || tx.descricao || 'Sem descrição',
        valor: Number(tx.valor !== undefined ? tx.valor : tx.amount || 0),
        amount: Number(tx.amount !== undefined ? tx.amount : tx.valor || 0),
        tipo: tx.tipo || (tx.type === 'receita' ? 'entrada' : 'despesa'),
        type: tx.type || (tx.tipo === 'entrada' ? 'receita' : 'despesa'),
        categoria: tx.categoria || tx.category || 'Outros',
        category: tx.category || tx.categoria || 'Outros',
        status: tx.status || 'realizado', // 'realizado' ou 'pretendido' (RF02)
        dataVencimento: tx.dataVencimento || tx.date || new Date().toISOString().split('T')[0],
        date: tx.date || tx.dataVencimento || new Date().toISOString().split('T')[0],
      }));
    } catch (e) {
      return [];
    }
  },

  async saveTransactions(transactions, userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.TRANSACTIONS, effId);
      const normalized = (transactions || []).map((tx) => ({
        ...tx,
        descricao: tx.descricao || tx.description,
        description: tx.description || tx.descricao,
        valor: Number(tx.valor !== undefined ? tx.valor : tx.amount || 0),
        amount: Number(tx.amount !== undefined ? tx.amount : tx.valor || 0),
        tipo: tx.tipo || (tx.type === 'receita' ? 'entrada' : 'despesa'),
        type: tx.type || (tx.tipo === 'entrada' ? 'receita' : 'despesa'),
        categoria: tx.categoria || tx.category,
        category: tx.category || tx.categoria,
        status: tx.status || 'realizado',
        dataVencimento: tx.dataVencimento || tx.date,
        date: tx.date || tx.dataVencimento,
      }));
      const json = JSON.stringify(normalized);
      await AsyncStorage.setItem(key, json);
    } catch (e) {
      console.error('Erro ao salvar transações:', e);
      throw e;
    }
  },

  // --- Bloco de Anotações Financeiras (Tabela 2: @meubolso_anotacoes / RF03) Isolado por Conta ---
  async getNotes(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.NOTES, effId);
      const data = await AsyncStorage.getItem(key);
      if (!data) return [];

      const list = JSON.parse(data);
      return list.map((n) => ({
        ...n,
        id: n.id || `nota-${Date.now()}`,
        titulo: n.titulo || n.title || 'Sem título',
        title: n.title || n.titulo || 'Sem título',
        conteudo: n.conteudo || n.content || '',
        content: n.content || n.conteudo || '',
        tag: n.tag || 'geral',
        dataCriacao: n.dataCriacao || n.createdAt || new Date().toISOString(),
        createdAt: n.createdAt || n.dataCriacao || new Date().toISOString(),
      }));
    } catch (e) {
      return [];
    }
  },

  async saveNotes(notes, userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.NOTES, effId);
      const normalized = (notes || []).map((n) => ({
        ...n,
        id: n.id || `nota-${Date.now()}`,
        titulo: n.titulo || n.title || 'Sem título',
        title: n.title || n.titulo || 'Sem título',
        conteudo: n.conteudo || n.content || '',
        content: n.content || n.conteudo || '',
        tag: n.tag || 'geral',
        dataCriacao: n.dataCriacao || n.createdAt || new Date().toISOString(),
      }));
      await AsyncStorage.setItem(key, JSON.stringify(normalized));
    } catch (e) {
      console.error('Erro ao salvar anotações:', e);
    }
  },

  // --- Metas Financeiras / "Cofrinho" (RF05: @meubolso_metas) Isoladas por Conta ---
  async getGoals(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.GOALS, effId);
      const data = await AsyncStorage.getItem(key);
      if (!data) return [];

      const list = JSON.parse(data);
      return list.map((g) => ({
        ...g,
        id: g.id || `meta-${Date.now()}`,
        titulo: g.titulo || g.title || 'Novo Objetivo',
        title: g.title || g.titulo || 'Novo Objetivo',
        valorAlvo: Number(g.valorAlvo !== undefined ? g.valorAlvo : g.targetAmount || 0),
        targetAmount: Number(g.targetAmount !== undefined ? g.targetAmount : g.valorAlvo || 0),
        valorAtual: Number(g.valorAtual !== undefined ? g.valorAtual : g.currentAmount || 0),
        currentAmount: Number(g.currentAmount !== undefined ? g.currentAmount : g.valorAtual || 0),
        prazo: g.prazo || g.dataLimite || '',
        dataLimite: g.dataLimite || g.prazo || '',
      }));
    } catch (e) {
      return [];
    }
  },

  async saveGoals(goals, userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.GOALS, effId);
      const normalized = (goals || []).map((g) => ({
        ...g,
        id: g.id || `meta-${Date.now()}`,
        titulo: g.titulo || g.title || 'Novo Objetivo',
        title: g.title || g.titulo || 'Novo Objetivo',
        valorAlvo: Number(g.valorAlvo !== undefined ? g.valorAlvo : g.targetAmount || 0),
        targetAmount: Number(g.targetAmount !== undefined ? g.targetAmount : g.valorAlvo || 0),
        valorAtual: Number(g.valorAtual !== undefined ? g.valorAtual : g.currentAmount || 0),
        currentAmount: Number(g.currentAmount !== undefined ? g.currentAmount : g.valorAtual || 0),
        prazo: g.prazo || g.dataLimite || '',
        dataLimite: g.dataLimite || g.prazo || '',
      }));
      await AsyncStorage.setItem(key, JSON.stringify(normalized));
    } catch (e) {
      console.error('Erro ao salvar metas:', e);
    }
  },

  // --- Gastos Recorrentes Mensais Isolados por Conta ---
  async getRecurringExpenses(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.RECURRING_EXPENSES, effId);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveRecurringExpenses(recurringExpenses, userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.RECURRING_EXPENSES, effId);
      await AsyncStorage.setItem(key, JSON.stringify(recurringExpenses || []));
    } catch (e) {
      console.error('Erro ao salvar gastos recorrentes:', e);
    }
  },

  // --- Orçamentos Isolados por Conta ---
  async getBudgets(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.BUDGETS, effId);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : DEFAULT_BUDGETS;
    } catch (e) {
      return DEFAULT_BUDGETS;
    }
  },

  async saveBudgets(budgets, userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.BUDGETS, effId);
      await AsyncStorage.setItem(key, JSON.stringify(budgets || DEFAULT_BUDGETS));
    } catch (e) {
      console.error('Erro ao salvar orçamentos:', e);
    }
  },

  // --- Saldo Inicial Isolado por Conta ---
  async getInitialBalance(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.INITIAL_BALANCE, effId);
      const data = await AsyncStorage.getItem(key);
      return data !== null ? JSON.parse(data) : INITIAL_INITIAL_BALANCE;
    } catch (e) {
      return INITIAL_INITIAL_BALANCE;
    }
  },

  async saveInitialBalance(amount, userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.INITIAL_BALANCE, effId);
      await AsyncStorage.setItem(key, JSON.stringify(amount));
    } catch (e) {
      console.error('Erro ao salvar saldo inicial:', e);
    }
  },

  // --- Categorias de Despesas Personalizadas (Criação e Edição) Isoladas por Conta ---
  async getCategories(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.CATEGORIES_EXPENSE, effId);
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return CATEGORIES_EXPENSE;
    } catch (e) {
      return CATEGORIES_EXPENSE;
    }
  },

  async saveCategories(categories, userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.CATEGORIES_EXPENSE, effId);
      await AsyncStorage.setItem(key, JSON.stringify(categories || CATEGORIES_EXPENSE));
    } catch (e) {
      console.error('Erro ao salvar categorias:', e);
    }
  },

  // --- Mesada Livre Inteligente (Passo 1 e 2 da Proposta) ---
  async getFreeAllowance(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.FREE_ALLOWANCE, effId);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : { limit: 500, spent: 0, alertTriggered: false, silentMode: false };
    } catch (e) {
      return { limit: 500, spent: 0, alertTriggered: false, silentMode: false };
    }
  },

  async saveFreeAllowance(allowance, userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.FREE_ALLOWANCE, effId);
      await AsyncStorage.setItem(key, JSON.stringify(allowance));
    } catch (e) {
      console.error('Erro ao salvar mesada livre:', e);
    }
  },

  // --- Carteira Compartilhada para Casais (Passo 4 da Proposta) ---
  async getSharedWallet(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.SHARED_WALLET, effId);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : { isConnected: false, partnerName: '', pairCode: '', splitRatio: 50, expenses: [] };
    } catch (e) {
      return { isConnected: false, partnerName: '', pairCode: '', splitRatio: 50, expenses: [] };
    }
  },

  async saveSharedWallet(wallet, userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      const key = this.getUserKey(KEYS.SHARED_WALLET, effId);
      await AsyncStorage.setItem(key, JSON.stringify(wallet));
    } catch (e) {
      console.error('Erro ao salvar carteira compartilhada:', e);
    }
  },

  // --- Reseta apenas os dados financeiros da conta ativa sem apagar outros usuários ---
  async resetUserData(userId) {
    try {
      const effId = await this.getEffectiveUserId(userId);
      if (effId) {
        await AsyncStorage.setItem(this.getUserKey(KEYS.TRANSACTIONS, effId), JSON.stringify([]));
        await AsyncStorage.setItem(this.getUserKey(KEYS.NOTES, effId), JSON.stringify([]));
        await AsyncStorage.setItem(this.getUserKey(KEYS.GOALS, effId), JSON.stringify([]));
        await AsyncStorage.setItem(this.getUserKey(KEYS.RECURRING_EXPENSES, effId), JSON.stringify([]));
        await AsyncStorage.setItem(this.getUserKey(KEYS.BUDGETS, effId), JSON.stringify(DEFAULT_BUDGETS));
        await AsyncStorage.setItem(this.getUserKey(KEYS.INITIAL_BALANCE, effId), JSON.stringify(INITIAL_INITIAL_BALANCE));
        await AsyncStorage.setItem(this.getUserKey(KEYS.CATEGORIES_EXPENSE, effId), JSON.stringify(CATEGORIES_EXPENSE));
        await AsyncStorage.setItem(this.getUserKey(KEYS.FREE_ALLOWANCE, effId), JSON.stringify({ limit: 500, spent: 0, alertTriggered: false, silentMode: false }));
        await AsyncStorage.setItem(this.getUserKey(KEYS.SHARED_WALLET, effId), JSON.stringify({ isConnected: false, partnerName: '', pairCode: '', splitRatio: 50, expenses: [] }));
      }
      return true;
    } catch (e) {
      console.error('Erro ao resetar dados do usuário:', e);
      return false;
    }
  },

  // Alias para manter compatibilidade
  async resetAllData(userId) {
    return this.resetUserData(userId);
  },

  async resetToDemoData() {
    return this.resetAllData();
  },
};
