// src/services/currencyService.js
// RF08 – Consumo da AwesomeAPI Economia para cotações em tempo real de Dólar (USD) e Euro (EUR) em relação ao Real (BRL)
// RNF03 – Tratamento amigável offline via try/catch, fallback resiliente e cache local
// RNF04 – Suporte a controle de estado assíncrono (isLoading)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL';
const API_URL_ALT = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL';
const BACKUP_API_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_KEY = '@meubolso_cotacoes_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache para evitar rate-limit e economizar requisições

/**
 * Cria cabeçalhos HTTP compatíveis.
 * Em ambientes móveis (Android/iOS), define um User-Agent personalizado para evitar
 * o bloqueio HTTP 429 (QuotaExceeded) que a AwesomeAPI impõe ao User-Agent padrão do OkHttp do React Native.
 */
function getRequestHeaders() {
  const headers = {
    Accept: 'application/json',
  };
  if (Platform.OS !== 'web') {
    headers['User-Agent'] = 'MeuBolso/1.0 (Mobile; Expo; Android; iOS)';
  }
  return headers;
}

export const currencyService = {
  /**
   * Obtém cotações em tempo real do Dólar e Euro com suporte a cache inteligente,
   * provedor secundário de contingência e modo offline resiliente.
   * @param {boolean} forceRefresh - Se verdadeiro, ignora o tempo de expiração do cache e busca online
   */
  async getExchangeRates(forceRefresh = false) {
    // 1. Verificação de Cache recente (apenas se não for atualização forçada)
    if (!forceRefresh) {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - new Date(parsed.lastUpdated || 0).getTime();
          if (!parsed.isOffline && cacheAge < CACHE_TTL_MS && parsed.usd?.bid > 0) {
            return {
              success: true,
              data: parsed,
              fromCache: true,
            };
          }
        }
      } catch (_e) {
        // Prossegue para a consulta de rede em caso de falha de leitura do cache
      }
    }

    // 2. Consulta à AwesomeAPI (endpoint principal e alternativo com timeout)
    const requestHeaders = getRequestHeaders();
    const urlsToTry = [API_URL, API_URL_ALT];

    for (const url of urlsToTry) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: requestHeaders,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.USDBRL && data.EURBRL) {
            const rates = {
              usd: {
                code: data.USDBRL?.code || 'USD',
                name: data.USDBRL?.name || 'Dólar Americano / Real Brasileiro',
                bid: parseFloat(data.USDBRL?.bid || 0),
                ask: parseFloat(data.USDBRL?.ask || 0),
                high: parseFloat(data.USDBRL?.high || 0),
                low: parseFloat(data.USDBRL?.low || 0),
                pctChange: parseFloat(data.USDBRL?.pctChange || 0),
                createDate: data.USDBRL?.create_date || new Date().toISOString(),
              },
              eur: {
                code: data.EURBRL?.code || 'EUR',
                name: data.EURBRL?.name || 'Euro / Real Brasileiro',
                bid: parseFloat(data.EURBRL?.bid || 0),
                ask: parseFloat(data.EURBRL?.ask || 0),
                high: parseFloat(data.EURBRL?.high || 0),
                low: parseFloat(data.EURBRL?.low || 0),
                pctChange: parseFloat(data.EURBRL?.pctChange || 0),
                createDate: data.EURBRL?.create_date || new Date().toISOString(),
              },
              isOffline: false,
              lastUpdated: new Date().toISOString(),
            };

            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(rates));

            return {
              success: true,
              data: rates,
              fromCache: false,
            };
          }
        } else {
          console.warn(`AwesomeAPI retornou status ${response.status} para ${url}`);
        }
      } catch (_err) {
        clearTimeout(timeoutId);
      }
    }

    // 3. Contingência: Provedor Secundário (Open Exchange Rates API)
    try {
      const backupController = new AbortController();
      const backupTimeoutId = setTimeout(() => backupController.abort(), 6000);

      const backupResponse = await fetch(BACKUP_API_URL, {
        signal: backupController.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(backupTimeoutId);

      if (backupResponse.ok) {
        const data = await backupResponse.json();
        if (data.rates && data.rates.BRL) {
          const usdBrl = parseFloat(Number(data.rates.BRL).toFixed(4));
          const eurUsd = parseFloat(data.rates.EUR) || 0.89;
          const eurBrl = parseFloat((usdBrl / eurUsd).toFixed(4));

          const rates = {
            usd: {
              code: 'USD',
              name: 'Dólar Americano / Real Brasileiro',
              bid: usdBrl,
              ask: usdBrl,
              high: usdBrl,
              low: usdBrl,
              pctChange: 0,
              createDate: data.time_last_update_utc || new Date().toISOString(),
            },
            eur: {
              code: 'EUR',
              name: 'Euro / Real Brasileiro',
              bid: eurBrl,
              ask: eurBrl,
              high: eurBrl,
              low: eurBrl,
              pctChange: 0,
              createDate: data.time_last_update_utc || new Date().toISOString(),
            },
            isOffline: false,
            lastUpdated: new Date().toISOString(),
          };

          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(rates));

          return {
            success: true,
            data: rates,
            fromCache: false,
          };
        }
      }
    } catch (_backupErr) {
      // Falha em ambas as redes, ativa modo offline resiliente
    }

    // 4. Modo Offline: Recuperação da última cotação gravada no cache local
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          success: true,
          data: {
            ...parsed,
            isOffline: true,
          },
          fromCache: true,
          message: 'Modo offline: Exibindo última cotação salva.',
        };
      }
    } catch (_e) {
      // ignore
    }

    // 5. Fallback final sem cache: valores padrão aproximados
    return {
      success: false,
      data: {
        usd: { code: 'USD', name: 'Dólar Americano', bid: 5.46, ask: 5.46, pctChange: 0, high: 5.47, low: 5.45 },
        eur: { code: 'EUR', name: 'Euro Comercial', bid: 6.13, ask: 6.13, pctChange: 0, high: 6.15, low: 6.12 },
        isOffline: true,
        lastUpdated: null,
      },
      fromCache: true,
      message: 'Modo offline: Não foi possível obter cotações em tempo real.',
    };
  },
};
