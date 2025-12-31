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
  requestPermissions: async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permissão de notificação negada!');
        return false;
      }
      return true;
    } catch (error) {
      // Silencia o erro no Expo Go para não travar o app
      console.warn("Notificações podem não funcionar neste ambiente:", error);
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
          // Ensure we don't schedule in the past
          if (triggerInput.getTime() <= Date.now()) {
            console.log("Ignorando notificação para data passada:", triggerInput);
            return null;
          }
          trigger = triggerInput;
      } else {
          // If seconds provided
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
          categoryIdentifier: 'PLANT_CARE', // For interactive notifications (Snooze/Done) in future
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.warn("Falha ao agendar notificação (Limitação do Expo Go):", error);
      return null;
    }
  },

  testNotification: async () => {
      try {
        const hasPermission = await NotificationService.requestPermissions();
        if (!hasPermission) {
            console.log("Sem permissão para testar notificação");
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Teste de Notificação 🔔",
                body: "Se você está vendo isso, suas notificações estão funcionando!",
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 5,
                repeats: false,
            }
        });
      } catch (error) {
          console.error("Erro ao testar notificação:", error);
      }
  },

  cancelAll: async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn("Erro ao cancelar notificações:", error);
    }
  }
};
