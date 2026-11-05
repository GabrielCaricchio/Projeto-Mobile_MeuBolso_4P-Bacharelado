// src/components/FilterTabs.js
// Abas de filtro para Todas, Receitas e Despesas com suporte a temas e idioma

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function FilterTabs({
  activeFilter,
  onSelectFilter,
}) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {/* Todas */}
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeFilter === 'todas'
              ? [styles.tabPillActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
              : [styles.tabPillInactive, { backgroundColor: theme.surface, borderColor: theme.borderDark }],
          ]}
          onPress={() => onSelectFilter('todas')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeFilter === 'todas'
                ? styles.tabTextActive
                : [styles.tabTextInactive, { color: theme.textPrimary }],
            ]}
          >
            {t('common.all')}
          </Text>
        </TouchableOpacity>

        {/* Receitas */}
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeFilter === 'receitas'
              ? [styles.tabPillActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
              : [styles.tabPillInactive, { backgroundColor: theme.surface, borderColor: theme.borderDark }],
          ]}
          onPress={() => onSelectFilter('receitas')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-down-outline"
            size={14}
            color={activeFilter === 'receitas' ? '#FFFFFF' : theme.income}
            style={{ transform: [{ rotate: '45deg' }], marginRight: 4 }}
          />
          <Text
            style={[
              styles.tabText,
              activeFilter === 'receitas'
                ? styles.tabTextActive
                : [styles.tabTextInactive, { color: theme.textPrimary }],
            ]}
          >
            {t('common.incomes')}
          </Text>
        </TouchableOpacity>

        {/* Despesas */}
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeFilter === 'despesas'
              ? [styles.tabPillActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
              : [styles.tabPillInactive, { backgroundColor: theme.surface, borderColor: theme.borderDark }],
          ]}
          onPress={() => onSelectFilter('despesas')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-up-outline"
            size={14}
            color={activeFilter === 'despesas' ? '#FFFFFF' : theme.expense}
            style={{ transform: [{ rotate: '45deg' }], marginRight: 4 }}
          />
          <Text
            style={[
              styles.tabText,
              activeFilter === 'despesas'
                ? styles.tabTextActive
                : [styles.tabTextInactive, { color: theme.textPrimary }],
            ]}
          >
            {t('common.expenses')}
          </Text>
        </TouchableOpacity>

        {/* Planejadas / Futuras (RF02) */}
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeFilter === 'planejadas'
              ? [styles.tabPillActive, { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]
              : [styles.tabPillInactive, { backgroundColor: theme.surface, borderColor: theme.borderDark }],
          ]}
          onPress={() => onSelectFilter('planejadas')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={activeFilter === 'planejadas' ? '#FFFFFF' : '#D97706'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.tabText,
              activeFilter === 'planejadas'
                ? styles.tabTextActive
                : [styles.tabTextInactive, { color: theme.textPrimary }],
            ]}
          >
            {language === 'en' ? 'Planned' : 'Planejadas'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillActive: {},
  tabPillInactive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabTextInactive: {},
});
