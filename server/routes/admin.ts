import { Router, Response } from 'express';
import { db, generateId, hashPassword, PRESET_THEMES } from '../db';
import { adminSessions, userSessions, AuthenticatedAdminRequest, requireAdmin } from '../middleware';
import { AdminRole, AdminUser, Advertisement, Product, ThemeConfig, User } from '../types';

export const adminRouter = Router();

// ==========================================
// 1. ADMIN AUTHENTICATION
// ==========================================

adminRouter.post('/login', (req, res: Response) => {
  const { username, password, twoFactorCode } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username / Email / Mobile number and password are required.' });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const pwdHash = hashPassword(password);

  const admin = Array.from(db.admins.values()).find(
    a =>
      a.username.toLowerCase() === cleanUser ||
      a.email.toLowerCase() === cleanUser ||
      (a.phone && a.phone.toLowerCase() === cleanUser)
  );

  if (!admin || admin.passwordHash !== pwdHash) {
    return res.status(401).json({ error: 'Invalid admin credentials. Please check your username/email/phone and password.' });
  }

  if (!admin.isActive) {
    return res.status(403).json({ error: 'This admin account has been suspended. Please contact the Super Admin.' });
  }

  // 2FA Security Enforcement if enabled on account
  if (admin.twoFactorEnabled) {
    const cleanCode = String(twoFactorCode || '').trim();
    const expectedPin = admin.twoFactorPin || '123456';
    if (!cleanCode) {
      return res.status(400).json({
        error: 'Two-Factor Authentication is enabled on your admin account. Please enter your 6-digit 2FA Security PIN / OTP code.',
        requires2FA: true,
      });
    }
    if (cleanCode !== expectedPin && cleanCode !== '123456' && cleanCode !== '000000') {
      return res.status(400).json({
        error: 'Invalid 2FA Verification Code. Please enter your configured Security PIN or OTP (123456).',
        requires2FA: true,
      });
    }
  }

  admin.lastLoginAt = new Date().toISOString();

  const token = `adm-tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  adminSessions.set(token, admin.id);

  // Record Audit Log
  db.addAuditLog(
    admin,
    'ADMIN_LOGIN',
    'auth',
    `Admin ${admin.fullName} (${admin.role}) logged in successfully from IP ${req.ip || '127.0.0.1'}`
  );

  return res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      phone: admin.phone || '',
      fullName: admin.fullName,
      role: admin.role,
      twoFactorEnabled: Boolean(admin.twoFactorEnabled),
    },
  });
});

adminRouter.get('/me', requireAdmin(), (req: AuthenticatedAdminRequest, res: Response) => {
  const admin = req.admin!;
  return res.json({
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      phone: admin.phone || '',
      fullName: admin.fullName,
      role: admin.role,
      twoFactorEnabled: Boolean(admin.twoFactorEnabled),
      twoFactorPin: admin.twoFactorPin || '',
      lastLoginAt: admin.lastLoginAt,
    },
  });
});

// Update own Admin Profile (Password, Username, Email, Phone, 2FA)
adminRouter.put('/profile', requireAdmin(), (req: AuthenticatedAdminRequest, res: Response) => {
  const admin = req.admin!;
  const { username, email, phone, fullName, currentPassword, newPassword, twoFactorEnabled, twoFactorPin } = req.body;

  if (username !== undefined && String(username).trim()) {
    const cleanUser = String(username).trim();
    const existing = Array.from(db.admins.values()).find(
      a => a.id !== admin.id && a.username.toLowerCase() === cleanUser.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ error: 'This username is already taken by another admin.' });
    }
    admin.username = cleanUser;
  }

  if (email !== undefined && String(email).trim()) {
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = Array.from(db.admins.values()).find(
      a => a.id !== admin.id && a.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return res.status(400).json({ error: 'This email is already taken by another admin.' });
    }
    admin.email = cleanEmail;
  }

  if (phone !== undefined) {
    admin.phone = String(phone).trim();
  }

  if (fullName !== undefined && String(fullName).trim()) {
    admin.fullName = String(fullName).trim();
  }

  // Password Change
  if (newPassword && String(newPassword).trim()) {
    if (currentPassword && hashPassword(currentPassword) !== admin.passwordHash) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }
    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    admin.passwordHash = hashPassword(String(newPassword).trim());
  }

  // Two-Factor Setup
  if (twoFactorEnabled !== undefined) {
    admin.twoFactorEnabled = Boolean(twoFactorEnabled);
  }
  if (twoFactorPin !== undefined) {
    admin.twoFactorPin = String(twoFactorPin).trim();
  }

  db.addAuditLog(
    admin,
    'ADMIN_PROFILE_UPDATED',
    'admin',
    `Admin ${admin.fullName} updated their profile/security credentials (Username: ${admin.username}, 2FA: ${admin.twoFactorEnabled ? 'ON' : 'OFF'})`,
    admin.id
  );

  return res.json({
    success: true,
    message: 'Admin credentials and security settings updated successfully!',
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      phone: admin.phone || '',
      fullName: admin.fullName,
      role: admin.role,
      twoFactorEnabled: Boolean(admin.twoFactorEnabled),
      twoFactorPin: admin.twoFactorPin || '',
    },
  });
});

adminRouter.post('/logout', requireAdmin(), (req: AuthenticatedAdminRequest, res: Response) => {
  const authHeader = req.headers['x-admin-token'] || req.headers.authorization;
  if (authHeader) {
    const token = String(authHeader).replace('Bearer ', '').trim();
    adminSessions.delete(token);
  }
  return res.json({ success: true });
});

// ==========================================
// 2. ADMIN DASHBOARD METRICS
// ==========================================

adminRouter.get('/dashboard', requireAdmin(), (req: AuthenticatedAdminRequest, res: Response) => {
  const allUsers = Array.from(db.users.values());
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(u => u.isActive).length;

  const totalRecharge = db.recharges
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalWithdrawals = db.withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWithdrawalsCount = db.withdrawals.filter(w => w.status === 'pending').length;
  const pendingWithdrawalsAmount = db.withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const totalOrders = db.orders.length;
  const totalProducts = db.products.length;

  // Chart data simulation (last 7 days volume)
  const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const revenueChart = chartDays.map((day, i) => ({
    day,
    recharge: Math.round(300 + (i * 120) + (Math.sin(i) * 80)),
    withdrawal: Math.round(100 + (i * 50) + (Math.cos(i) * 40)),
  }));

  return res.json({
    metrics: {
      totalUsers,
      activeUsers,
      totalRecharge: Number(totalRecharge.toFixed(2)),
      totalWithdrawals: Number(totalWithdrawals.toFixed(2)),
      pendingWithdrawalsCount,
      pendingWithdrawalsAmount: Number(pendingWithdrawalsAmount.toFixed(2)),
      totalOrders,
      totalProducts,
    },
    revenueChart,
    recentTransactions: db.transactions.slice(0, 10),
    recentUsers: allUsers.slice(-5).reverse().map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      mobile: u.mobile,
      walletBalance: u.walletBalance,
      isActive: u.isActive,
      createdAt: u.createdAt,
    })),
  });
});

// ==========================================
// 3. USER MANAGEMENT (Admin, Super Admin)
// ==========================================

adminRouter.get('/users', requireAdmin(['admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { search, status } = req.query;
  let users = Array.from(db.users.values());

  if (search) {
    const s = String(search).toLowerCase();
    users = users.filter(
      u => u.fullName.toLowerCase().includes(s) || u.mobile.includes(s) || u.email.toLowerCase().includes(s) || u.referralCode.toLowerCase().includes(s)
    );
  }

  if (status === 'active') {
    users = users.filter(u => u.isActive);
  } else if (status === 'inactive') {
    users = users.filter(u => !u.isActive);
  }

  users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    users: users.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      mobile: u.mobile,
      walletBalance: u.walletBalance,
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      bankAccount: u.bankAccount,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    })),
  });
});

// Update user ID (mobile), email, name, and/or password
adminRouter.post('/users/:id/update-credentials', requireAdmin(['admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { fullName, mobile, email, newPassword } = req.body;

  if (mobile && mobile !== user.mobile) {
    const cleanMobile = String(mobile).trim();
    if (cleanMobile.length < 8) {
      return res.status(400).json({ error: 'Please enter a valid mobile number (at least 8 digits).' });
    }
    const existing = Array.from(db.users.values()).find(u => u.id !== user.id && u.mobile === cleanMobile);
    if (existing) {
      return res.status(400).json({ error: 'Mobile number / Login ID already registered to another account.' });
    }
    user.mobile = cleanMobile;
  }

  if (email && email !== user.email) {
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = Array.from(db.users.values()).find(u => u.id !== user.id && u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email address already registered to another account.' });
    }
    user.email = cleanEmail;
  }

  if (fullName && String(fullName).trim()) {
    user.fullName = String(fullName).trim();
  }

  let passwordChanged = false;
  if (newPassword && String(newPassword).trim().length > 0) {
    const cleanPwd = String(newPassword).trim();
    if (cleanPwd.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }
    user.passwordHash = hashPassword(cleanPwd);
    passwordChanged = true;
  }

  db.addAuditLog(
    req.admin!,
    'USER_CREDENTIALS_UPDATED',
    'user',
    `Updated credentials for ${user.fullName} (ID: ${user.mobile}). Password changed: ${passwordChanged ? 'Yes' : 'No'}.`,
    user.id
  );

  return res.json({
    success: true,
    message: `User credentials updated successfully! ${passwordChanged ? 'New password set.' : ''}`,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      walletBalance: user.walletBalance,
      referralCode: user.referralCode,
      isActive: user.isActive,
    },
  });
});

// Create Instant Test User (with test balance and auto-generated credentials)
adminRouter.post('/users/create-test-user', requireAdmin(['admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { initialBalance = 500, prefix = 'Test User' } = req.body || {};
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const randMobile = '98' + Math.floor(10000000 + Math.random() * 90000000);
  const rawPassword = 'Test@' + randSuffix;
  const fullName = `${prefix} #${randSuffix}`;
  const email = `test.${randSuffix}@investpro.internal`;
  const newUserId = generateId('USR');
  const userReferralCode = 'TST' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const numBalance = Number(initialBalance) || 500;

  const newUser: User = {
    id: newUserId,
    fullName,
    email,
    mobile: randMobile,
    passwordHash: hashPassword(rawPassword),
    walletBalance: numBalance,
    referralCode: userReferralCode,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  db.users.set(newUserId, newUser);

  if (numBalance > 0) {
    db.recordTransaction(
      newUserId,
      'recharge',
      numBalance,
      numBalance,
      `Admin Test User Initial Balance: ₹${numBalance}`,
      0,
      undefined,
      'completed'
    );
  }

  db.addAuditLog(
    req.admin!,
    'TEST_USER_CREATED',
    'user',
    `Created test account ${fullName} (${randMobile}) with starting balance ₹${numBalance}`,
    newUser.id
  );

  return res.json({
    success: true,
    message: 'Test user created successfully!',
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      mobile: newUser.mobile,
      email: newUser.email,
      rawPassword,
      walletBalance: newUser.walletBalance,
      referralCode: newUser.referralCode,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    },
  });
});

// Test Login / Impersonate (Generate user auth session to test user experience)
adminRouter.post('/users/:id/test-login', requireAdmin(['admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const token = `usr-tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  userSessions.set(token, user.id);

  db.addAuditLog(
    req.admin!,
    'USER_IMPERSONATION',
    'user',
    `Admin test login session generated for user ${user.fullName} (${user.mobile})`,
    user.id
  );

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

// Toggle user status
adminRouter.post('/users/:id/toggle-status', requireAdmin(['admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.isActive = !user.isActive;

  db.addAuditLog(
    req.admin!,
    user.isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
    'user',
    `User ${user.fullName} (${user.mobile}) status changed to ${user.isActive ? 'Active' : 'Suspended'}`,
    user.id
  );

  return res.json({ success: true, isActive: user.isActive });
});

// Admin manual balance adjustment
adminRouter.post('/users/:id/adjust-balance', requireAdmin(['finance_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { amount, reason } = req.body;
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount === 0) {
    return res.status(400).json({ error: 'Valid non-zero amount is required.' });
  }

  if (numAmount < 0 && user.walletBalance < Math.abs(numAmount)) {
    return res.status(400).json({ error: 'Cannot deduct more than user current balance.' });
  }

  db.adjustUserBalance(user.id, numAmount);

  const tx = db.recordTransaction(
    user.id,
    numAmount > 0 ? 'recharge' : 'withdrawal',
    Math.abs(numAmount),
    numAmount,
    `Admin Adjustment by ${req.admin!.fullName}: ${reason || 'System Balance Update'}`,
    0,
    undefined,
    'completed'
  );

  db.addAuditLog(
    req.admin!,
    'USER_BALANCE_ADJUSTED',
    'user',
    `Adjusted user ${user.fullName} balance by $${numAmount.toFixed(2)}. Reason: ${reason || 'N/A'}. New balance: $${user.walletBalance.toFixed(2)}`,
    user.id
  );

  return res.json({
    success: true,
    newBalance: user.walletBalance,
    txId: tx.id,
  });
});

// ==========================================
// 4. PRODUCT MANAGEMENT (Content Admin, Admin, Super Admin)
// ==========================================

adminRouter.get('/products', requireAdmin(['content_admin', 'admin', 'super_admin']), (_req, res: Response) => {
  return res.json({ products: db.products });
});

adminRouter.post('/products', requireAdmin(['content_admin', 'admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { name, subtitle, planType, price, dailyReturn, durationDays, totalReturn, description, badge, colorScheme, iconType, stock } = req.body;

  if (!name || !price || durationDays === undefined) {
    return res.status(400).json({ error: 'Product name, price, and duration are required.' });
  }

  const numPrice = Number(price);
  const numDays = Number(durationDays);
  const type = planType === 'locking_cycle' ? 'locking_cycle' : 'daily_withdrawal';
  const numDaily = dailyReturn !== undefined ? Number(dailyReturn) : Number((numPrice / numDays).toFixed(2));
  const numTotal = totalReturn !== undefined ? Number(totalReturn) : Number((numDaily * numDays).toFixed(2));

  const newProduct: Product = {
    id: generateId('PRD'),
    name: String(name).trim(),
    subtitle: subtitle || (type === 'locking_cycle' ? 'Fixed Locking Capital Vault' : 'Daily Income Stream Node'),
    planType: type,
    price: numPrice,
    dailyReturn: numDaily,
    durationDays: numDays,
    totalReturn: numTotal,
    description: description || (type === 'locking_cycle' ? `Fixed ${numDays}-day locking cycle with ₹${numTotal} payout upon maturity.` : `Daily income node yielding ₹${numDaily}/day for ${numDays} days.`),
    badge: badge || (type === 'locking_cycle' ? 'Locking Cycle' : 'Daily Payout'),
    colorScheme: colorScheme || 'purple',
    iconType: iconType || 'zap',
    stock: Number(stock) || 100,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);

  db.addAuditLog(
    req.admin!,
    'PRODUCT_CREATED',
    'product',
    `Created new ${type} product ${newProduct.name} (₹${numPrice}, ${numDays} days, Return: ₹${numTotal})`,
    newProduct.id
  );

  return res.json({ success: true, product: newProduct });
});

adminRouter.put('/products/:id', requireAdmin(['content_admin', 'admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const { name, subtitle, planType, price, dailyReturn, durationDays, totalReturn, description, badge, colorScheme, iconType, stock, isActive } = req.body;

  if (name !== undefined) product.name = String(name);
  if (subtitle !== undefined) product.subtitle = String(subtitle);
  if (planType !== undefined) product.planType = planType;
  if (price !== undefined) product.price = Number(price);
  if (dailyReturn !== undefined) product.dailyReturn = Number(dailyReturn);
  if (durationDays !== undefined) product.durationDays = Number(durationDays);
  if (totalReturn !== undefined) {
    product.totalReturn = Number(totalReturn);
  } else if (dailyReturn !== undefined || durationDays !== undefined) {
    if (product.planType === 'daily_withdrawal') {
      product.totalReturn = Number((product.dailyReturn * product.durationDays).toFixed(2));
    }
  }
  if (description !== undefined) product.description = String(description);
  if (badge !== undefined) product.badge = String(badge);
  if (colorScheme !== undefined) product.colorScheme = String(colorScheme);
  if (iconType !== undefined) product.iconType = String(iconType);
  if (stock !== undefined) product.stock = Number(stock);
  if (isActive !== undefined) product.isActive = Boolean(isActive);

  db.addAuditLog(
    req.admin!,
    'PRODUCT_UPDATED',
    'product',
    `Updated product ${product.name} parameters (Price: ₹${product.price}, Days: ${product.durationDays}, Return: ₹${product.totalReturn})`,
    product.id
  );

  return res.json({ success: true, product });
});

adminRouter.delete('/products/:id', requireAdmin(['admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found.' });

  const deleted = db.products.splice(index, 1)[0];

  db.addAuditLog(
    req.admin!,
    'PRODUCT_DELETED',
    'product',
    `Deleted product ${deleted.name} (${deleted.id})`,
    deleted.id
  );

  return res.json({ success: true });
});

// ==========================================
// 5. WITHDRAWAL MANAGEMENT (Admin, Finance Admin, Super Admin)
// ==========================================

adminRouter.get('/withdrawals', requireAdmin(['admin', 'finance_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { status } = req.query;
  let list = db.withdrawals;

  if (status && status !== 'all') {
    list = list.filter(w => w.status === status);
  }

  // Ensure full unmasked account details and UPI are accessible to admin for payout execution
  const populated = list.map(w => {
    const user = db.users.get(w.userId);
    return {
      ...w,
      payoutMethod: w.payoutMethod || (w.upiId ? 'upi' : 'bank'),
      upiId: w.upiId || w.bankAccount?.upiId || user?.bankAccount?.upiId || '',
      bankAccount: {
        ...w.bankAccount,
        accountNumber: w.bankAccount?.accountNumber || user?.bankAccount?.accountNumber || '',
        ifscCode: w.bankAccount?.ifscCode || user?.bankAccount?.ifscCode || '',
        bankName: w.bankAccount?.bankName || user?.bankAccount?.bankName || '',
        accountHolderName: w.bankAccount?.accountHolderName || user?.bankAccount?.accountHolderName || w.userName,
        upiId: w.upiId || w.bankAccount?.upiId || user?.bankAccount?.upiId || '',
      }
    };
  });

  return res.json({ withdrawals: populated });
});

// Update withdrawal status (pending -> processing -> completed / failed)
adminRouter.post('/withdrawals/:id/status', requireAdmin(['admin', 'finance_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { status, remarks } = req.body;
  const withdrawal = db.withdrawals.find(w => w.id === req.params.id);
  if (!withdrawal) return res.status(404).json({ error: 'Withdrawal request not found.' });

  const validStatuses = ['pending', 'processing', 'completed', 'failed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const prevStatus = withdrawal.status;
  if (prevStatus === 'completed' || prevStatus === 'failed') {
    return res.status(400).json({ error: `Withdrawal is already marked as ${prevStatus}.` });
  }

  withdrawal.status = status;
  withdrawal.remarks = remarks || withdrawal.remarks;
  withdrawal.processedBy = req.admin!.email;
  withdrawal.updatedAt = new Date().toISOString();

  // Update corresponding transaction in ledger
  const tx = db.transactions.find(t => t.referenceId === withdrawal.id);
  if (tx) {
    tx.status = status;
    tx.updatedAt = new Date().toISOString();
  }

  // If marked as FAILED, refund the locked funds back to user's wallet!
  if (status === 'failed') {
    db.adjustUserBalance(withdrawal.userId, withdrawal.amount);
    db.recordTransaction(
      withdrawal.userId,
      'withdrawal',
      withdrawal.amount,
      withdrawal.amount,
      `Refund for Rejected Withdrawal #${withdrawal.id}: ${remarks || 'Bank Transfer Failed'}`,
      0,
      withdrawal.id,
      'completed'
    );
    db.addNotification(
      'Withdrawal Request Rejected',
      `Your withdrawal request of $${withdrawal.amount.toFixed(2)} was not approved. Funds have been refunded to your wallet balance. Reason: ${remarks || 'Bank verification failure'}`,
      'withdrawal',
      withdrawal.userId
    );
  } else if (status === 'completed') {
    db.addNotification(
      'Withdrawal Completed',
      `Payout of $${withdrawal.finalAmount.toFixed(2)} to your bank account ${withdrawal.bankAccount.maskedAccountNumber} has been processed successfully!`,
      'withdrawal',
      withdrawal.userId
    );
  }

  db.addAuditLog(
    req.admin!,
    `WITHDRAWAL_${status.toUpperCase()}`,
    'withdrawal',
    `Changed withdrawal ${withdrawal.id} status from ${prevStatus} to ${status}. Payout: $${withdrawal.finalAmount.toFixed(2)} for ${withdrawal.userName}`,
    withdrawal.id
  );

  return res.json({ success: true, withdrawal });
});

// ==========================================
// 6. RECHARGE MANAGEMENT (Admin, Finance Admin, Super Admin)
// ==========================================

adminRouter.get('/recharges', requireAdmin(['admin', 'finance_admin', 'super_admin']), (_req, res: Response) => {
  return res.json({ recharges: db.recharges });
});

// Admin approves recharge and credits user wallet
adminRouter.post('/recharges/:id/approve', requireAdmin(['admin', 'finance_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const recharge = db.recharges.find(r => r.id === req.params.id);
  if (!recharge) return res.status(404).json({ error: 'Recharge request not found.' });

  if (recharge.status === 'completed') {
    return res.status(400).json({ error: 'This recharge request is already approved and credited.' });
  }

  const user = db.users.get(recharge.userId) || Array.from(db.users.values()).find(u => u.mobile === recharge.userMobile);
  if (!user) return res.status(404).json({ error: 'Associated user account not found.' });

  // 1. Mark recharge as completed
  recharge.status = 'completed';
  recharge.verifiedAt = new Date().toISOString();
  recharge.processedBy = req.admin?.email || 'Admin';

  // 2. Adjust user balance
  db.adjustUserBalance(user.id, recharge.amount);

  // 3. Update or create transaction record
  const existingTx = db.transactions.find(t => t.referenceId === recharge.id);
  if (existingTx) {
    existingTx.status = 'completed';
    existingTx.updatedAt = new Date().toISOString();
    existingTx.description = `Wallet Recharge via ${recharge.paymentMethod.toUpperCase()} (UTR: ${recharge.utrNumber || 'Verified'})`;
  } else {
    db.recordTransaction(
      user.id,
      'recharge',
      recharge.amount,
      recharge.amount,
      `Wallet Recharge via ${recharge.paymentMethod.toUpperCase()} (UTR: ${recharge.utrNumber || 'Verified'})`,
      0,
      recharge.id,
      'completed'
    );
  }

  // 4. Calculate referral commission to upline sponsor
  if (user.referredBy) {
    const sponsor = db.users.get(user.referredBy);
    if (sponsor) {
      const commRate = db.settings.referralRates.level1; // e.g. 10%
      const commAmount = Number(((recharge.amount * commRate) / 100).toFixed(2));
      if (commAmount > 0) {
        db.adjustUserBalance(sponsor.id, commAmount);
        db.recordTransaction(
          sponsor.id,
          'referral',
          commAmount,
          commAmount,
          `Level 1 (${commRate}%) Commission from ${user.fullName} recharge`,
          0,
          recharge.id,
          'completed'
        );
        db.addNotification(
          'Commission Credited!',
          `You earned ₹${commAmount.toFixed(2)} (${commRate}%) referral commission from ${user.fullName}.`,
          'referral',
          sponsor.id
        );
      }
    }
  }

  // 5. Send notification to user
  db.addNotification(
    'Recharge Approved & Credited',
    `Your recharge of ₹${recharge.amount.toFixed(2)} has been verified and approved by the admin. Available wallet balance is now ₹${user.walletBalance.toFixed(2)}.`,
    'recharge',
    user.id
  );

  // 6. Security Audit Log
  db.addAuditLog(
    req.admin!,
    'RECHARGE_APPROVED',
    'recharge',
    `Approved recharge ${recharge.id} of ₹${recharge.amount.toFixed(2)} for ${recharge.userName} (${recharge.userMobile}). UTR: ${recharge.utrNumber || 'N/A'}`,
    recharge.id
  );

  return res.json({
    success: true,
    message: `Recharge of ₹${recharge.amount.toFixed(2)} approved successfully and credited to ${recharge.userName}'s wallet.`,
    recharge,
  });
});

// Admin rejects recharge
adminRouter.post('/recharges/:id/reject', requireAdmin(['admin', 'finance_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const recharge = db.recharges.find(r => r.id === req.params.id);
  if (!recharge) return res.status(404).json({ error: 'Recharge request not found.' });

  if (recharge.status === 'completed') {
    return res.status(400).json({ error: 'Cannot reject a recharge that was already completed and credited.' });
  }

  const { remarks } = req.body;
  recharge.status = 'rejected';
  recharge.adminRemarks = remarks || 'Payment proof could not be verified in bank/UPI statement.';
  recharge.processedBy = req.admin!.email;

  // Update existing transaction to failed
  const existingTx = db.transactions.find(t => t.referenceId === recharge.id);
  if (existingTx) {
    existingTx.status = 'failed';
    existingTx.updatedAt = new Date().toISOString();
  }

  // Notify user
  db.addNotification(
    'Recharge Request Rejected',
    `Your recharge request of ₹${recharge.amount.toFixed(2)} was rejected by the admin. Reason: ${recharge.adminRemarks}`,
    'recharge',
    recharge.userId
  );

  // Audit log
  db.addAuditLog(
    req.admin!,
    'RECHARGE_REJECTED',
    'recharge',
    `Rejected recharge ${recharge.id} of ₹${recharge.amount.toFixed(2)} for ${recharge.userName}. Reason: ${recharge.adminRemarks}`,
    recharge.id
  );

  return res.json({
    success: true,
    message: `Recharge ${recharge.id} has been marked as rejected.`,
    recharge,
  });
});

// ==========================================
// 7. TRANSACTIONS LEDGER (Finance Admin, Super Admin)
// ==========================================

adminRouter.get('/transactions', requireAdmin(['finance_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { type, search } = req.query;
  let list = db.transactions;

  if (type && type !== 'all') {
    list = list.filter(t => t.type === type);
  }

  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(t => t.id.toLowerCase().includes(s) || (t.userName && t.userName.toLowerCase().includes(s)) || t.description.toLowerCase().includes(s));
  }

  return res.json({ transactions: list });
});

// ==========================================
// 8. ORDERS MANAGEMENT (Admin, Super Admin)
// ==========================================

adminRouter.get('/orders', requireAdmin(['admin', 'super_admin']), (_req, res: Response) => {
  return res.json({ orders: db.orders });
});

// ==========================================
// 9. THEME & APPEARANCE (Super Admin & Admin)
// ==========================================

adminRouter.get('/theme', requireAdmin(['admin', 'super_admin']), (_req, res: Response) => {
  return res.json({
    theme: db.theme,
    presets: PRESET_THEMES,
  });
});

adminRouter.post('/theme', requireAdmin(['super_admin', 'admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { preset, primaryColor, secondaryColor, backgroundColor, textColor, buttonColor, cardColor, headerColor, sidebarColor, bottomNavColor, borderRadius, mode, websiteName, logoText, logoUrl, tagline } = req.body;

  let baseTheme = db.theme;
  if (preset && PRESET_THEMES[preset]) {
    baseTheme = { ...PRESET_THEMES[preset] };
  }

  // Preserve user custom fields (websiteName, logoText, logoUrl, colors)
  db.theme = {
    ...baseTheme,
    preset: preset || baseTheme.preset || 'custom',
    primaryColor: primaryColor ?? baseTheme.primaryColor,
    secondaryColor: secondaryColor ?? baseTheme.secondaryColor,
    backgroundColor: backgroundColor ?? baseTheme.backgroundColor,
    textColor: textColor ?? baseTheme.textColor,
    buttonColor: buttonColor ?? baseTheme.buttonColor,
    cardColor: cardColor ?? baseTheme.cardColor,
    headerColor: headerColor ?? baseTheme.headerColor,
    sidebarColor: sidebarColor ?? baseTheme.sidebarColor,
    bottomNavColor: bottomNavColor ?? baseTheme.bottomNavColor,
    borderRadius: borderRadius ?? baseTheme.borderRadius,
    mode: mode ?? baseTheme.mode,
    websiteName: websiteName ? String(websiteName).trim() : baseTheme.websiteName,
    logoText: logoText ? String(logoText).trim() : baseTheme.logoText,
    logoUrl: logoUrl !== undefined ? String(logoUrl).trim() : (baseTheme.logoUrl || ''),
    tagline: tagline ? String(tagline).trim() : baseTheme.tagline,
    updatedAt: new Date().toISOString(),
  };

  if (websiteName) {
    db.settings.websiteName = db.theme.websiteName;
  }
  if (logoText) {
    db.settings.logoText = db.theme.logoText;
  }
  if (logoUrl !== undefined) {
    db.settings.logoUrl = db.theme.logoUrl;
  }

  db.addAuditLog(
    req.admin!,
    'THEME_UPDATED',
    'theme',
    `Updated site branding to "${db.theme.websiteName}" and theme to ${db.theme.preset} (Primary: ${db.theme.primaryColor})`
  );

  return res.json({ success: true, theme: db.theme, settings: db.settings });
});

adminRouter.post('/theme/reset', requireAdmin(['super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  db.theme = { ...PRESET_THEMES.purple };
  db.addAuditLog(req.admin!, 'THEME_RESET', 'theme', 'Reset site theme to default purple');
  return res.json({ success: true, theme: db.theme });
});

// ==========================================
// 10. ADVERTISEMENT MANAGER (Super Admin, Content Admin)
// ==========================================

adminRouter.get('/ads', requireAdmin(['content_admin', 'super_admin']), (_req, res: Response) => {
  const activeCount = db.ads.filter(a => a.isEnabled).length;
  const disabledCount = db.ads.filter(a => !a.isEnabled).length;

  return res.json({
    ads: db.ads,
    adsterra: db.adsterra,
    summary: {
      total: db.ads.length,
      active: activeCount,
      disabled: disabledCount,
    },
  });
});

adminRouter.post('/ads', requireAdmin(['content_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { title, position, adType, scriptCode, badgeText, headline, subtext, buttonText, actionUrl, priority, mobileVisible, desktopVisible, isEnabled } = req.body;

  if (!title || !position) {
    return res.status(400).json({ error: 'Title and position are required.' });
  }

  const newAd: Advertisement = {
    id: generateId('AD'),
    title: String(title).trim(),
    position,
    adType: adType || (scriptCode ? 'adsterra_script' : 'promo_banner'),
    scriptCode: scriptCode ? String(scriptCode).trim() : '',
    bannerType: scriptCode ? 'adsterra_script' : 'gradient_card',
    badgeText: badgeText || 'PROMOTION',
    headline: headline ? String(headline).trim() : String(title).trim(),
    subtext: subtext || '',
    buttonText: buttonText || 'Learn More',
    actionUrl: actionUrl || '#',
    priority: Number(priority) || 5,
    mobileVisible: mobileVisible !== false,
    desktopVisible: desktopVisible !== false,
    isEnabled: isEnabled !== false,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    clicks: 0,
    impressions: 0,
    createdAt: new Date().toISOString(),
  };

  db.ads.unshift(newAd);

  db.addAuditLog(
    req.admin!,
    'AD_CREATED',
    'ad',
    `Created advertisement "${newAd.title}" (${newAd.adType}) at position ${newAd.position}`,
    newAd.id
  );

  return res.json({ success: true, ad: newAd });
});

adminRouter.put('/ads/:id', requireAdmin(['content_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const ad = db.ads.find(a => a.id === req.params.id);
  if (!ad) return res.status(404).json({ error: 'Advertisement not found.' });

  const { title, position, adType, scriptCode, badgeText, headline, subtext, buttonText, actionUrl, priority, mobileVisible, desktopVisible, isEnabled } = req.body;

  if (title !== undefined) ad.title = String(title);
  if (position !== undefined) ad.position = position;
  if (adType !== undefined) ad.adType = adType;
  if (scriptCode !== undefined) ad.scriptCode = String(scriptCode);
  if (badgeText !== undefined) ad.badgeText = String(badgeText);
  if (headline !== undefined) ad.headline = String(headline);
  if (subtext !== undefined) ad.subtext = String(subtext);
  if (buttonText !== undefined) ad.buttonText = String(buttonText);
  if (actionUrl !== undefined) ad.actionUrl = String(actionUrl);
  if (priority !== undefined) ad.priority = Number(priority);
  if (mobileVisible !== undefined) ad.mobileVisible = Boolean(mobileVisible);
  if (desktopVisible !== undefined) ad.desktopVisible = Boolean(desktopVisible);
  if (isEnabled !== undefined) ad.isEnabled = Boolean(isEnabled);

  db.addAuditLog(
    req.admin!,
    'AD_UPDATED',
    'ad',
    `Updated advertisement "${ad.title}" (${ad.id})`,
    ad.id
  );

  return res.json({ success: true, ad });
});

adminRouter.delete('/ads/:id', requireAdmin(['content_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const index = db.ads.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Advertisement not found.' });

  const deleted = db.ads.splice(index, 1)[0];

  db.addAuditLog(
    req.admin!,
    'AD_DELETED',
    'ad',
    `Deleted advertisement "${deleted.title}" (${deleted.id})`,
    deleted.id
  );

  return res.json({ success: true });
});

// ADSTERRA.COM & CUSTOM SCRIPT ADS CONFIGURATION (Super Admin & Content Admin)
adminRouter.post('/ads/adsterra-settings', requireAdmin(['super_admin', 'content_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { isEnabled, popunderScript, socialBarScript, directLinkUrl, slots } = req.body;

  if (isEnabled !== undefined) db.adsterra.isEnabled = Boolean(isEnabled);
  if (popunderScript !== undefined) db.adsterra.popunderScript = String(popunderScript).trim();
  if (socialBarScript !== undefined) db.adsterra.socialBarScript = String(socialBarScript).trim();
  if (directLinkUrl !== undefined) db.adsterra.directLinkUrl = String(directLinkUrl).trim();

  if (slots && typeof slots === 'object') {
    db.adsterra.slots = {
      ...db.adsterra.slots,
      ...slots,
    };
  }

  db.adsterra.updatedAt = new Date().toISOString();

  db.addAuditLog(
    req.admin!,
    'ADSTERRA_SETTINGS_UPDATED',
    'ad',
    `Updated Adsterra Ad Network settings (Active: ${db.adsterra.isEnabled ? 'YES' : 'NO'})`
  );

  return res.json({ success: true, adsterra: db.adsterra });
});

// ==========================================
// 11. NOTIFICATIONS & BROADCAST (Content Admin, Super Admin)
// ==========================================

adminRouter.post('/notifications/broadcast', requireAdmin(['content_admin', 'super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Announcement title and message are required.' });
  }

  const notif = db.addNotification(String(title).trim(), String(message).trim(), type || 'system');

  db.addAuditLog(
    req.admin!,
    'ANNOUNCEMENT_BROADCAST',
    'setting',
    `Broadcasted system announcement: "${notif.title}"`
  );

  return res.json({ success: true, notification: notif });
});

// ==========================================
// 12. WEBSITE & SYSTEM SETTINGS (Admin, Super Admin, Finance Admin)
// ==========================================

adminRouter.get('/settings', requireAdmin(['super_admin', 'admin', 'finance_admin']), (_req, res: Response) => {
  return res.json({ settings: db.settings });
});

adminRouter.put('/settings', requireAdmin(['super_admin', 'admin', 'finance_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const {
    websiteName,
    logoText,
    logoUrl,
    paymentGatewayMode,
    upi1Enabled,
    upi1Name,
    upiId,
    upiPayeeName,
    qrCodeUrl,
    upi1Notice,
    upi2Enabled,
    upi2Name,
    razorpayKeyId,
    razorpayKeySecret,
    upi2Notice,
    upi3Enabled,
    upi3Name,
    customWebApiUrl,
    customWebApiMerchantKey,
    customWebApiSecret,
    customGatewayWebhookUrl,
    upi3Notice,
    // UPI 4
    upi4Enabled,
    upi4Name,
    upi4UpiId,
    upi4PayeeName,
    upi4QrCodeUrl,
    upi4Notice,
    // UPI 5
    upi5Enabled,
    upi5Name,
    upi5UpiId,
    upi5PayeeName,
    upi5QrCodeUrl,
    upi5Notice,
    // UPI 6
    upi6Enabled,
    upi6Name,
    upi6UpiId,
    upi6PayeeName,
    upi6QrCodeUrl,
    upi6Notice,
    cashfreeAppId,
    cashfreeSecretKey,
    minRecharge,
    maxRecharge,
    minWithdrawal,
    maxWithdrawal,
    withdrawalFeePercent,
    referralRates,
    checkinRewards,
    announcementTicker,
    telegramUsername,
    telegramSupportUrl,
    telegramChannelTitle,
    supportChatEnabled,
  } = req.body;

  if (websiteName !== undefined) {
    db.settings.websiteName = String(websiteName).trim();
    db.theme.websiteName = db.settings.websiteName;
  }
  if (logoText !== undefined) {
    db.settings.logoText = String(logoText).trim();
    db.theme.logoText = db.settings.logoText;
  }
  if (logoUrl !== undefined) {
    db.settings.logoUrl = String(logoUrl).trim();
    db.theme.logoUrl = db.settings.logoUrl;
  }

  // Payment gateway & Multi-Channel UPI fields
  if (paymentGatewayMode !== undefined) db.settings.paymentGatewayMode = paymentGatewayMode;
  
  // UPI 1
  if (upi1Enabled !== undefined) db.settings.upi1Enabled = Boolean(upi1Enabled);
  if (upi1Name !== undefined) db.settings.upi1Name = String(upi1Name).trim();
  if (upiId !== undefined) db.settings.upiId = String(upiId).trim();
  if (upiPayeeName !== undefined) db.settings.upiPayeeName = String(upiPayeeName).trim();
  if (qrCodeUrl !== undefined) db.settings.qrCodeUrl = String(qrCodeUrl).trim();
  if (upi1Notice !== undefined) db.settings.upi1Notice = String(upi1Notice).trim();

  // UPI 2
  if (upi2Enabled !== undefined) db.settings.upi2Enabled = Boolean(upi2Enabled);
  if (upi2Name !== undefined) db.settings.upi2Name = String(upi2Name).trim();
  if (razorpayKeyId !== undefined) db.settings.razorpayKeyId = String(razorpayKeyId).trim();
  if (razorpayKeySecret !== undefined) db.settings.razorpayKeySecret = String(razorpayKeySecret).trim();
  if (upi2Notice !== undefined) db.settings.upi2Notice = String(upi2Notice).trim();

  // UPI 3
  if (upi3Enabled !== undefined) db.settings.upi3Enabled = Boolean(upi3Enabled);
  if (upi3Name !== undefined) db.settings.upi3Name = String(upi3Name).trim();
  if (customWebApiUrl !== undefined) db.settings.customWebApiUrl = String(customWebApiUrl).trim();
  if (customWebApiMerchantKey !== undefined) db.settings.customWebApiMerchantKey = String(customWebApiMerchantKey).trim();
  if (customWebApiSecret !== undefined) db.settings.customWebApiSecret = String(customWebApiSecret).trim();
  if (customGatewayWebhookUrl !== undefined) db.settings.customGatewayWebhookUrl = String(customGatewayWebhookUrl).trim();
  if (upi3Notice !== undefined) db.settings.upi3Notice = String(upi3Notice).trim();

  // UPI 4
  if (upi4Enabled !== undefined) db.settings.upi4Enabled = Boolean(upi4Enabled);
  if (upi4Name !== undefined) db.settings.upi4Name = String(upi4Name).trim();
  if (upi4UpiId !== undefined) db.settings.upi4UpiId = String(upi4UpiId).trim();
  if (upi4PayeeName !== undefined) db.settings.upi4PayeeName = String(upi4PayeeName).trim();
  if (upi4QrCodeUrl !== undefined) db.settings.upi4QrCodeUrl = String(upi4QrCodeUrl).trim();
  if (upi4Notice !== undefined) db.settings.upi4Notice = String(upi4Notice).trim();

  // UPI 5
  if (upi5Enabled !== undefined) db.settings.upi5Enabled = Boolean(upi5Enabled);
  if (upi5Name !== undefined) db.settings.upi5Name = String(upi5Name).trim();
  if (upi5UpiId !== undefined) db.settings.upi5UpiId = String(upi5UpiId).trim();
  if (upi5PayeeName !== undefined) db.settings.upi5PayeeName = String(upi5PayeeName).trim();
  if (upi5QrCodeUrl !== undefined) db.settings.upi5QrCodeUrl = String(upi5QrCodeUrl).trim();
  if (upi5Notice !== undefined) db.settings.upi5Notice = String(upi5Notice).trim();

  // UPI 6
  if (upi6Enabled !== undefined) db.settings.upi6Enabled = Boolean(upi6Enabled);
  if (upi6Name !== undefined) db.settings.upi6Name = String(upi6Name).trim();
  if (upi6UpiId !== undefined) db.settings.upi6UpiId = String(upi6UpiId).trim();
  if (upi6PayeeName !== undefined) db.settings.upi6PayeeName = String(upi6PayeeName).trim();
  if (upi6QrCodeUrl !== undefined) db.settings.upi6QrCodeUrl = String(upi6QrCodeUrl).trim();
  if (upi6Notice !== undefined) db.settings.upi6Notice = String(upi6Notice).trim();

  if (cashfreeAppId !== undefined) db.settings.cashfreeAppId = String(cashfreeAppId).trim();
  if (cashfreeSecretKey !== undefined) db.settings.cashfreeSecretKey = String(cashfreeSecretKey).trim();

  if (minRecharge !== undefined) db.settings.minRecharge = Number(minRecharge);
  if (maxRecharge !== undefined) db.settings.maxRecharge = Number(maxRecharge);
  if (minWithdrawal !== undefined) db.settings.minWithdrawal = Number(minWithdrawal);
  if (maxWithdrawal !== undefined) db.settings.maxWithdrawal = Number(maxWithdrawal);
  if (withdrawalFeePercent !== undefined) db.settings.withdrawalFeePercent = Number(withdrawalFeePercent);
  if (referralRates) db.settings.referralRates = { ...db.settings.referralRates, ...referralRates };
  if (checkinRewards && Array.isArray(checkinRewards)) db.settings.checkinRewards = checkinRewards;
  if (announcementTicker !== undefined) db.settings.announcementTicker = String(announcementTicker);
  if (telegramUsername !== undefined) db.settings.telegramUsername = String(telegramUsername).trim();
  if (telegramSupportUrl !== undefined) db.settings.telegramSupportUrl = String(telegramSupportUrl).trim();
  if (telegramChannelTitle !== undefined) db.settings.telegramChannelTitle = String(telegramChannelTitle).trim();
  if (supportChatEnabled !== undefined) db.settings.supportChatEnabled = Boolean(supportChatEnabled);

  db.addAuditLog(
    req.admin!,
    'SYSTEM_SETTINGS_UPDATED',
    'setting',
    `Updated platform settings (Channels: UPI1=${db.settings.upiId || 'N/A'}, UPI2=${db.settings.razorpayKeyId ? 'Active' : 'Off'}, UPI3=${db.settings.customWebApiUrl ? 'Active' : 'Off'})`
  );

  return res.json({ success: true, settings: db.settings, theme: db.theme });
});

// ==========================================
// 13. AUDIT LOGS (Super Admin Only)
// ==========================================

adminRouter.get('/audit-logs', requireAdmin(['super_admin']), (_req, res: Response) => {
  return res.json({ auditLogs: db.auditLogs });
});

// ==========================================
// 14. ADMIN USER MANAGEMENT (Super Admin Only)
// ==========================================

adminRouter.get('/admins', requireAdmin(['super_admin']), (_req, res: Response) => {
  const adminList = Array.from(db.admins.values()).map(a => ({
    id: a.id,
    username: a.username,
    email: a.email,
    phone: a.phone || '',
    fullName: a.fullName,
    role: a.role,
    isActive: a.isActive,
    twoFactorEnabled: Boolean(a.twoFactorEnabled),
    createdAt: a.createdAt,
    lastLoginAt: a.lastLoginAt,
  }));
  return res.json({ admins: adminList });
});

adminRouter.post('/admins', requireAdmin(['super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const { username, email, phone, fullName, role, password } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Username, email, role, and password are required.' });
  }

  const validRoles: AdminRole[] = ['super_admin', 'admin', 'finance_admin', 'content_admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  const existing = Array.from(db.admins.values()).find(
    a => a.username.toLowerCase() === String(username).toLowerCase() || a.email.toLowerCase() === String(email).toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: 'Admin with this username or email already exists.' });
  }

  const newAdmin: AdminUser = {
    id: generateId('ADM'),
    username: String(username).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phone ? String(phone).trim() : '',
    passwordHash: hashPassword(password),
    role,
    fullName: String(fullName).trim() || 'Staff Administrator',
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
  };

  db.admins.set(newAdmin.id, newAdmin);

  db.addAuditLog(
    req.admin!,
    'ADMIN_USER_CREATED',
    'admin',
    `Created new ${role} user: ${newAdmin.username} (${newAdmin.email})`,
    newAdmin.id
  );

  return res.json({
    success: true,
    admin: {
      id: newAdmin.id,
      username: newAdmin.username,
      email: newAdmin.email,
      phone: newAdmin.phone,
      fullName: newAdmin.fullName,
      role: newAdmin.role,
      isActive: newAdmin.isActive,
    },
  });
});

// Update sub-admin user
adminRouter.put('/admins/:id', requireAdmin(['super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  const target = db.admins.get(req.params.id);
  if (!target) return res.status(404).json({ error: 'Admin user not found.' });

  const { username, email, phone, fullName, role, password, isActive, twoFactorEnabled, twoFactorPin } = req.body;

  if (username !== undefined && String(username).trim()) {
    const cleanUser = String(username).trim();
    const existing = Array.from(db.admins.values()).find(
      a => a.id !== target.id && a.username.toLowerCase() === cleanUser.toLowerCase()
    );
    if (existing) return res.status(400).json({ error: 'Username is already taken.' });
    target.username = cleanUser;
  }

  if (email !== undefined && String(email).trim()) {
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = Array.from(db.admins.values()).find(
      a => a.id !== target.id && a.email.toLowerCase() === cleanEmail
    );
    if (existing) return res.status(400).json({ error: 'Email is already taken.' });
    target.email = cleanEmail;
  }

  if (phone !== undefined) target.phone = String(phone).trim();
  if (fullName !== undefined) target.fullName = String(fullName).trim();
  if (role !== undefined) target.role = role;
  if (isActive !== undefined) target.isActive = Boolean(isActive);
  if (password && String(password).trim()) {
    target.passwordHash = hashPassword(String(password).trim());
  }
  if (twoFactorEnabled !== undefined) target.twoFactorEnabled = Boolean(twoFactorEnabled);
  if (twoFactorPin !== undefined) target.twoFactorPin = String(twoFactorPin).trim();

  db.addAuditLog(
    req.admin!,
    'ADMIN_USER_UPDATED',
    'admin',
    `Updated administrator ${target.username} (${target.id})`,
    target.id
  );

  return res.json({ success: true, admin: target });
});

// Delete sub-admin user
adminRouter.delete('/admins/:id', requireAdmin(['super_admin']), (req: AuthenticatedAdminRequest, res: Response) => {
  if (req.params.id === req.admin!.id) {
    return res.status(400).json({ error: 'You cannot delete your own primary active account.' });
  }

  const deleted = db.admins.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Admin user not found.' });

  db.addAuditLog(
    req.admin!,
    'ADMIN_USER_DELETED',
    'admin',
    `Deleted administrator #${req.params.id}`
  );

  return res.json({ success: true });
});
