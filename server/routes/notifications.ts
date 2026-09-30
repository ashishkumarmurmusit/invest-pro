import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedUserRequest, requireUser } from '../middleware';

export const notificationsRouter = Router();

notificationsRouter.get('/', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  // Get notifications for this user OR global system announcements (userId is undefined)
  const list = db.notifications.filter(n => !n.userId || n.userId === user.id);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = list.filter(n => !n.isRead).length;

  return res.json({
    notifications: list,
    unreadCount,
    announcementTicker: db.settings.announcementTicker,
  });
});

notificationsRouter.post('/read/:id', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  return res.json({ success: true });
});

notificationsRouter.post('/read-all', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  db.notifications.forEach(n => {
    if (!n.userId || n.userId === user.id) {
      n.isRead = true;
    }
  });
  return res.json({ success: true });
});
