// src/utils/constants.js
// Configurações, categorias financeiras e valores iniciais padrão limpos

export const CATEGORIES_EXPENSE = [
  { id: 'moradia', name: 'Moradia', icon: 'home-outline', iconType: 'Ionicons', color: '#5B36EC' },
  { id: 'alimentacao', name: 'Alimentação', icon: 'restaurant-outline', iconType: 'Ionicons', color: '#8B5CF6' },
  { id: 'transporte', name: 'Transporte', icon: 'bus-outline', iconType: 'Ionicons', color: '#A78BFA' },
  { id: 'lazer', name: 'Lazer', icon: 'film-outline', iconType: 'Ionicons', color: '#C4B5FD' },
  { id: 'outros', name: 'Outros', icon: 'receipt-outline', iconType: 'Ionicons', color: '#DDD6FE' },
  { id: 'saude', name: 'Saúde', icon: 'medkit-outline', iconType: 'Ionicons', color: '#F59E0B' },
  { id: 'educacao', name: 'Educação', icon: 'school-outline', iconType: 'Ionicons', color: '#3B82F6' },
];

export const CATEGORIES_INCOME = [
  { id: 'salario', name: 'Salário', icon: 'wallet-outline', iconType: 'Ionicons', color: '#10B981' },
  { id: 'renda_extra', name: 'Renda extra', icon: 'briefcase-outline', iconType: 'Ionicons', color: '#06B6D4' },
  { id: 'investimentos', name: 'Investimentos', icon: 'trending-up-outline', iconType: 'Ionicons', color: '#8B5CF6' },
  { id: 'outros_receita', name: 'Outros', icon: 'add-circle-outline', iconType: 'Ionicons', color: '#10B981' },
];

export const DEFAULT_BUDGETS = {
  totalPlanned: 4800,
  categories: {
    moradia: 2000,
    alimentacao: 1000,
    transporte: 600,
    lazer: 500,
    outros: 700,
  },
};

// Histórico limpo sem inserções prévias
export const HISTORICAL_MONTHS = [];

// Gastos recorrentes limpos sem inserções prévias
export const DEFAULT_RECURRING_EXPENSES = [];

// Transações iniciais limpas sem inserções prévias
export const INITIAL_TRANSACTIONS = [];

// Saldo inicial zerado
export const INITIAL_INITIAL_BALANCE = 0.0;
