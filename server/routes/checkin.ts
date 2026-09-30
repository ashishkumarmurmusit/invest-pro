import { Router, Response } from 'express';
import { db, generateId } from '../db';
import { AuthenticatedUserRequest, requireUser } from '../middleware';
import { CheckinRecord } from '../types';

export const checkinRouter = Router();

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// Get check-in status and streak
checkinRouter.get('/status', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();

  const userCheckins = db.checkins.filter(c => c.userId === user.id);
  userCheckins.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todayRecord = userCheckins.find(c => c.date === todayStr);
  const alreadyClaimedToday = !!todayRecord;

  // Calculate current streak
  let currentStreak = 0;
  if (alreadyClaimedToday) {
    currentStreak = todayRecord.dayNumber;
  } else {
    const yesterdayRecord = userCheckins.find(c => c.date === yesterdayStr);
    if (yesterdayRecord) {
      currentStreak = yesterdayRecord.dayNumber % 7; // Ready for next day
    } else {
      currentStreak = 0; // Streak broken or first time
    }
  }

  const nextDayNumber = alreadyClaimedToday ? currentStreak : (currentStreak % 7) + 1;
  const rewardSchedule = db.settings.checkinRewards;

  return res.json({
    alreadyClaimedToday,
    currentStreak,
    nextDayNumber,
    rewardSchedule,
    history: userCheckins.slice(0, 10),
  });
});

// Claim daily check-in reward
checkinRouter.post('/claim', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();

  // Strict backend validation: Prevent duplicate claim today
  const existingToday = db.checkins.find(c => c.userId === user.id && c.date === todayStr);
  if (existingToday) {
    return res.status(400).json({
      error: 'You have already claimed today’s check-in reward. Come back tomorrow!',
    });
  }

  // Calculate streak day
  const userCheckins = db.checkins.filter(c => c.userId === user.id);
  userCheckins.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const yesterdayRecord = userCheckins.find(c => c.date === yesterdayStr);
  let streakDay = 1;
  if (yesterdayRecord) {
    streakDay = (yesterdayRecord.dayNumber % 7) + 1;
  }

  // Reward based on streak
  const rewardIndex = Math.min(streakDay - 1, db.settings.checkinRewards.length - 1);
  const rewardAmount = db.settings.checkinRewards[rewardIndex] || 1.0;

  const record: CheckinRecord = {
    id: generateId('CHK'),
    userId: user.id,
    date: todayStr,
    dayNumber: streakDay,
    rewardAmount,
    createdAt: new Date().toISOString(),
  };

  db.checkins.unshift(record);

  // Update wallet balance
  db.adjustUserBalance(user.id, rewardAmount);

  // Record ledger transaction
  const tx = db.recordTransaction(
    user.id,
    'checkin',
    rewardAmount,
    rewardAmount,
    `Daily Check-in Day ${streakDay} Streak Bonus`,
    0,
    record.id,
    'completed'
  );

  // Notify user
  db.addNotification(
    'Daily Check-in Claimed!',
    `+$${rewardAmount.toFixed(2)} added to your wallet for Day ${streakDay} streak!`,
    'checkin',
    user.id
  );

  return res.json({
    success: true,
    message: `Congratulations! You received $${rewardAmount.toFixed(2)} for Day ${streakDay} check-in!`,
    record,
    txId: tx.id,
    rewardAmount,
    dayNumber: streakDay,
    newBalance: user.walletBalance,
  });
});
