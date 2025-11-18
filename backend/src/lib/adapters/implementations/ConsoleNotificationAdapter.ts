import { INotificationAdapter, Notification } from '../INotificationAdapter';

/**
 * Console Notification Adapter (for development/testing)
 * Logs notifications to console
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  channel = 'console';

  async send(notification: Notification): Promise<void> {
    const timestamp = notification.timestamp || new Date();
    const severity = notification.severity || 'info';

    console.log(`
[NOTIFICATION] ${severity.toUpperCase()} - ${notification.event}
Title: ${notification.title}
Message: ${notification.message}
Time: ${timestamp.toISOString()}
${notification.data ? `Data: ${JSON.stringify(notification.data, null, 2)}` : ''}
    `);
  }

  isConfigured(): boolean {
    return true; // Console is always available
  }
}
