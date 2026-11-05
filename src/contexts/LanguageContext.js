// src/contexts/LanguageContext.js
// Provedor de idioma e internacionalização (Português / Inglês) com persistência local

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = '@meubolso_language';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('pt');
  const [loading, setLoading] = useState(true);

  async function loadSavedLanguage() {
    try {
      // Idioma padronizado estritamente em Português (Brasil)
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
      setLanguageState('pt');
    } catch (e) {
      console.error('Erro ao definir idioma salvo:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  async function setLanguage(newLang) {
    try {
      setLanguageState('pt');
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    } catch (e) {
      console.error('Erro ao salvar idioma:', e);
    }
  }

  /**
   * Função utilitária de tradução por chave hierárquica
   * Ex: t('auth.welcomeBack') ou t('dashboard.greeting', { name: 'Ana' })
   */
  function t(path, params = {}) {
    const keys = path.split('.');
    let current = translations[language];

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback para português caso falte alguma chave
        let fallback = translations['pt'];
        for (const fbKey of keys) {
          if (fallback && fallback[fbKey] !== undefined) {
            fallback = fallback[fbKey];
          } else {
            fallback = path;
            break;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return current || path;
    }

    // Interpolação de parâmetros {{key}}
    let result = current;
    Object.keys(params).forEach((paramKey) => {
      const regex = new RegExp(`{{${paramKey}}}`, 'g');
      result = result.replace(regex, params[paramKey]);
    });

    return result;
  }

  /**
   * Retorna o nome da categoria traduzido
   */
  function translateCategory(categoryNameOrId) {
    if (!categoryNameOrId) return '';
    const norm = categoryNameOrId
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');

    const catDict = translations[language]?.categories || {};
    if (catDict[norm]) return catDict[norm];

    // Busca reversa se foi passado o nome em português
    const ptCats = translations.pt.categories;
    for (const [key, val] of Object.entries(ptCats)) {
      if (val.toLowerCase() === categoryNameOrId.toLowerCase()) {
        return catDict[key] || val;
      }
    }

    return categoryNameOrId;
  }

  /**
   * Formata moeda de acordo com o idioma selecionado
   */
  function formatMoney(value) {
    const num = Number(value) || 0;
    if (language === 'en') {
      return '$' + num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return 'R$ ' + num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateCategory,
        formatMoney,
        isEnglish: language === 'en',
        loading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage deve ser usado dentro de um LanguageProvider');
  }
  return context;
}

