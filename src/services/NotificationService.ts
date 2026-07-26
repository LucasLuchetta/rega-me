import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Sem um canal declarado, o Android 8+ entrega os lembretes sem som nem prioridade.
const ANDROID_CHANNEL_ID = 'plant-care';

let channelReady = false;

/** Retorna null quando o canal está pronto, ou a mensagem do erro que impediu. */
const ensureAndroidChannel = async (): Promise<string | null> => {
  if (Platform.OS !== 'android' || channelReady) return null;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Cuidados com as plantas',
      description: 'Lembretes de rega, adubo e demais cuidados do seu jardim.',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5D8C7B',
      sound: 'default',
    });
    channelReady = true;
    return null;
  } catch (error) {
    // Sem canal o Android descarta o aviso em silêncio, então isso não é detalhe.
    console.warn('Não foi possível criar o canal de notificação:', error);
    return describeError(error);
  }
};

const describeError = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getMessageForTask = (taskType: string, plantName: string) => {
    const messages = {
        water: [
            `Ei, a ${plantName} está com sede! Que tal um pouco de água? 💧`,
            `Psst... a ${plantName} está sonhando com água fresca.`,
            `Hora do drink da ${plantName}! 🍹`,
            `A ${plantName} perguntou se hoje tem rega. 👀`
        ],
        fertilize: [
            `Hora do lanchinho da ${plantName}! (Adubo) 🍱`,
            `A ${plantName} quer crescer forte! Hora de adubar. 💪`,
            `Nutrientes para a ${plantName}! 🌱`
        ],
        prune: [
            `Dia de cabeleireiro para a ${plantName}! (Poda) ✂️`,
            `Vamos deixar a ${plantName} mais bonita? Hora de podar.`,
            `Remova as folhas secas da ${plantName} hoje.`
        ],
        mist: [
            `A ${plantName} adoraria uma brisa úmida agora. (Borrifar) 🌧`,
            `Refresque as folhas da ${plantName}!`,
        ],
        repot: [
            `A casa ficou pequena para a ${plantName}! Hora de replantar. 🏠`,
            `A ${plantName} precisa de mais espaço para as raízes. 📦`
        ],
        default: [
            `Lembrete de cuidado para ${plantName} ✨`,
            `Não esqueça da ${plantName} hoje!`,
            `Seu jardim precisa de você! (${plantName})`
        ]
    };

    const type = (taskType || 'default') as keyof typeof messages;
    const list = messages[type] || messages['default'];
    return list[Math.floor(Math.random() * list.length)];
};

/**
 * No Android 8+, além da permissão geral de notificação, cada canal tem um
 * interruptor próprio (ex: "Cuidados com as plantas"). O usuário pode liberar
 * a permissão geral do app e mesmo assim ter esse canal bloqueado à parte —
 * por isso checamos os dois separadamente em vez de só a permissão geral.
 */
const isAndroidChannelBlocked = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    const channel = await Notifications.getNotificationChannelAsync(ANDROID_CHANNEL_ID);
    return !!channel && channel.importance === Notifications.AndroidImportance.NONE;
  } catch (error) {
    console.warn('Não foi possível checar o canal de notificação:', error);
    return false;
  }
};

/**
 * Motivo pelo qual o aviso não vai chegar. Cada caso pede uma orientação
 * diferente ao usuário — juntar tudo em "bloqueado" faz o app acusar o
 * aparelho de algo que ele não fez.
 */
export type NotificationBlocker =
  /** O usuário nunca respondeu ao diálogo do sistema. */
  | 'undetermined'
  /** Permissão de notificação do app negada/desligada. */
  | 'denied'
  /** Permissão liberada, mas a categoria "Cuidados com as plantas" está desligada. */
  | 'channel-blocked'
  /** Falha técnica (ambiente sem suporte, erro do módulo). Nada a ver com bloqueio. */
  | 'unavailable';

export type NotificationReadiness =
  | { ok: true }
  | { ok: false; reason: NotificationBlocker; detail?: string };

/**
 * Confere permissão + canal e prepara o que falta. `ask: false` só inspeciona,
 * sem abrir o diálogo do sistema.
 */
const ensureReady = async (ask: boolean): Promise<NotificationReadiness> => {
  let granted = false;
  let canAskAgain = true;

  try {
    const current = await Notifications.getPermissionsAsync();
    granted = current.status === 'granted';
    canAskAgain = current.canAskAgain;

    if (!granted && ask) {
      const asked = await Notifications.requestPermissionsAsync();
      granted = asked.status === 'granted';
      canAskAgain = asked.canAskAgain;
    }
  } catch (error) {
    console.warn('Não foi possível checar a permissão de notificação:', error);
    return { ok: false, reason: 'unavailable', detail: describeError(error) };
  }

  if (!granted) {
    return { ok: false, reason: canAskAgain ? 'undetermined' : 'denied' };
  }

  const channelError = await ensureAndroidChannel();
  if (channelError) {
    return { ok: false, reason: 'unavailable', detail: channelError };
  }

  if (await isAndroidChannelBlocked()) {
    console.log(`Canal "${ANDROID_CHANNEL_ID}" está bloqueado nas configurações do aparelho.`);
    return { ok: false, reason: 'channel-blocked' };
  }

  return { ok: true };
};

export const NotificationService = {
  /** Estado atual da permissão, sem abrir o diálogo do sistema. */
  getPermissionStatus: async (): Promise<'granted' | NotificationBlocker> => {
    const readiness = await ensureReady(false);
    return readiness.ok ? 'granted' : readiness.reason;
  },

  /** Pede o que falta e diz exatamente o que impediu, quando impediu. */
  ensureReady: () => ensureReady(true),

  requestPermissions: async () => (await ensureReady(true)).ok,

  scheduleWateringReminder: async (plantName: string, triggerInput: number | Date, taskType: string = 'water') => {
    try {
      const readiness = await ensureReady(true);
      // Canal bloqueado não impede agendar: se o usuário reativar a categoria
      // antes da hora, o lembrete ainda chega. Só permissão ausente inviabiliza.
      if (!readiness.ok && readiness.reason !== 'channel-blocked') return null;

      const bodyMessage = getMessageForTask(taskType, plantName);
      let trigger: any;

      if (triggerInput instanceof Date) {
          const now = Date.now();
          const triggerTime = triggerInput.getTime();

          // Verifica se é passado
          if (triggerTime <= now) {
            if (__DEV__) console.log("Ignorando notificação para data passada:", triggerInput);
            return null;
          }

          // CORREÇÃO AQUI:
          // Em vez de passar a Data direto, calculamos os segundos até lá.
          // Isso força o uso do sistema de Timer (igual ao seu teste) que é muito mais confiável.
          const secondsUntilTrigger = Math.floor((triggerTime - now) / 1000);

          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntilTrigger,
            repeats: false,
          };
      } else {
          // Lógica existente para segundos
          const seconds = typeof triggerInput === 'number' && triggerInput > 0 ? triggerInput : 1;
          trigger = {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: seconds,
              repeats: false,
          };
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Jardim Chamando 🌿",
          body: bodyMessage,
          sound: true,
          data: { plantName, taskType },
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { ...trigger, channelId: ANDROID_CHANNEL_ID },
      });

      if (__DEV__) console.log(`Notificação agendada para ${plantName} em ${trigger.seconds} segundos.`);
      return id;

    } catch (error) {
      console.warn("Falha ao agendar notificação:", error);
      return null;
    }
  },

  /**
   * Dispara um lembrete de teste alguns segundos depois, para o usuário
   * confirmar que os avisos realmente chegam no aparelho dele.
   */
  sendTestNotification: async (delaySeconds: number = 5): Promise<NotificationReadiness> => {
    const readiness = await ensureReady(true);
    if (!readiness.ok) return readiness;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Teste do Rega-me 🌿",
          body: "Deu certo! É assim que você vai ser avisado na hora de cuidar das suas plantas.",
          sound: true,
          data: { test: true },
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
          repeats: false,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
      return { ok: true };
    } catch (error) {
      console.warn("Falha ao enviar notificação de teste:", error);
      return { ok: false, reason: 'unavailable', detail: describeError(error) };
    }
  },

  /** Quantos lembretes estão agendados — usado para mostrar o estado ao usuário. */
  countScheduled: async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.length;
    } catch {
      return 0;
    }
  },

  cancelAll: async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      if (__DEV__) console.warn("Erro ao cancelar notificações:", error);
    }
  }
};
