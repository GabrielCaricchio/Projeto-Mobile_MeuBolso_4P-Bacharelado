// RF09 – Agendamento de notificações locais no Expo (Expo Go e Standalone APK)

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

const CHANNEL_ID = 'meu-bolso-reminders';

// Configura o comportamento de exibição das notificações quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes financeiros',
      importance: AndroidImportance?.DEFAULT ?? 5,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
  }
}

export const notificationService = {
  /**
   * Solicita permissões de notificação local ao sistema operacional
   */
  async requestPermissions() {
    try {
      await ensureNotificationChannel();
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (error) {
      console.warn('Erro ao solicitar permissões de notificação:', error);
      return false;
    }
  },

  /**
   * Agendamento de lembrete diário automático de registro financeiro (RF09)
   */
  async scheduleDailyReminder(hour = 20, minute = 0) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Cancela lembrete diário anterior se existir
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const item of scheduled) {
        if (item.content?.data?.type === 'daily_reminder') {
          await Notifications.cancelScheduledNotificationAsync(item.identifier);
        }
      }

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Meu Bolso 💰',
          body: 'Não se esqueça de registrar as entradas e saídas de hoje para manter seu saldo em dia!',
          data: { type: 'daily_reminder' },
          channelId: CHANNEL_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
      });
    } catch (error) {
      console.warn('Erro ao agendar lembrete diário:', error);
      return null;
    }
  },

  /**
   * Agendamento de alerta para a data de vencimento de gastos futuros/planejados (RF09)
   */
  async scheduleExpenseDueAlert(expense) {
    if (!expense?.dataVencimento && !expense?.date) return null;

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const dueDateStr = expense.dataVencimento || expense.date;
      const [year, month, day] = dueDateStr.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day, 9, 0, 0); // 9h da manhã do dia do vencimento

      // Se a data já passou, não agenda
      if (targetDate.getTime() <= Date.now()) {
        return null;
      }

      const expenseTag = `expense_due_${expense.id ?? dueDateStr}`;

      // Cancela alerta anterior para esta despesa se houver
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const item of scheduled) {
        if (item.content?.data?.tag === expenseTag) {
          await Notifications.cancelScheduledNotificationAsync(item.identifier);
        }
      }

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Vencimento de Gasto Planejado ⚠️',
          body: `Hoje é o dia previsto para a despesa "${expense.descricao || expense.description}" (R$ ${Number(expense.valor || expense.amount || 0).toFixed(2).replace('.', ',')}).`,
          data: {
            type: 'expense_due',
            tag: expenseTag,
            expenseId: expense.id,
          },
          channelId: CHANNEL_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
          channelId: CHANNEL_ID,
        },
      });
    } catch (error) {
      console.warn('Erro ao agendar alerta de vencimento:', error);
      return null;
    }
  },

  /**
   * Dispara notificação imediata (didática ou teste)
   */
  async sendInstantNotification(title, body, data = {}) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          channelId: CHANNEL_ID,
        },
        trigger: null,
      });
    } catch (e) {
      console.warn('Erro ao enviar notificação imediata:', e);
      return null;
    }
  },

  /**
   * Cancela uma notificação agendada pelo ID ou identificador
   */
  async cancelNotification(notificationId) {
    if (!notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.warn('Erro ao cancelar notificação:', e);
    }
  },
};
