// src/components/MonthSelector.js
// Seletor de mês e ano com setas de navegação, modal de calendário integrado e suporte a "Todos os meses"

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatMonthYear } from '../utils/formatters';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import CalendarPickerModal from './CalendarPickerModal';

export default function MonthSelector({
  onCalendarPress,
  isAllMonths = false,
  showAllMonthsOption = false,
  onSelectAllMonths,
}) {
  const { selectedYear, selectedMonth, prevMonth, nextMonth, setMonthAndYear } = useFinance();
  const { theme } = useTheme();

  const [calendarVisible, setCalendarVisible] = useState(false);

  const label = isAllMonths
    ? 'Todos os meses'
    : formatMonthYear(selectedYear, selectedMonth, 'pt');

  function handlePillPress() {
    if (onCalendarPress) {
      onCalendarPress();
    } else {
      setCalendarVisible(true);
    }
  }

  function handleMonthYearPicked(year, month) {
    setMonthAndYear(year, month);
  }

  return (
    <View style={styles.container}>
      {/* Seta para mês anterior */}
      {!isAllMonths && (
        <TouchableOpacity
          style={[styles.arrowButton, { backgroundColor: theme.surfaceAlt }]}
          onPress={prevMonth}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
      )}

      {/* Pill central com ícone de calendário e Mês/Ano */}
      <TouchableOpacity
        style={[
          styles.centerPill,
          {
            backgroundColor: theme.surface,
            borderColor: isAllMonths ? theme.primary : theme.borderDark,
          },
        ]}
        onPress={handlePillPress}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isAllMonths ? 'calendar' : 'calendar-outline'}
          size={17}
          color={theme.primary}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.labelText,
            { color: isAllMonths ? theme.primary : theme.textPrimary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>

      {/* Seta para próximo mês */}
      {!isAllMonths && (
        <TouchableOpacity
          style={[styles.arrowButton, { backgroundColor: theme.surfaceAlt }]}
          onPress={nextMonth}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
      )}

      {/* Modal integrado de Calendário */}
      <CalendarPickerModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSelectMonthYear={handleMonthYearPicked}
        showAllMonthsOption={showAllMonthsOption}
        onSelectAllMonths={onSelectAllMonths}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
