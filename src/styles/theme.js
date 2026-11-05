// src/styles/theme.js
// Identidade visual e design tokens do Meu Bolso com suporte a Modo Claro e Escuro

export const lightColors = {
  mode: 'light',
  // Cor primária roxa e variações
  primary: '#5B36EC',
  primaryDark: '#4A28D4',
  primaryLight: '#EDE9FE',
  primarySoft: '#F4F2FF',
  primaryGradientStart: '#6840F5',
  primaryGradientEnd: '#4E2CD9',

  // Cores de feedback financeiro
  income: '#10B981',
  incomeLight: '#ECFDF5',
  incomeDark: '#059669',
  expense: '#F43F5E',
  expenseLight: '#FFF1F2',
  expenseDark: '#E11D48',

  // Paleta de categorias
  categories: {
    moradia: '#5B36EC',
    alimentacao: '#8B5CF6',
    transporte: '#A78BFA',
    lazer: '#C4B5FD',
    outros: '#DDD6FE',
    salario: '#10B981',
    rendaExtra: '#06B6D4',
    saude: '#F59E0B',
    educacao: '#3B82F6',
  },

  // Gráfico de barras
  chartIncome: '#16A34A',
  chartExpense: '#FB7185',

  // Tons neutros
  background: '#F8F9FD',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  border: '#F1F3F7',
  borderDark: '#E5E7EB',

  // Tipografia
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  textPurple: '#5B36EC',

  // Avisos e alertas
  warningBg: '#F5F3FF',
  warningBorder: '#DDD6FE',
  warningText: '#5B36EC',
  danger: '#EF4444',

  // Elementos de UI
  cardBg: '#FFFFFF',
  inputBg: '#F9FAFB',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  actionBtnBg: '#F3F4F6',
};

export const darkColors = {
  mode: 'dark',
  // Cor primária roxa vibrante para alto contraste no escuro
  primary: '#6D4AFF',
  primaryDark: '#5635DB',
  primaryLight: '#2A1F5E',
  primarySoft: '#1D173D',
  primaryGradientStart: '#7C52FF',
  primaryGradientEnd: '#5B36EC',

  // Cores de feedback financeiro ajustadas para modo escuro
  income: '#10B981',
  incomeLight: '#064E3B',
  incomeDark: '#34D399',
  expense: '#FB7185',
  expenseLight: '#4C0519',
  expenseDark: '#FDA4AF',

  // Paleta de categorias para dark mode
  categories: {
    moradia: '#818CF8',
    alimentacao: '#A78BFA',
    transporte: '#C084FC',
    lazer: '#E879F9',
    outros: '#A5B4FC',
    salario: '#34D399',
    rendaExtra: '#22D3EE',
    saude: '#FBBF24',
    educacao: '#60A5FA',
  },

  // Gráfico de barras
  chartIncome: '#22C55E',
  chartExpense: '#FB7185',

  // Tons neutros escuros sofisticados
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceAlt: '#232736',
  border: '#282C3D',
  borderDark: '#363C52',

  // Tipografia de alto contraste
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  textPurple: '#818CF8',

  // Avisos e alertas
  warningBg: '#211B3D',
  warningBorder: '#3C2E7A',
  warningText: '#A5B4FC',
  danger: '#F87171',

  // Elementos de UI
  cardBg: '#1A1D27',
  inputBg: '#232736',
  tabBarBg: '#151722',
  tabBarBorder: '#282C3D',
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  actionBtnBg: '#282C3D',
};

// Export padrão retrocompatível para light mode
export const colors = lightColors;

export const typography = {
  fontFamily: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 32,
    huge: 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  purpleCard: {
    shadowColor: '#5B36EC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingButton: {
    shadowColor: '#5B36EC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
};

export default {
  colors,
  lightColors,
  darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
