// src/contexts/ThemeContext.js
// Provedor de tema com suporte a Modo Claro, Modo Escuro e Sistema, com persistência local

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, typography, spacing, borderRadius, shadows } from '../styles/theme';

const THEME_STORAGE_KEY = '@meubolso_theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme(); // 'light' ou 'dark'
  const [themeMode, setThemeModeState] = useState('system'); // 'light' | 'dark' | 'system'
  const [loading, setLoading] = useState(true);

  async function loadSavedTheme() {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemeModeState(savedTheme);
      }
    } catch (e) {
      console.error('Erro ao carregar tema salvo:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSavedTheme();
  }, []);

  async function setThemeMode(mode) {
    if (mode !== 'light' && mode !== 'dark' && mode !== 'system') return;
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.error('Erro ao salvar tema:', e);
    }
  }

  // Define se o tema ativo é escuro
  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // Objeto de cores correspondente ao modo ativo
  const theme = isDark ? darkColors : lightColors;

  function toggleTheme() {
    if (isDark) {
      setThemeMode('light');
    } else {
      setThemeMode('dark');
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: theme, // atalho de conveniência
        isDark,
        themeMode,
        setThemeMode,
        toggleTheme,
        typography,
        spacing,
        borderRadius,
        shadows,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}

