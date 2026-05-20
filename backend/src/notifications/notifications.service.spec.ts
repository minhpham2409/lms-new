import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifRepo: {
    findByUser: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    markAllRead: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    notifRepo = {
      findByUser: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      markAllRead: jest.fn(),
      delete: jest.fn(),
    };
    service = new NotificationsService(notifRepo as any);
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all notifications for a user', async () => {
      notifRepo.findByUser.mockResolvedValue([
        { id: 'n1', title: 'Welcome' },
        { id: 'n2', title: 'New course' },
      ]);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(2);
    });
  });

  // ─── notifyUser ──────────────────────────────────────────────────────────────

  describe('notifyUser', () => {
    it('should fire and forget — not throw on repository errors', () => {
      notifRepo.create.mockRejectedValue(new Error('DB error'));

      // notifyUser is fire-and-forget (void), should not throw
      expect(() =>
        service.notifyUser('user-1', { title: 'Test', message: 'Hello' }),
      ).not.toThrow();
    });

    it('should call repository with correct payload', () => {
      notifRepo.create.mockResolvedValue({});

      service.notifyUser('user-1', { title: 'Test', message: 'Hello', type: 'warning' });

      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'Test',
          message: 'Hello',
          type: 'warning',
        }),
      );
    });

    it('should use default type "info" when type not specified', () => {
      notifRepo.create.mockResolvedValue({});

      service.notifyUser('user-1', { title: 'Test', message: 'Hello' });

      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'info' }),
      );
    });
  });

  // ─── markRead ───────────────────────────────────────────────────────────────

  describe('markRead', () => {
    it('should mark notification as read for owner', async () => {
      notifRepo.findById.mockResolvedValue({ id: 'n1', userId: 'user-1' });
      notifRepo.update.mockResolvedValue({ id: 'n1', isRead: true });

      const result = await service.markRead('n1', 'user-1');

      expect(result.isRead).toBe(true);
      expect(notifRepo.update).toHaveBeenCalledWith('n1', { isRead: true });
    });

    it('should throw NotFoundException when notification not found', async () => {
      notifRepo.findById.mockResolvedValue(null);

      await expect(service.markRead('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when notification belongs to another user', async () => {
      notifRepo.findById.mockResolvedValue({ id: 'n1', userId: 'other-user' });

      await expect(service.markRead('n1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── markAllRead ────────────────────────────────────────────────────────────

  describe('markAllRead', () => {
    it('should delegate to repository', async () => {
      notifRepo.markAllRead.mockResolvedValue({ count: 5 });

      await service.markAllRead('user-1');

      expect(notifRepo.markAllRead).toHaveBeenCalledWith('user-1');
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete notification for owner', async () => {
      notifRepo.findById.mockResolvedValue({ id: 'n1', userId: 'user-1' });
      notifRepo.delete.mockResolvedValue({ id: 'n1' });

      await service.remove('n1', 'user-1');

      expect(notifRepo.delete).toHaveBeenCalledWith('n1');
    });

    it('should throw NotFoundException when notification not found', async () => {
      notifRepo.findById.mockResolvedValue(null);

      await expect(service.remove('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when deleting another users notification', async () => {
      notifRepo.findById.mockResolvedValue({ id: 'n1', userId: 'other-user' });

      await expect(service.remove('n1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
