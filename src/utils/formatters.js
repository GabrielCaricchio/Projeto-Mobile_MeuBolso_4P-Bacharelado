// src/utils/formatters.js
// Utilitários de formatação de valores monetários, datas e porcentagens com suporte bilíngue

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT_PT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

const MONTH_SHORT_EN = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

const WEEKDAY_NAMES_PT = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado'
];

const WEEKDAY_NAMES_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday'
];

/**
 * Formata um número para o padrão de moeda (BRL ou USD)
 */
export function formatCurrency(value, lang = 'pt') {
  const num = Number(value) || 0;
  if (lang === 'en') {
    return '$ ' + num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return 'R$ ' + num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Alias compatível para formatCurrency
 */
export const formatMoney = formatCurrency;

/**
 * Formata moeda com sinal explícito: + R$ 500,00 ou − R$ 620,00
 */
export function formatSignedCurrency(value, type, lang = 'pt') {
  const formatted = formatCurrency(Math.abs(value), lang);
  if (type === 'receita') {
    return `+ ${formatted}`;
  }
  return `− ${formatted}`;
}

/**
 * Converte '2026-10-31' para '31 out · sábado' ou 'Oct 31 · Saturday'
 */
export function formatDateGroup(dateStr, lang = 'pt') {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  const dayStr = day < 10 ? `0${day}` : `${day}`;

  if (lang === 'en') {
    const monthStr = MONTH_SHORT_EN[month] || '';
    const weekDayStr = WEEKDAY_NAMES_EN[d.getDay()] || '';
    return `${monthStr} ${dayStr} · ${weekDayStr}`;
  }

  const monthStr = MONTH_SHORT_PT[month] || '';
  const weekDayStr = WEEKDAY_NAMES_PT[d.getDay()] || '';
  return `${dayStr} ${monthStr} · ${weekDayStr}`;
}

/**
 * Converte '2026-10-31' para '31 de outubro de 2026' ou 'October 31, 2026'
 */
export function formatDateDisplay(dateStr, lang = 'pt') {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (lang === 'en') {
    const monthName = MONTH_NAMES_EN[month] || '';
    return `${monthName} ${day}, ${year}`;
  }

  const monthName = MONTH_NAMES_PT[month]?.toLowerCase() || '';
  return `${day} de ${monthName} de ${year}`;
}

/**
 * Converte { year: 2026, month: 9 } para 'Outubro 2026' ou 'October 2026'
 */
export function formatMonthYear(year, monthIndex, lang = 'pt') {
  const names = lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_PT;
  return `${names[monthIndex]} ${year}`;
}

/**
 * Converte '2026-10-31' para '31 out' ou '31 Oct'
 */
export function formatDateShort(dateStr, lang = 'pt') {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10) - 1;
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const monthList = lang === 'en' ? MONTH_SHORT_EN : MONTH_SHORT_PT;
  return `${dayStr} ${monthList[month]}`;
}

/**
 * Formata porcentagem com vírgula ou ponto
 */
export function formatPercentage(value, decimals = 1, lang = 'pt') {
  const num = Number(value) || 0;
  if (Number.isInteger(num) || decimals === 0) {
    return `${Math.round(num)}%`;
  }
  const str = num.toFixed(decimals);
  return lang === 'en' ? `${str}%` : `${str.replace('.', ',')}%`;
}

/**
 * Converte string de entrada de valor para float numérico
 */
export function parseCurrencyInput(text) {
  if (typeof text === 'number') return text;
  if (!text) return 0;
  const clean = text.replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
