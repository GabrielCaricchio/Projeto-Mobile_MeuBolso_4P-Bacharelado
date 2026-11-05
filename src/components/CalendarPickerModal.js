// src/components/CalendarPickerModal.js
// Modal interativo de calendário para seleção rápida de dias específicos, meses e anos
// Suporta visualização de calendário do mês, troca rápida de ano/mês e opção de "Todos os meses"

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_ABBR_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarPickerModal({
  visible,
  onClose,
  selectedDate, // 'YYYY-MM-DD' ou null
  selectedYear, // number
  selectedMonth, // 0..11
  onSelectDate, // (dateStr: 'YYYY-MM-DD') => void
  onSelectMonthYear, // (year: number, month: number) => void
  showAllMonthsOption = false,
  onSelectAllMonths,
}) {
  const { theme } = useTheme();

  // Determina ano e mês inicial
  const initDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
  const initYear = selectedYear || initDate.getFullYear();
  const initMonth = selectedMonth !== undefined ? selectedMonth : initDate.getMonth();

  const [viewMode, setViewMode] = useState('days'); // 'days' | 'months' | 'years'
  const [currentYear, setCurrentYear] = useState(initYear);
  const [currentMonth, setCurrentMonth] = useState(initMonth);

  // Sincroniza quando abrir
  React.useEffect(() => {
    if (visible) {
      if (selectedYear) setCurrentYear(selectedYear);
      if (selectedMonth !== undefined) setCurrentMonth(selectedMonth);
      if (selectedDate) {
        const parts = selectedDate.split('-');
        if (parts.length === 3) {
          setCurrentYear(parseInt(parts[0], 10));
          setCurrentMonth(parseInt(parts[1], 10) - 1);
        }
      }
      setViewMode('days');
    }
  }, [visible, selectedYear, selectedMonth, selectedDate]);

  // Dias do mês
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Preenche dias do mês anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isPrev: true,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const fullDate = `${currentYear}-${mStr}-${dStr}`;
      days.push({
        day: d,
        isCurrentMonth: true,
        fullDate,
        isSelected: selectedDate === fullDate,
        isToday: isDateToday(currentYear, currentMonth, d),
      });
    }

    // Completa grid de 42 slots (6 semanas) se necessário
    const remaining = (7 - (days.length % 7)) % 7;
    for (let next = 1; next <= remaining; next++) {
      days.push({
        day: next,
        isCurrentMonth: false,
        isNext: true,
      });
    }

    return days;
  }, [currentYear, currentMonth, selectedDate]);

  function isDateToday(y, m, d) {
    const now = new Date();
    return now.getFullYear() === y && now.getMonth() === m && now.getDate() === d;
  }

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleSelectDay(item) {
    if (!item.isCurrentMonth) return;
    if (onSelectDate) {
      onSelectDate(item.fullDate);
    }
    if (onSelectMonthYear) {
      onSelectMonthYear(currentYear, currentMonth);
    }
    onClose();
  }

  function handleSelectMonth(mIdx) {
    setCurrentMonth(mIdx);
    setViewMode('days');
    if (onSelectMonthYear && !onSelectDate) {
      onSelectMonthYear(currentYear, mIdx);
      onClose();
    }
  }

  function handleSelectYear(yr) {
    setCurrentYear(yr);
    setViewMode('months');
  }

  function handleTodayQuickPick() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const iso = `${y}-${mStr}-${dStr}`;

    setCurrentYear(y);
    setCurrentMonth(m);
    if (onSelectDate) {
      onSelectDate(iso);
    }
    if (onSelectMonthYear) {
      onSelectMonthYear(y, m);
    }
    onClose();
  }

  // Lista de anos para escolha rápida
  const yearsList = useMemo(() => {
    const list = [];
    const base = new Date().getFullYear();
    for (let y = base - 3; y <= base + 3; y++) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Topo: Navegação rápida de Mês / Ano */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={[styles.arrowBtn, { backgroundColor: theme.surfaceAlt }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerSelectors}>
              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                style={[styles.headerPill, { backgroundColor: theme.surfaceAlt }]}
              >
                <Text style={[styles.headerPillText, { color: theme.textPrimary }]}>
                  {MONTH_NAMES_PT[currentMonth]}
                </Text>
                <Ionicons
                  name={viewMode === 'months' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={theme.primary}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                style={[styles.headerPill, { backgroundColor: theme.surfaceAlt }]}
              >
                <Text style={[styles.headerPillText, { color: theme.textPrimary }]}>
                  {currentYear}
                </Text>
                <Ionicons
                  name={viewMode === 'years' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={theme.primary}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={[styles.arrowBtn, { backgroundColor: theme.surfaceAlt }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* MODO 1: DIAS DO MÊS */}
          {viewMode === 'days' && (
            <View>
              {/* Dias da semana */}
              <View style={styles.weekHeader}>
                {WEEKDAYS_PT.map((w, idx) => (
                  <Text
                    key={w}
                    style={[
                      styles.weekHeaderText,
                      { color: idx === 0 || idx === 6 ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {w}
                  </Text>
                ))}
              </View>

              {/* Grid de dias */}
              <View style={styles.daysGrid}>
                {calendarDays.map((item, index) => {
                  if (!item.isCurrentMonth) {
                    return (
                      <View key={`empty-${index}`} style={styles.dayCell}>
                        <Text style={[styles.dayTextInactive, { color: theme.textMuted }]}>
                          {item.day}
                        </Text>
                      </View>
                    );
                  }

                  const isSelected = item.isSelected;
                  const isToday = item.isToday;

                  return (
                    <TouchableOpacity
                      key={item.fullDate}
                      style={[
                        styles.dayCell,
                        isSelected && [styles.dayCellSelected, { backgroundColor: theme.primary }],
                        isToday && !isSelected && [styles.dayCellToday, { borderColor: theme.primary }],
                      ]}
                      onPress={() => handleSelectDay(item)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: theme.textPrimary },
                          isSelected && styles.dayTextSelected,
                          isToday && !isSelected && { color: theme.primary, fontWeight: '700' },
                        ]}
                      >
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* MODO 2: ESCOLHA RÁPIDA DE MÊS */}
          {viewMode === 'months' && (
            <View style={styles.monthsGrid}>
              {MONTH_ABBR_PT.map((mName, idx) => {
                const isCurrent = idx === currentMonth;
                return (
                  <TouchableOpacity
                    key={mName}
                    style={[
                      styles.monthOption,
                      { backgroundColor: isCurrent ? theme.primary : theme.surfaceAlt },
                    ]}
                    onPress={() => handleSelectMonth(idx)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        { color: isCurrent ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {mName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* MODO 3: ESCOLHA RÁPIDA DE ANO */}
          {viewMode === 'years' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearsRow}>
              {yearsList.map((yr) => {
                const isCurrent = yr === currentYear;
                return (
                  <TouchableOpacity
                    key={yr}
                    style={[
                      styles.yearOption,
                      { backgroundColor: isCurrent ? theme.primary : theme.surfaceAlt },
                    ]}
                    onPress={() => handleSelectYear(yr)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        { color: isCurrent ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {yr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Botões de Ação Inferiores: 'Hoje', 'Todos os meses' (opcional) e 'Fechar' */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: theme.surfaceAlt }]}
              onPress={handleTodayQuickPick}
              activeOpacity={0.7}
            >
              <Ionicons name="today-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.quickActionText, { color: theme.primary }]}>
                Hoje
              </Text>
            </TouchableOpacity>

            {showAllMonthsOption && onSelectAllMonths && (
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.primaryLight }]}
                onPress={() => {
                  onSelectAllMonths();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.quickActionText, { color: theme.primary, fontWeight: '700' }]}>
                  Todos os meses
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.surfaceAlt }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSelectors: {
    flexDirection: 'row',
    gap: 8,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  headerPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingVertical: 4,
  },
  weekHeaderText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 6,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: {
    shadowColor: '#5B36EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextInactive: {
    fontSize: 13,
    opacity: 0.3,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  monthOption: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  yearsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  yearOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
