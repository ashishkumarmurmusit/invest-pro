import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedUserRequest, requireUser } from '../middleware';

export const transactionsRouter = Router();

transactionsRouter.get('/', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const { type, status } = req.query;

  let list = db.transactions.filter(t => t.userId === user.id);

  if (type && type !== 'all') {
    list = list.filter(t => t.type === type);
  }

  if (status && status !== 'all') {
    list = list.filter(t => t.status === status);
  }

  // Sort by date descending
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ transactions: list });
});
