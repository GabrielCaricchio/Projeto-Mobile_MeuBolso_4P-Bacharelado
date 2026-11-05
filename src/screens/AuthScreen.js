// src/screens/AuthScreen.js
// TELA 1 – LOGIN E CADASTRO: Reprodução visual e funcional com persistência, temas e internacionalização

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth, validatePasswordRules } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function AuthScreen() {
  const { login, register, resetPassword } = useAuth();
  const { theme, isDark, toggleTheme, typography, spacing, borderRadius } = useTheme();
  const { t } = useLanguage();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estado do Modal de Recuperação de Senha
  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  async function handleAuth() {
    setErrorMessage('');

    if (isRegisterMode) {
      if (!fullName.trim() || !email.trim() || !password) {
        setErrorMessage(t('auth.errorAllFields'));
        return;
      }
      const passValidation = validatePasswordRules(password);
      if (!passValidation.valid) {
        setErrorMessage(passValidation.message);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(t('auth.errorPasswordMismatch'));
        return;
      }
    } else {
      if (!email.trim() || !password) {
        setErrorMessage(t('auth.errorRequiredFields'));
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        const result = await register(fullName, email, password, confirmPassword);
        if (!result.success) {
          setErrorMessage(result.message);
        }
      } else {
        const result = await login(email, password);
        if (!result.success) {
          setErrorMessage(t('auth.errorInvalidCredentials'));
        }
      }
    } catch (e) {
      setErrorMessage(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordRecovery() {
    if (!recoveryEmail) {
      Alert.alert(t('common.attention'), t('auth.recoveryEmailPrompt'));
      return;
    }
    const res = await resetPassword(recoveryEmail, newPasswordInput);
    if (res.success) {
      setRecoveryMessage(t('auth.recoverySuccess'));
      setTimeout(() => {
        setRecoveryModalVisible(false);
        setRecoveryMessage('');
        setNewPasswordInput('');
      }, 2000);
    } else {
      Alert.alert(t('common.error'), res.message);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Barra Superior: Logo, Seletor de Idioma e Seletor de Tema */}
          <View style={styles.topBar}>
            <View style={styles.logoRow}>
              <View style={[styles.logoIconContainer, { backgroundColor: theme.primary }]}>
                <Ionicons name="wallet" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.logoText, { color: theme.textPrimary }]}>
                {t('auth.brand')}
              </Text>
            </View>

            {/* Ações rápidas de tema */}
            <View style={styles.topActionsRow}>
              <TouchableOpacity
                style={[styles.quickToggleBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isDark ? 'sunny-outline' : 'moon-outline'}
                  size={16}
                  color={theme.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Título e Subtítulo de Boas-vindas */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {isRegisterMode ? t('auth.createAccount') : t('auth.welcomeBack')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isRegisterMode
                ? t('auth.createAccountSubtitle')
                : t('auth.welcomeBackSubtitle')}
            </Text>
          </View>

          {/* Banner de Erro caso exista */}
          {errorMessage ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.expenseLight }]}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={theme.expense}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.errorText, { color: theme.expense }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Card do Formulário */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Campo Nome (Apenas Cadastro) */}
            {isRegisterMode && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('auth.fullName')}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderDark,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={theme.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder={t('auth.fullNamePlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Campo E-mail */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {t('auth.email')}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderDark,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Campo Senha */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {t('auth.password')}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderDark,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {isRegisterMode && (
                <Text style={[styles.passwordHint, { color: theme.textMuted }]}>
                  Mínimo de 6 caracteres contendo letras e números.
                </Text>
              )}
            </View>

            {/* Campo Confirmar Senha (Apenas Cadastro) */}
            {isRegisterMode && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('auth.confirmPassword')}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderDark,
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={theme.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Link Esqueceu sua senha? (Apenas Login) */}
            {!isRegisterMode && (
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={() => {
                  setRecoveryEmail(email);
                  setRecoveryModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.forgotPasswordText, { color: theme.textPurple }]}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Botão Principal Entrar / Cadastrar */}
            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: theme.primary }]}
              onPress={handleAuth}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.mainButtonText}>
                  {isRegisterMode ? t('auth.signUp') : t('auth.signIn')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Alternar entre Login e Cadastro */}
          <View style={styles.switchModeContainer}>
            <Text style={[styles.switchModeText, { color: theme.textSecondary }]}>
              {isRegisterMode
                ? `${t('auth.alreadyHaveAccount')} `
                : `${t('auth.dontHaveAccount')} `}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage('');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.switchModeLink, { color: theme.textPurple }]}>
                {isRegisterMode ? t('auth.signInLink') : t('auth.signUpLink')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mensagem de Segurança no rodapé */}
          <View style={styles.securityFooter}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={theme.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              {t('auth.securityFooter')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Didático de Recuperação de Senha */}
      <Modal
        visible={recoveryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRecoveryModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {t('auth.recoveryTitle')}
              </Text>
              <TouchableOpacity onPress={() => setRecoveryModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {t('auth.recoverySubtitle')}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.borderDark,
                  color: theme.textPrimary,
                },
              ]}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={theme.textMuted}
              value={recoveryEmail}
              onChangeText={setRecoveryEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.borderDark,
                  color: theme.textPrimary,
                },
              ]}
              placeholder={t('auth.newPassword')}
              placeholderTextColor={theme.textMuted}
              value={newPasswordInput}
              onChangeText={setNewPasswordInput}
              secureTextEntry
            />

            {recoveryMessage ? (
              <Text style={[styles.recoverySuccessText, { color: theme.incomeDark }]}>
                {recoveryMessage}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.recoveryButton, { backgroundColor: theme.primary }]}
              onPress={handlePasswordRecovery}
            >
              <Text style={styles.recoveryButtonText}>
                {t('auth.resetPasswordButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    width: 36,
    height: 36,
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
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  passwordHint: {
    fontSize: 11,
    marginTop: 5,
    marginLeft: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mainButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 20,
  },
  switchModeText: {
    fontSize: 14,
  },
  switchModeLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 12,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  recoverySuccessText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  recoveryButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  recoveryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
