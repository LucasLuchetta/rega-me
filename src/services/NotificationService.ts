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

  scheduleTaskNotification: async (plantName: string, taskType: string, secondsFromNow: number) => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) return;

      let title = "Hora de cuidar! 🌱";
      let body = `Sua ${plantName} precisa de atenção.`;

      switch (taskType) {
        case 'water':
          title = "Hora de regar! 💧";
          body = `Sua ${plantName} está com sede.`;
          break;
        case 'fertilize':
          title = "Hora de adubar! 🧪";
          body = `Nutrientes para sua ${plantName}.`;
          break;
        case 'prune':
          title = "Hora da poda! ✂️";
          body = `Vamos deixar sua ${plantName} mais bonita?`;
          break;
        case 'mist':
          title = "Hora de borrifar! 🌫️";
          body = `Aumente a umidade da ${plantName}.`;
          break;
        case 'pesticide':
          title = "Controle de pragas 🛡️";
          body = `Proteja sua ${plantName} hoje.`;
          break;
        case 'repot':
          title = "Troca de vaso 🪴";
          body = `Sua ${plantName} precisa de mais espaço.`;
          break;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow > 0 ? secondsFromNow : 1, // Garante que não seja negativo
          repeats: false, 
        },
      });
      return id;
    } catch (error) {
      console.warn("Falha ao agendar notificação (Limitação do Expo Go):", error);
      return null;
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