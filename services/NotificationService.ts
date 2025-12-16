/**
 * NotificationService - Browser Push Notifications for Wealth Aggregator
 * Handles permission requests, sending notifications, and scheduling alerts.
 */

import { db, Alert } from '../database';

export type NotificationType = 'price_target' | 'stop_loss' | 'sip_reminder' | 'tax_deadline' | 'custom';

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    data?: any;
}

class NotificationService {
    private static instance: NotificationService;
    private permission: NotificationPermission = 'default';

    private constructor() {
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Check if notifications are supported
     */
    isSupported(): boolean {
        return 'Notification' in window;
    }

    /**
     * Check current permission status
     */
    getPermission(): NotificationPermission {
        return this.permission;
    }

    /**
     * Request notification permission from user
     */
    async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported()) {
            console.warn('Notifications not supported in this browser');
            return 'denied';
        }

        try {
            this.permission = await Notification.requestPermission();
            return this.permission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }

    /**
     * Send a notification immediately
     */
    async send(options: NotificationOptions): Promise<Notification | null> {
        if (!this.isSupported()) return null;

        if (this.permission !== 'granted') {
            const newPermission = await this.requestPermission();
            if (newPermission !== 'granted') return null;
        }

        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/favicon.ico',
                tag: options.tag,
                requireInteraction: options.requireInteraction || false,
                data: options.data,
            });

            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    }

    /**
     * Create a price target alert
     */
    async createPriceAlert(
        assetId: string,
        assetName: string,
        targetPrice: number,
        type: 'price_target' | 'stop_loss'
    ): Promise<number> {
        const title = type === 'price_target'
            ? `Target Price Alert: ${assetName}`
            : `Stop Loss Alert: ${assetName}`;

        const description = type === 'price_target'
            ? `Notify when ${assetName} reaches ₹${targetPrice.toLocaleString()}`
            : `Notify when ${assetName} falls below ₹${targetPrice.toLocaleString()}`;

        const id = await db.alerts.add({
            type,
            title,
            description,
            triggerValue: targetPrice,
            assetId,
            isActive: true,
            createdAt: new Date().toISOString(),
            notified: false,
        });

        return id as number;
    }

    /**
     * Create a SIP reminder
     */
    async createSIPReminder(
        assetName: string,
        dayOfMonth: number
    ): Promise<number> {
        const id = await db.alerts.add({
            type: 'sip_reminder',
            title: `SIP Reminder: ${assetName}`,
            description: `Monthly SIP due on day ${dayOfMonth}`,
            triggerValue: dayOfMonth,
            isActive: true,
            createdAt: new Date().toISOString(),
            notified: false,
        });

        return id as number;
    }

    /**
     * Create a tax deadline alert
     */
    async createTaxDeadline(
        title: string,
        description: string,
        deadlineDate: Date
    ): Promise<number> {
        const id = await db.alerts.add({
            type: 'tax_deadline',
            title,
            description,
            triggerValue: deadlineDate.getTime(),
            isActive: true,
            createdAt: new Date().toISOString(),
            notified: false,
        });

        return id as number;
    }

    /**
     * Get all active alerts
     */
    async getActiveAlerts(): Promise<Alert[]> {
        return db.alerts.where('isActive').equals(1).toArray();
    }

    /**
     * Deactivate an alert
     */
    async deactivateAlert(id: number): Promise<void> {
        await db.alerts.update(id, { isActive: false });
    }

    /**
     * Delete an alert
     */
    async deleteAlert(id: number): Promise<void> {
        await db.alerts.delete(id);
    }

    /**
     * Mark an alert as notified
     */
    async markAsNotified(id: number): Promise<void> {
        await db.alerts.update(id, {
            notified: true,
            triggeredAt: new Date().toISOString()
        });
    }

    /**
     * Check and trigger SIP reminders for today
     */
    async checkSIPReminders(): Promise<void> {
        const today = new Date().getDate();
        const sipAlerts = await db.alerts
            .where('type')
            .equals('sip_reminder')
            .and(a => a.isActive && !a.notified && a.triggerValue === today)
            .toArray();

        for (const alert of sipAlerts) {
            await this.send({
                title: alert.title,
                body: alert.description,
                tag: `sip-${alert.id}`,
            });
            await this.markAsNotified(alert.id!);
        }
    }

    /**
     * Check tax deadline alerts (notify 7 days before)
     */
    async checkTaxDeadlines(): Promise<void> {
        const now = Date.now();
        const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

        const taxAlerts = await db.alerts
            .where('type')
            .equals('tax_deadline')
            .and(a =>
                a.isActive &&
                !a.notified &&
                a.triggerValue! <= sevenDaysFromNow &&
                a.triggerValue! > now
            )
            .toArray();

        for (const alert of taxAlerts) {
            const daysLeft = Math.ceil((alert.triggerValue! - now) / (24 * 60 * 60 * 1000));
            await this.send({
                title: `⚠️ ${alert.title}`,
                body: `${alert.description} - ${daysLeft} days remaining`,
                tag: `tax-${alert.id}`,
                requireInteraction: true,
            });
            await this.markAsNotified(alert.id!);
        }
    }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

export default NotificationService;
