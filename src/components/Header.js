// src/components/Header.js
// Cabeçalho padronizado do Meu Bolso com logo, avatar e ações contextuais

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Header({
  rightAction,
  onRightPress,
  onAvatarPress,
  showAvatar = true,
  showLogo = true,
  title,
}) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const initials = user?.initials || 'MB';

  function handleAvatarTouch() {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      try {
        navigation.navigate('Profile');
      } catch (e) {
        console.warn('Navegação para Profile não encontrada:', e);
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* Lado Esquerdo: Logo e Nome Meu Bolso */}
      {showLogo && (
        <View style={styles.logoRow}>
          <View style={[styles.logoIconContainer, { backgroundColor: theme.primary }]}>
            <Ionicons name="wallet" size={18} color="#FFFFFF" />
          </View>
          <Text style={[styles.logoText, { color: theme.textPrimary }]}>Meu Bolso</Text>
        </View>
      )}

      {title && !showLogo && (
        <Text style={[styles.titleText, { color: theme.textPrimary }]}>{title}</Text>
      )}

      {/* Lado Direito: Avatar do Usuário ou Ação Contextual (X, Lupa, etc.) */}
      <View style={styles.rightContainer}>
        {rightAction === 'close' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.actionBtnBg }]}
            onPress={onRightPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        )}

        {rightAction === 'search' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.actionBtnBg }]}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        )}

        {rightAction === 'export' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.actionBtnBg }]}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        )}

        {rightAction === 'settings' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.actionBtnBg }]}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        )}

        {showAvatar && !rightAction && (
          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: theme.primaryLight }]}
            onPress={handleAvatarTouch}
            activeOpacity={0.8}
          >
            <Text style={[styles.avatarText, { color: theme.textPurple }]}>{initials}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: 'transparent',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
