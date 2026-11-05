// src/navigation/TabNavigator.js
// Barra de navegação inferior com 5 abas, segura contra barras do sistema (voltar/casa/recentes)

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();

// Botão personalizado para a aba central "+"
function CustomAddTabBarButton({ onPress, primaryColor, textColor, label }) {
  return (
    <TouchableOpacity
      style={styles.addButtonContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.addButtonInner, { backgroundColor: primaryColor }]}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </View>
      <Text style={[styles.addLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Componente placeholder para a rota do botão central
function EmptyAddScreen() {
  return null;
}

export default function TabNavigator({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // Altura dinâmica e recuo inferior seguro contra a barra de navegação do celular (voltar/casa/ambas abertas)
  const safeBottom = Math.max(8, insets.bottom);
  const totalTabBarHeight = 60 + safeBottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.tabBarBg,
            borderTopColor: theme.tabBarBorder,
            height: totalTabBarHeight,
            paddingBottom: safeBottom,
          },
        ],
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* 1. Início */}
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Movimentos */}
      <Tab.Screen
        name="Movimentos"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Movimentos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'swap-vertical' : 'swap-vertical-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* 3. Adicionar (+) */}
      <Tab.Screen
        name="Adicionar"
        component={EmptyAddScreen}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('NovaMovimentacao');
          },
        }}
        options={{
          tabBarButton: (props) => (
            <CustomAddTabBarButton
              {...props}
              primaryColor={theme.primary}
              textColor={theme.textSecondary}
              label="Adicionar"
            />
          ),
        }}
      />

      {/* 4. Orçamento */}
      <Tab.Screen
        name="Orcamento"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Orçamento',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'pie-chart' : 'pie-chart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* 5. Relatórios */}
      <Tab.Screen
        name="Relatorios"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Relatórios',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 6,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  addButtonContainer: {
    top: -6,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  addButtonInner: {
    width: 44,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B36EC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  addLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
