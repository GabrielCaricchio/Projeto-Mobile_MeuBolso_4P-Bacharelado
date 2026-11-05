// src/contexts/AuthContext.js
// Contexto de autenticação, cadastro, sessão e perfil do usuário

import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';

/**
 * Validação de regras de senha seguras
 * Exige no mínimo 6 caracteres contendo pelo menos uma letra e um número
 */
export function validatePasswordRules(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'A senha é obrigatória.' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'A senha deve conter no mínimo 6 caracteres.' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      message: 'A senha deve conter pelo menos uma letra e um número (mínimo de 6 caracteres).',
    };
  }
  return { valid: true };
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUserSession() {
    try {
      await storageService.initializeDefaults();
      const currentUser = await storageService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUserSession();
  }, []);

  /**
   * Realiza login validando e-mail e senha cadastrados
   */
  async function login(email, password) {
    if (!email || !password) {
      return { success: false, message: 'Preencha o e-mail e a senha.' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    const users = await storageService.getUsers();

    const found = users.find(
      (u) => u.email.toLowerCase() === trimmedEmail && u.password === password
    );

    if (found) {
      setUser(found);
      await storageService.setCurrentUser(found);
      return { success: true };
    }

    return {
      success: false,
      message: 'E-mail ou senha incorretos. Verifique suas credenciais.',
    };
  }

  /**
   * Realiza o cadastro de uma nova conta de usuário
   */
  async function register(fullName, email, password, confirmPassword) {
    if (!fullName || !email || !password) {
      return { success: false, message: 'Todos os campos são obrigatórios.' };
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { success: false, message: 'As senhas não coincidem.' };
    }

    const passCheck = validatePasswordRules(password);
    if (!passCheck.valid) {
      return { success: false, message: passCheck.message };
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, message: 'Informe um endereço de e-mail válido.' };
    }

    const users = await storageService.getUsers();

    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, message: 'Este e-mail já está cadastrado no aplicativo.' };
    }

    // Gera o primeiro nome e as iniciais
    const nameParts = fullName.trim().split(' ').filter(Boolean);
    const firstName = nameParts[0] || 'Usuário';
    const initials =
      nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : `${nameParts[0].substring(0, 2)}`.toUpperCase();

    const newUser = {
      id: `user-${Date.now()}`,
      name: firstName,
      fullName: fullName.trim(),
      initials,
      email: trimmedEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    // Inicializa a nova conta com todos os dados financeiros vazios (sem dados de testes, sem outra conta)
    await storageService.initializeUserStorage(newUser.id);

    const updatedUsers = [...users, newUser];
    await storageService.saveUsers(updatedUsers);
    await storageService.setCurrentUser(newUser);
    setUser(newUser);

    return { success: true };
  }

  /**
   * Atualiza dados de perfil do usuário (nome, e-mail, senha)
   */
  async function updateProfile(updatedData) {
    if (!user) return { success: false, message: 'Nenhum usuário logado.' };

    const { fullName, email, currentPassword, newPassword } = updatedData;

    // Se estiver tentando alterar a senha, valida a senha atual e as restrições da nova senha
    if (newPassword) {
      if (currentPassword !== user.password) {
        return { success: false, message: 'Senha atual incorreta.' };
      }
      if (newPassword === user.password || newPassword === currentPassword) {
        return { success: false, message: 'A nova senha não pode ser igual à senha atual.' };
      }
      const passCheck = validatePasswordRules(newPassword);
      if (!passCheck.valid) {
        return { success: false, message: passCheck.message };
      }
    }

    // Calcula novas iniciais se o nome mudar
    let initials = user.initials;
    let firstName = user.name;
    if (fullName && fullName.trim() !== user.fullName) {
      const nameParts = fullName.trim().split(' ').filter(Boolean);
      firstName = nameParts[0] || 'Usuário';
      initials =
        nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : `${nameParts[0].substring(0, 2)}`.toUpperCase();
    }

    const updatedUser = {
      ...user,
      fullName: fullName ? fullName.trim() : user.fullName,
      name: firstName,
      initials,
      email: email ? email.trim().toLowerCase() : user.email,
      password: newPassword || user.password,
    };

    const res = await storageService.updateUser(updatedUser);
    if (res.success) {
      setUser(updatedUser);
      return { success: true };
    }
    return res;
  }

  /**
   * Recuperação de senha local/educacional
   */
  async function resetPassword(email, newPassword) {
    if (!email) {
      return { success: false, message: 'Informe o e-mail cadastrado.' };
    }
    const trimmedEmail = email.trim().toLowerCase();
    const users = await storageService.getUsers();
    const index = users.findIndex((u) => u.email.toLowerCase() === trimmedEmail);

    if (index === -1) {
      return { success: false, message: 'Nenhuma conta encontrada com este e-mail.' };
    }

    if (newPassword) {
      if (newPassword === users[index].password) {
        return { success: false, message: 'A nova senha não pode ser igual à senha anterior.' };
      }
      const passCheck = validatePasswordRules(newPassword);
      if (!passCheck.valid) {
        return { success: false, message: passCheck.message };
      }
      users[index].password = newPassword;
      await storageService.saveUsers(users);
      return { success: true, message: 'Senha atualizada com sucesso! Você já pode entrar.' };
    }

    return {
      success: true,
      message: `Instruções de redefinição foram simuladas para ${email}.`,
    };
  }

  /**
   * Encerra a sessão do usuário
   */
  async function logout() {
    setUser(null);
    await storageService.setCurrentUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateProfile,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
