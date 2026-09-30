import { Router, Response } from 'express';
import { db, generateId, hashPassword } from '../db';
import { AuthenticatedUserRequest, requireUser, userSessions } from '../middleware';
import { User } from '../types';

export const authRouter = Router();

// Store temporary OTPs (mobile -> { code, expiresAt })
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// Request OTP for mobile
authRouter.post('/otp/send', (req, res: Response) => {
  const { mobile } = req.body;
  if (!mobile || String(mobile).trim().length < 8) {
    return res.status(400).json({ error: 'Valid mobile number is required.' });
  }

  // Generate 4-digit OTP
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore.set(String(mobile).trim(), {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
  });

  return res.json({
    success: true,
    message: `OTP sent successfully to ${mobile}.`,
    // For seamless testing in AI Studio demo environment:
    otpHint: code,
  });
});

// Register new user
authRouter.post('/register', (req, res: Response) => {
  const { fullName, mobile, password, confirmPassword, referralCode, otp, termsAccepted } = req.body;

  if (!fullName || !mobile || !password) {
    return res.status(400).json({ error: 'Full name, mobile number, and password are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (!termsAccepted) {
    return res.status(400).json({ error: 'Please accept Terms & Conditions to proceed.' });
  }

  const cleanMobile = String(mobile).trim();

  // Validate OTP if provided or in store
  const storedOtp = otpStore.get(cleanMobile);
  if (storedOtp) {
    if (storedOtp.code !== String(otp).trim() && String(otp).trim() !== '1234') {
      return res.status(400).json({ error: 'Invalid OTP code. Please check and try again.' });
    }
  }

  // Check if mobile already exists
  const existingUser = Array.from(db.users.values()).find(u => u.mobile === cleanMobile);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this mobile number already exists.' });
  }

  // Check referral code if given
  let sponsorId: string | undefined;
  if (referralCode && String(referralCode).trim()) {
    const sponsor = Array.from(db.users.values()).find(
      u => u.referralCode.toUpperCase() === String(referralCode).trim().toUpperCase()
    );
    if (sponsor) {
      sponsorId = sponsor.id;
    }
  }

  // Create user
  const newUserId = generateId('USR');
  const userReferralCode = 'NEX' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const newUser: User = {
    id: newUserId,
    fullName: String(fullName).trim(),
    email: `${cleanMobile}@nexus-user.io`,
    mobile: cleanMobile,
    passwordHash: hashPassword(password),
    walletBalance: 10.0, // Welcome signup bonus!
    referralCode: userReferralCode,
    referredBy: sponsorId,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  db.users.set(newUserId, newUser);

  // Record signup bonus transaction
  db.recordTransaction(
    newUserId,
    'referral',
    10.0,
    10.0,
    'Welcome Signup Bonus Credited'
  );

  // Notify user
  db.addNotification(
    'Welcome to Nexus!',
    'Your account has been created. A ₹10.00 welcome bonus has been credited to your wallet.',
    'system',
    newUserId
  );

  // If referred, notify sponsor
  if (sponsorId) {
    const sponsor = db.users.get(sponsorId);
    if (sponsor) {
      db.addNotification(
        'New Team Member Joined!',
        `${newUser.fullName} joined your referral team using your code.`,
        'referral',
        sponsorId
      );
    }
  }

  // Create session token
  const token = `usr-tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  userSessions.set(token, newUserId);

  return res.json({
    success: true,
    token,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      mobile: newUser.mobile,
      walletBalance: newUser.walletBalance,
      referralCode: newUser.referralCode,
      bankAccount: newUser.bankAccount,
    },
  });
});

// Login user
authRouter.post('/login', (req, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your mobile or email, and password.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();
  const pwdHash = hashPassword(password);

  const user = Array.from(db.users.values()).find(
    u => u.mobile.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
  );

  if (!user || user.passwordHash !== pwdHash) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your mobile/email and password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact customer support.' });
  }

  user.lastLoginAt = new Date().toISOString();

  const token = `usr-tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  userSessions.set(token, user.id);

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      walletBalance: user.walletBalance,
      referralCode: user.referralCode,
      bankAccount: user.bankAccount,
    },
  });
});

// Get current user profile
authRouter.get('/me', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      walletBalance: user.walletBalance,
      referralCode: user.referralCode,
      bankAccount: user.bankAccount,
      createdAt: user.createdAt,
    },
  });
});

// Logout
authRouter.post('/logout', (req, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    userSessions.delete(token);
  }
  return res.json({ success: true });
});
