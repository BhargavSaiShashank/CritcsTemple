import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';

export const FirebaseMessagingService = {
    async init() {
        if (!Capacitor.isNativePlatform()) {
            console.log('[FirebaseMessaging] Push notifications are only supported on native platforms.');
            return;
        }

        try {
            // 1. Request permissions (especially for Android 13+)
            const result = await FirebaseMessaging.requestPermissions();
            console.log('[FirebaseMessaging] Permission result:', result.receive);

            if (result.receive === 'granted') {
                // 2. Create notification channel (Required for Android popups)
                await FirebaseMessaging.createChannel({
                    id: 'default',
                    name: 'Default',
                    description: 'Default notification channel',
                    importance: 5, // High importance for popups
                    visibility: 1,
                    sound: 'default',
                    vibration: true,
                });

                // 3. Register for push notifications
                await this.registerHandlers();
                
                // 3. Get the token
                const { token } = await FirebaseMessaging.getToken();
                console.log('[FirebaseMessaging] FCM Token:', token);
                
                // Optional: Send token to your backend here
                // await this.sendTokenToBackend(token);
            }
        } catch (error) {
            console.error('[FirebaseMessaging] Initialization failed:', error);
        }
    },

    async registerHandlers() {
        // Foreground notification received
        await FirebaseMessaging.addListener('notificationReceived', (event) => {
            console.log('[FirebaseMessaging] Notification received:', event);
            // You can show a local notification or update UI here
        });

        // Notification clicked/tapped
        await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
            console.log('[FirebaseMessaging] Notification action performed:', event);
            // Handle redirection logic here
            const data = event.notification.data;
            if (data && data.url) {
                // window.location.href = data.url;
            }
        });

        // Token refreshed
        await FirebaseMessaging.addListener('tokenReceived', (event) => {
            console.log('[FirebaseMessaging] Token refreshed:', event.token);
            // Update token on your backend
        });
    },

    async removeAllListeners() {
        if (!Capacitor.isNativePlatform()) return;
        await FirebaseMessaging.removeAllListeners();
    }
};
