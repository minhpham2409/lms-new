import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from '../database/repositories';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async findAll(userId: string) {
    return this.notificationRepository.findByUser(userId);
  }

  /** Fire-and-forget safe: errors are swallowed so business flows are not blocked. */
  notifyUser(
    userId: string,
    payload: { title: string; message: string; type?: string },
  ): void {
    this.notificationRepository
      .create({
        userId,
        title: payload.title,
        message: payload.message,
        type: payload.type ?? 'info',
      })
      .catch(() => undefined);
  }

  async markRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new NotFoundException('Notification not found');
    return this.notificationRepository.update(id, { isRead: true });
  }

  async markAllRead(userId: string) {
    return this.notificationRepository.markAllRead(userId);
  }

  async remove(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    return this.notificationRepository.delete(id);
  }
}
