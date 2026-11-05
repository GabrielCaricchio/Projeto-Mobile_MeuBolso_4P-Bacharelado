// src/navigation/AppNavigator.js
// Navegador raiz do aplicativo gerenciando estado de autenticação e navegação por pilhas

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import AuthScreen from '../screens/AuthScreen';
import TabNavigator from './TabNavigator';
import NewTransactionScreen from '../screens/NewTransactionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecurringExpensesScreen from '../screens/RecurringExpensesScreen';
import NotesScreen from '../screens/NotesScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SharedWalletScreen from '../screens/SharedWalletScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Fluxo de Autenticação (Login e Cadastro com persistência)
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        // Fluxo Principal Autenticado
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="NovaMovimentacao"
            component={NewTransactionScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="RecurringExpenses"
            component={RecurringExpensesScreen}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Notes"
            component={NotesScreen}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Goals"
            component={GoalsScreen}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="SharedWallet"
            component={SharedWalletScreen}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
