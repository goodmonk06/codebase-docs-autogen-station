/**
 * Notification Adapter Interface
 * Allows sending notifications via email, Slack, Discord, webhooks, etc.
 */
export interface INotificationAdapter {
  channel: string;
  send(notification: Notification): Promise<void>;
  isConfigured(): boolean;
}

export interface Notification {
  event: NotificationEvent;
  title: string;
  message: string;
  data?: Record<string, any>;
  severity?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: Date;
}

export type NotificationEvent =
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'analysis_scheduled'
  | 'template_applied'
  | 'comparison_available';

export interface NotificationDestination {
  type: 'email' | 'slack' | 'discord' | 'webhook';
  address: string;
  metadata?: Record<string, any>;
}
