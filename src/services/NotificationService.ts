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

  scheduleWateringReminder: async (plantName: string, secondsFromNow: number) => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) return;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hora de regar! 💧",
          body: `Sua ${plantName} está com sede.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow, 
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