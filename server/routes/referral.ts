import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedUserRequest, requireUser } from '../middleware';

export const referralRouter = Router();

referralRouter.get('/', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const allUsers = Array.from(db.users.values());

  // Level 1: Direct referrals
  const level1Users = allUsers.filter(u => u.referredBy === user.id);
  const level1Ids = new Set(level1Users.map(u => u.id));

  // Level 2: Reffered by Level 1
  const level2Users = allUsers.filter(u => u.referredBy && level1Ids.has(u.referredBy));
  const level2Ids = new Set(level2Users.map(u => u.id));

  // Level 3: Referred by Level 2
  const level3Users = allUsers.filter(u => u.referredBy && level2Ids.has(u.referredBy));

  // Total commission earned by this user
  const commissionTx = db.transactions.filter(
    t => t.userId === user.id && t.type === 'referral' && t.status === 'completed'
  );
  const totalCommission = commissionTx.reduce((sum, t) => sum + t.amount, 0);

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const referralLink = `${protocol}://${host}?ref=${user.referralCode}`;

  return res.json({
    referralCode: user.referralCode,
    referralLink,
    totalTeamSize: level1Users.length + level2Users.length + level3Users.length,
    totalCommission: Number(totalCommission.toFixed(2)),
    rates: db.settings.referralRates,
    level1: {
      count: level1Users.length,
      rate: db.settings.referralRates.level1,
      members: level1Users.map(u => ({
        id: u.id,
        name: u.fullName,
        mobile: u.mobile ? `${u.mobile.substring(0, 3)}••••${u.mobile.slice(-3)}` : '••••',
        joinedAt: u.createdAt,
      })),
    },
    level2: {
      count: level2Users.length,
      rate: db.settings.referralRates.level2,
      members: level2Users.map(u => ({
        id: u.id,
        name: u.fullName,
        joinedAt: u.createdAt,
      })),
    },
    level3: {
      count: level3Users.length,
      rate: db.settings.referralRates.level3,
      members: level3Users.map(u => ({
        id: u.id,
        name: u.fullName,
        joinedAt: u.createdAt,
      })),
    },
    recentEarnings: commissionTx.slice(0, 8),
  });
});
