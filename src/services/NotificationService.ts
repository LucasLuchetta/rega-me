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

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android' || channelReady) return;
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
  } catch (error) {
    if (__DEV__) console.warn('Não foi possível criar o canal de notificação:', error);
  }
};

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

export const NotificationService = {
  /** Estado atual da permissão, sem abrir o diálogo do sistema. */
  getPermissionStatus: async (): Promise<'granted' | 'denied' | 'undetermined'> => {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      if (status === 'granted') return 'granted';
      return canAskAgain ? 'undetermined' : 'denied';
    } catch {
      return 'undetermined';
    }
  },

  requestPermissions: async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) console.log('Permissão de notificação negada!');
        return false;
      }

      await ensureAndroidChannel();
      return true;
    } catch (error) {
      // Silencia o erro no Expo Go para não travar o app
      if (__DEV__) console.warn("Notificações podem não funcionar neste ambiente:", error);
      return false;
    }
  },

  scheduleWateringReminder: async (plantName: string, triggerInput: number | Date, taskType: string = 'water') => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) return;

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
      if (__DEV__) console.warn("Falha ao agendar notificação:", error);
      return null;
    }
  },

  /**
   * Dispara um lembrete de teste alguns segundos depois, para o usuário
   * confirmar que os avisos realmente chegam no aparelho dele.
   */
  sendTestNotification: async (delaySeconds: number = 5) => {
    const hasPermission = await NotificationService.requestPermissions();
    if (!hasPermission) return false;

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
      return true;
    } catch (error) {
      if (__DEV__) console.warn("Falha ao enviar notificação de teste:", error);
      return false;
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
