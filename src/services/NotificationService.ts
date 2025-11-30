import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuração global: como a notificação aparece quando o app está aberto
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
  // 1. Pedir permissão
  requestPermissions: async () => {
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
  },

  // 2. Agendar notificação de rega
  scheduleWateringReminder: async (plantName: string, secondsFromNow: number) => {
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
  },

  // 3. Cancelar todas (útil para testes ou reset)
  cancelAll: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};