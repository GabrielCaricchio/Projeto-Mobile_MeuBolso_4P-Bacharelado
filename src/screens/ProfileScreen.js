// src/screens/ProfileScreen.js
// TELA DE PERFIL DO USUÁRIO: Gerenciamento de credenciais, temas (claro/escuro), idioma (inglês/português), gastos recorrentes e dados

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth, validatePasswordRules } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFinance } from '../contexts/FinanceContext';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateProfile, logout } = useAuth();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { t, formatMoney } = useLanguage();
  const {
    transactions,
    monthlyResult,
    resetAllData,
    recurringExpenses,
    goals,
    notes,
    totalGoalsSaved,
  } = useFinance();

  // Estados do Modal de Edição de Dados Pessoais
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Abre o modal de edição preenchendo os dados atuais
  function handleOpenEdit() {
    setEditName(user?.fullName || '');
    setEditEmail(user?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPasswordFields(false);
    setProfileError('');
    setEditModalVisible(true);
  }

  // Salva alterações de perfil
  async function handleSaveProfile() {
    setProfileError('');

    if (!editName.trim()) {
      setProfileError(t('auth.errorAllFields'));
      return;
    }

    if (showPasswordFields && newPassword) {
      if (!currentPassword) {
        setProfileError(t('auth.errorRequiredFields'));
        return;
      }
      if (newPassword === currentPassword) {
        setProfileError('A nova senha não pode ser igual à senha atual.');
        return;
      }
      const passValidation = validatePasswordRules(newPassword);
      if (!passValidation.valid) {
        setProfileError(passValidation.message);
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setProfileError(t('auth.errorPasswordMismatch'));
        return;
      }
    }

    setSavingProfile(true);

    try {
      const payload = {
        fullName: editName.trim(),
        email: editEmail.trim(),
      };

      if (showPasswordFields && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await updateProfile(payload);
      if (res.success) {
        setEditModalVisible(false);
        Alert.alert(t('common.success'), t('profile.profileUpdated'));
      } else {
        setProfileError(res.message || t('common.error'));
      }
    } catch (e) {
      setProfileError(t('common.error'));
    } finally {
      setSavingProfile(false);
    }
  }

  // Limpeza de todos os dados do aplicativo
  function handleResetData() {
    Alert.alert(
      'Limpar todos os dados desta conta?',
      'Esta ação é irreversível e excluirá permanentemente todas as suas movimentações, receitas, despesas, gastos recorrentes, metas e notas salvas no seu dispositivo.\n\nSua conta ficará totalmente zerada, sem carregar dados fictícios ou de demonstração.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, apagar tudo',
          style: 'destructive',
          onPress: async () => {
            const success = await resetAllData();
            if (success) {
              Alert.alert('Conta Zerada', 'Todos os dados desta conta foram apagados com sucesso! Você pode recomeçar com lançamentos limpos.');
            }
          },
        },
      ]
    );
  }

  // Encerramento de sessão
  function handleLogout() {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  }

  const activeRecurringCount = (recurringExpenses || []).filter((r) => r.active !== false).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surfaceAlt }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('profile.title')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(40, insets.bottom + 20) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do Usuário / Avatar */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{user?.initials || 'MB'}</Text>
          </View>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>
            {user?.fullName || user?.name || 'Usuário'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
            {user?.email || 'usuario@meubolso.com'}
          </Text>

          <View style={[styles.badgeContainer, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="shield-checkmark" size={14} color={theme.textPurple} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: theme.textPurple }]}>
              {t('profile.memberSince')} 2026
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.editProfileBtn, { borderColor: theme.borderDark, backgroundColor: theme.surfaceAlt }]}
            onPress={handleOpenEdit}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color={theme.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.editProfileBtnText, { color: theme.textPrimary }]}>
              {t('profile.editProfile')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Preferências do Aplicativo e Automações */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t('profile.preferences')}
        </Text>

        <View style={[styles.optionsGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* 1. Modo de Tema (Claro / Escuro / Sistema) */}
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconContainer, { backgroundColor: theme.primaryLight }]}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={18}
                  color={theme.primary}
                />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>
                  {t('profile.theme')}
                </Text>
                <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                  {themeMode === 'light'
                    ? t('profile.themeLight')
                    : themeMode === 'dark'
                    ? t('profile.themeDark')
                    : t('profile.themeSystem')}
                </Text>
              </View>
            </View>
          </View>

          {/* Segmented Controls do Tema */}
          <View style={[styles.segmentedTrack, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                themeMode === 'light' && [styles.segmentItemActive, { backgroundColor: theme.primary }],
              ]}
              onPress={() => setThemeMode('light')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="sunny-outline"
                size={16}
                color={themeMode === 'light' ? '#FFFFFF' : theme.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: themeMode === 'light' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Claro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentItem,
                themeMode === 'dark' && [styles.segmentItemActive, { backgroundColor: theme.primary }],
              ]}
              onPress={() => setThemeMode('dark')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="moon-outline"
                size={16}
                color={themeMode === 'dark' ? '#FFFFFF' : theme.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: themeMode === 'dark' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Escuro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentItem,
                themeMode === 'system' && [styles.segmentItemActive, { backgroundColor: theme.primary }],
              ]}
              onPress={() => setThemeMode('system')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={16}
                color={themeMode === 'system' ? '#FFFFFF' : theme.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: themeMode === 'system' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Auto
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 2. Gastos Recorrentes Mensais */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('RecurringExpenses')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconContainer, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="repeat" size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>
                  {t('profile.recurringExpenses')}
                </Text>
                <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                  {t('profile.recurringExpensesSub')}
                </Text>
              </View>
            </View>
            <View style={styles.countPillWrapper}>
              <View style={[styles.countPill, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.countPillText, { color: theme.textPurple }]}>
                  {activeRecurringCount} {t('recurring.active').toLowerCase()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 3. Metas Financeiras / "Cofrinho" (RF05) */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Goals')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="ribbon" size={18} color={theme.income} />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>
                  {'Metas ("Cofrinho")'}
                </Text>
                <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                  {goals.length} objetivos cadastrados
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 4. Bloco de Anotações & Chaves Pix (RF03) */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Notes')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconContainer, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="document-text" size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>
                  Bloco de Notas & Pix
                </Text>
                <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                  {notes.length} lembretes salvos
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Seção: Resumo Financeiro da Conta */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t('profile.accountSummary')}
        </Text>

        <View style={[styles.summaryCardsRow]}>
          <View style={[styles.miniStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="receipt-outline" size={20} color={theme.primary} style={{ marginBottom: 6 }} />
            <Text style={[styles.miniStatValue, { color: theme.textPrimary }]}>
              {transactions.length}
            </Text>
            <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>
              {t('profile.totalTransactions')}
            </Text>
          </View>

          <View style={[styles.miniStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="trending-up-outline" size={20} color={theme.income} style={{ marginBottom: 6 }} />
            <Text style={[styles.miniStatValue, { color: theme.income }]}>
              {formatMoney(Math.max(0, monthlyResult))}
            </Text>
            <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>
              {t('profile.savedThisMonth')}
            </Text>
          </View>
        </View>

        {/* Seção: Ações de Sistema e Sessão */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t('profile.systemActions')}
        </Text>

        <View style={[styles.optionsGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Limpar e Redefinir Dados da Conta */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconContainer, { backgroundColor: theme.expenseLight }]}>
                <Ionicons name="trash-outline" size={18} color={theme.expense} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.actionLabel, { color: theme.expense }]}>
                  Limpar e Redefinir Dados
                </Text>
                <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                  Apaga todas as receitas, despesas, metas e notas. Deixa sua conta zerada sem restaurar dados fictícios.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Sair da conta */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconContainer, { backgroundColor: theme.expenseLight }]}>
                <Ionicons name="log-out-outline" size={18} color={theme.expense} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.expense }]}>
                {t('profile.logout')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: theme.textMuted }]}>
          Meu Bolso v1.0.0 · Acadêmico Sistemas de Informação
        </Text>
      </ScrollView>

      {/* Modal de Edição de Dados Pessoais e Senha */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {t('profile.editProfile')}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {profileError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.expenseLight }]}>
                <Text style={[styles.errorBoxText, { color: theme.expense }]}>
                  {profileError}
                </Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Campo Nome Completo */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('auth.fullName')}
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
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t('auth.fullNamePlaceholder')}
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              {/* Campo E-mail */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  {t('auth.email')}
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
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              {/* Toggle Alterar Senha */}
              <TouchableOpacity
                style={styles.togglePasswordRow}
                onPress={() => setShowPasswordFields(!showPasswordFields)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPasswordFields ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={theme.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.togglePasswordText, { color: theme.textPrimary }]}>
                  {t('profile.changePassword')}
                </Text>
              </TouchableOpacity>

              {showPasswordFields && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                      {t('profile.currentPassword')}
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
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      placeholder={t('profile.currentPassword')}
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                      {t('profile.newPasswordOptional')}
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
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      placeholder={t('auth.passwordPlaceholder')}
                      placeholderTextColor={theme.textMuted}
                    />
                    <Text style={[styles.passwordHintText, { color: theme.textMuted }]}>
                      Mínimo de 6 caracteres contendo letras e números.
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                      {t('auth.confirmPassword')}
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
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      secureTextEntry
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveModalBtn, { backgroundColor: theme.primary }]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
              activeOpacity={0.85}
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveModalBtnText}>
                  {t('profile.saveChanges')}
                </Text>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 18,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  optionsGroup: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  segmentedTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  countPillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  miniStatCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  miniStatLabel: {
    fontSize: 12,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 24,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBoxText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 14,
  },
  passwordHintText: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  togglePasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  togglePasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveModalBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
