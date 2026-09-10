/**
 * reminderService — Lembrete diário de estudo (expo-notifications).
 *
 * COMO FUNCIONA (resumo p/ apresentação):
 * 1. PERMISSÃO: getPermissionsAsync() diz o estado atual; se não concedida,
 *    requestPermissionsAsync() pergunta ao usuário. O retorno traz
 *    { granted, canAskAgain } — igual ao fluxo da câmera.
 * 2. CANAL ANDROID: do Android 8+ toda notificação precisa de um canal
 *    (setNotificationChannelAsync) com importância — sem ele, nada aparece.
 * 3. AGENDAMENTO: scheduleNotificationAsync() com trigger de calendário
 *    { hour, minute, repeats: true }. Quem dispara é o SISTEMA (alarme),
 *    não o app: funciona com o app fechado e sem internet.
 * 4. PERSISTÊNCIA (RF01): ativo + horário ficam no user_settings (SQLite),
 *    mesma tabela da meta semanal — zero tabela nova.
 * 5. BOOT: restoreDailyReminder() reagenda a partir do SQLite ao abrir o app.
 *
 * - Agenda 1 notificação local recorrente (trigger de calendário HH:MM).
 * - Horário/ativo persistem no `user_settings` existente (RF01 — SQLite).
 * - `expo-notifications` é carregado com lazy-require: o jest renderiza
 *   ProfileScreen no Node (fase0-05) e o módulo nativo não existe lá.
 */
import { Platform } from 'react-native';
import { getUserSettings, updateReminderSettings } from './subjectsDb';

const CHANNEL_ID = 'studify-daily-reminder';

let N = null;
function notif() {
  if (!N) N = require('expo-notifications');
  return N;
}

export async function configureReminderChannel() {
  try {
    const api = notif();
    if (api.setNotificationHandler) {
      api.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    }
    if (Platform.OS === 'android' && api.setNotificationChannelAsync) {
      await api.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Lembretes de estudo',
        importance: api.AndroidImportance ? api.AndroidImportance.HIGH : 4,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  } catch (e) {
    console.warn('Lembrete: canal de notificação indisponível', e?.message || e);
  }
}

/**
 * Pede permissão de notificação.
 * @returns {{ granted: boolean, canAskAgain: boolean }}
 */
export async function requestReminderPermission() {
  try {
    const api = notif();
    const current = await api.getPermissionsAsync();
    if (current.granted) return { granted: true, canAskAgain: true };
    const req = await api.requestPermissionsAsync();
    return {
      granted: !!req.granted,
      canAskAgain: req.canAskAgain !== false,
    };
  } catch (e) {
    console.warn('Lembrete: permissão indisponível', e?.message || e);
    return { granted: false, canAskAgain: true };
  }
}

async function scheduleDaily(hour, minute) {
  const api = notif();
  // O app agenda um único tipo de notificação: limpa antes de reagendar.
  if (api.cancelAllScheduledNotificationsAsync) {
    await api.cancelAllScheduledNotificationsAsync();
  }
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return api.scheduleNotificationAsync({
    content: {
      title: '📚 Hora de estudar!',
      body: `Seu lembrete das ${hh}:${mm} — abra o Studify e mantenha o streak 🔥`,
      sound: false,
    },
    trigger: {
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      hour,
      minute,
      repeats: true,
    },
  });
}

/** Ativa (ou reagenda) o lembrete e persiste. Requer permissão já concedida. */
export async function enableDailyReminder(userId, hour, minute) {
  await configureReminderChannel();
  const identifier = await scheduleDaily(hour, minute);
  await updateReminderSettings(userId, { enabled: true, hour, minute });
  return identifier;
}

/** Desliga o lembrete (cancela agendamento + persiste). */
export async function disableDailyReminder(userId) {
  try {
    await notif().cancelAllScheduledNotificationsAsync?.();
  } catch (e) {
    console.warn('Lembrete: falha ao cancelar', e?.message || e);
  }
  const settings = await getUserSettings(userId);
  await updateReminderSettings(userId, {
    enabled: false,
    hour: settings.reminder_hour ?? 20,
    minute: settings.reminder_minute ?? 0,
  });
}

/**
 * Reagenda o lembrete no boot do app a partir do que está persistido.
 * Chamado uma vez no bootstrap — nunca quebra o boot (RNF01).
 */
export async function restoreDailyReminder(userId) {
  try {
    if (!userId) return;
    const settings = await getUserSettings(userId);
    if (settings.reminder_enabled) {
      await configureReminderChannel();
      await scheduleDaily(settings.reminder_hour ?? 20, settings.reminder_minute ?? 0);
    }
  } catch (e) {
    console.warn('Lembrete: restore ignorado', e?.message || e);
  }
}
