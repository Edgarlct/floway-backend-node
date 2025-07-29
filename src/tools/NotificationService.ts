interface NotificationData {
    [key: string]: any;
}

interface PushMessage {
    to: string;
    title?: string;
    body?: string;
    data?: NotificationData;
    sound?: string;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
    ttl?: number;
}

interface NotificationOptions {
    title?: string;
    body?: string;
    data?: NotificationData;
    sound?: string;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
    ttl?: number;
}

export class NotificationService {
    private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    async sendNotifications(
        expoTokens: string[],
        options: NotificationOptions = {}
    ): Promise<{ success: boolean; results?: any; error?: string }> {
        if (!expoTokens || expoTokens.length === 0) {
            return { success: false, error: 'No expo token' };
        }

        const messages: PushMessage[] = expoTokens.map(token => ({
            to: token,
            title: options.title,
            body: options.body,
            data: options.data,
            sound: options.sound || 'default',
            badge: options.badge,
            priority: options.priority || 'default',
            ttl: options.ttl
        }));

        try {
            const response = await fetch(this.EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages)
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `Erreur HTTP: ${response.status} ${response.statusText}`
                };
            }

            const result = await response.json();
            return { success: true, results: result };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            };
        }
    }

    async sendSingleNotification(
        expoToken: string,
        options: NotificationOptions = {}
    ): Promise<{ success: boolean; result?: any; error?: string }> {
        const response = await this.sendNotifications([expoToken], options);

        if (!response.success) {
            return { success: false, error: response.error };
        }

        return {
            success: true,
            result: response.results?.data?.[0]
        };
    }
}

export default new NotificationService();
