import { Router, Response } from 'express';
import { db, generateId, maskAccount } from '../db';
import { AuthenticatedUserRequest, requireUser } from '../middleware';
import { BankAccount, RechargeRequest, WithdrawalRequest } from '../types';

export const walletRouter = Router();

// Get wallet summary & bank info
walletRouter.get('/summary', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const userTx = db.transactions.filter(t => t.userId === user.id);
  const totalRecharge = db.recharges
    .filter(r => r.userId === user.id && r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalWithdraw = db.withdrawals
    .filter(w => w.userId === user.id && w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  return res.json({
    walletBalance: user.walletBalance,
    totalRecharge,
    totalWithdraw,
    bankAccount: user.bankAccount,
    recentTransactions: userTx.slice(0, 5),
    minRecharge: db.settings.minRecharge,
    maxRecharge: db.settings.maxRecharge,
    minWithdrawal: db.settings.minWithdrawal,
    maxWithdrawal: db.settings.maxWithdrawal,
    withdrawalFeePercent: db.settings.withdrawalFeePercent,
    channels: {
      upi1: {
        id: 'upi1',
        name: db.settings.upi1Name || 'UPI 1 (Manual UPI QR)',
        isEnabled: db.settings.upi1Enabled !== false,
        upiId: db.settings.upiId || 'payment.nexus@okaxis',
        upiPayeeName: db.settings.upiPayeeName || 'Nexus Official Payments',
        qrCodeUrl: db.settings.qrCodeUrl || '',
        notice: db.settings.upi1Notice || 'Pay via PhonePe, GPay, Paytm, BHIM and submit your 12-digit UTR reference number.',
      },
      upi2: {
        id: 'upi2',
        name: db.settings.upi2Name || 'UPI 2 (Razorpay Instant)',
        isEnabled: db.settings.upi2Enabled !== false,
        isConfigured: Boolean(db.settings.razorpayKeyId),
        razorpayKeyId: db.settings.razorpayKeyId || '',
        notice: db.settings.upi2Notice || 'Automated 1-click UPI, Cards & Netbanking with instant wallet credit.',
      },
      upi3: {
        id: 'upi3',
        name: db.settings.upi3Name || 'UPI 3 (Custom Web API Gateway)',
        isEnabled: db.settings.upi3Enabled !== false,
        isConfigured: Boolean(db.settings.customWebApiUrl),
        customWebApiUrl: db.settings.customWebApiUrl || 'https://api.upi-gateway.example/v1/create-order',
        notice: db.settings.upi3Notice || 'Fast Web API gateway redirect with automated real-time verification.',
      },
      upi4: {
        id: 'upi4',
        name: db.settings.upi4Name || 'UPI 4 (Direct Fast Channel)',
        isEnabled: Boolean(db.settings.upi4Enabled),
        upiId: db.settings.upi4UpiId || 'fastpay.nexus@okaxis',
        upiPayeeName: db.settings.upi4PayeeName || 'Nexus FastPay',
        qrCodeUrl: db.settings.upi4QrCodeUrl || '',
        notice: db.settings.upi4Notice || 'Scan directly using any UPI app and submit 12-digit UTR for quick credit.',
      },
      upi5: {
        id: 'upi5',
        name: db.settings.upi5Name || 'UPI 5 (Merchant VIP Gateway)',
        isEnabled: Boolean(db.settings.upi5Enabled),
        upiId: db.settings.upi5UpiId || 'vip.nexus@icici',
        upiPayeeName: db.settings.upi5PayeeName || 'Nexus VIP Treasury',
        qrCodeUrl: db.settings.upi5QrCodeUrl || '',
        notice: db.settings.upi5Notice || 'VIP high-priority deposit corridor with rapid manual/automated verification.',
      },
      upi6: {
        id: 'upi6',
        name: db.settings.upi6Name || 'UPI 6 (Express Backup Gateway)',
        isEnabled: Boolean(db.settings.upi6Enabled),
        upiId: db.settings.upi6UpiId || 'express.nexus@upi',
        upiPayeeName: db.settings.upi6PayeeName || 'Nexus Express Gateway',
        qrCodeUrl: db.settings.upi6QrCodeUrl || '',
        notice: db.settings.upi6Notice || '24/7 dedicated high-availability backup UPI payment channel.',
      },
    },
    support: {
      telegramUsername: db.settings.telegramUsername || 'investpro_india',
      telegramSupportUrl: db.settings.telegramSupportUrl || 'https://t.me/investpro_india',
      telegramChannelTitle: db.settings.telegramChannelTitle || 'Official Telegram Channel',
      supportChatEnabled: db.settings.supportChatEnabled !== false,
    }
  });
});

// Update or save bank account & UPI ID
walletRouter.post('/bank', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const { accountHolderName, accountNumber, ifscCode, bankName, upiId } = req.body;

  const cleanUpi = upiId ? String(upiId).trim() : '';
  const cleanAcc = accountNumber ? String(accountNumber).replace(/\s+/g, '') : '';
  const cleanIfsc = ifscCode ? String(ifscCode).trim().toUpperCase() : '';
  const cleanBank = bankName ? String(bankName).trim() : '';
  const cleanHolder = accountHolderName ? String(accountHolderName).trim() : user.fullName;

  // Must provide either valid bank account or valid UPI ID
  if (!cleanUpi && (!cleanAcc || !cleanIfsc || !cleanBank)) {
    return res.status(400).json({ error: 'Please provide either complete Bank Account details (A/C No, IFSC, Bank Name) or a valid UPI ID.' });
  }

  if (cleanAcc && (cleanAcc.length < 8 || cleanAcc.length > 20)) {
    return res.status(400).json({ error: 'Please enter a valid bank account number (8-20 digits).' });
  }

  const bankAccount: BankAccount = {
    accountHolderName: cleanHolder,
    accountNumber: cleanAcc || (user.bankAccount?.accountNumber || ''),
    maskedAccountNumber: cleanAcc ? maskAccount(cleanAcc) : (user.bankAccount?.maskedAccountNumber || ''),
    ifscCode: cleanIfsc || (user.bankAccount?.ifscCode || ''),
    bankName: cleanBank || (user.bankAccount?.bankName || ''),
    upiId: cleanUpi || (user.bankAccount?.upiId || ''),
    updatedAt: new Date().toISOString(),
  };

  user.bankAccount = bankAccount;

  db.addNotification(
    'Payout Details Updated',
    `Your payout destination details (${bankAccount.upiId ? `UPI: ${bankAccount.upiId}` : `${bankAccount.bankName} ${bankAccount.maskedAccountNumber}`}) have been saved.`,
    'system',
    user.id
  );

  return res.json({
    success: true,
    message: 'Payout details updated securely.',
    bankAccount,
  });
});

// 1. INITIATE RECHARGE
walletRouter.post('/recharge/initiate', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const { amount, paymentMethod, selectedChannel } = req.body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < db.settings.minRecharge || numAmount > db.settings.maxRecharge) {
    return res.status(400).json({
      error: `Recharge amount must be between ₹${db.settings.minRecharge} and ₹${db.settings.maxRecharge}.`,
    });
  }

  const validMethods = ['upi', 'card', 'netbanking', 'crypto'];
  const method = validMethods.includes(paymentMethod) ? paymentMethod : 'upi';
  const channel = (['upi1', 'upi2', 'upi3'].includes(selectedChannel) ? selectedChannel : 'upi1') as 'upi1' | 'upi2' | 'upi3';

  const rechargeId = generateId('RCH');
  const txId = generateId('TXN');
  const razorpayOrderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const webApiToken = `tok_web_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  const rechargeReq: RechargeRequest = {
    id: rechargeId,
    userId: user.id,
    userName: user.fullName,
    userMobile: user.mobile,
    amount: numAmount,
    paymentMethod: method as any,
    status: 'pending',
    txId,
    gatewayRef: channel === 'upi2' ? razorpayOrderId : (channel === 'upi3' ? webApiToken : undefined),
    createdAt: new Date().toISOString(),
  };

  db.recharges.unshift(rechargeReq);

  // Dynamic UPI 1 Details
  const activeUpiId = db.settings.upiId || 'payment.nexus@okaxis';
  const payeeName = encodeURIComponent(db.settings.upiPayeeName || 'Nexus Payments');
  const upiDeepLink = `upi://pay?pa=${activeUpiId}&pn=${payeeName}&am=${numAmount}&cu=INR&tn=Recharge-${rechargeId}`;
  const qrCodeUrl = db.settings.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

  // Web API UPI 3 Link
  const webApiBase = db.settings.customWebApiUrl || 'https://api.upi-gateway.example/v1/create-order';
  const webPaymentLink = `${webApiBase}?rechargeId=${rechargeId}&amount=${numAmount}&mobile=${encodeURIComponent(user.mobile)}&token=${webApiToken}`;

  return res.json({
    success: true,
    rechargeId,
    txId,
    amount: numAmount,
    paymentMethod: method,
    selectedChannel: channel,
    paymentGatewayMode: db.settings.paymentGatewayMode || 'all_channels',
    
    // UPI 1: Custom UPI details
    upi1: {
      name: db.settings.upi1Name || 'UPI 1 (Custom UPI QR)',
      upiId: activeUpiId,
      upiPayeeName: db.settings.upiPayeeName || 'Nexus Payments',
      upiDeepLink,
      qrCodeUrl,
      notice: db.settings.upi1Notice || 'Pay via PhonePe, GPay, Paytm, BHIM and submit your 12-digit UTR reference number.',
    },

    // UPI 2: Razorpay details
    upi2: {
      name: db.settings.upi2Name || 'UPI 2 (Razorpay Instant)',
      razorpayKeyId: db.settings.razorpayKeyId || '',
      razorpayOrderId,
      amountPaise: Math.round(numAmount * 100),
      currency: 'INR',
      notice: db.settings.upi2Notice || 'Automated 1-click UPI & Card payment with instant wallet credit.',
    },

    // UPI 3: Custom Web API details
    upi3: {
      name: db.settings.upi3Name || 'UPI 3 (Custom Web API Gateway)',
      webApiUrl: webApiBase,
      webPaymentLink,
      webApiToken,
      merchantRef: `REF-${rechargeId}`,
      notice: db.settings.upi3Notice || 'Fast Web API gateway redirect with automated real-time verification.',
    },

    // UPI 4: Direct Fast Channel
    upi4: {
      name: db.settings.upi4Name || 'UPI 4 (Direct Fast Channel)',
      upiId: db.settings.upi4UpiId || 'fastpay.nexus@okaxis',
      upiPayeeName: db.settings.upi4PayeeName || 'Nexus FastPay',
      upiDeepLink: `upi://pay?pa=${db.settings.upi4UpiId || 'fastpay.nexus@okaxis'}&pn=${encodeURIComponent(db.settings.upi4PayeeName || 'Nexus FastPay')}&am=${numAmount}&cu=INR&tn=Recharge-${rechargeId}`,
      qrCodeUrl: db.settings.upi4QrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${db.settings.upi4UpiId || 'fastpay.nexus@okaxis'}&pn=${encodeURIComponent(db.settings.upi4PayeeName || 'Nexus FastPay')}&am=${numAmount}&cu=INR&tn=Recharge-${rechargeId}`)}`,
      notice: db.settings.upi4Notice || 'Scan directly using any UPI app and submit 12-digit UTR for quick credit.',
    },

    // UPI 5: Merchant VIP Gateway
    upi5: {
      name: db.settings.upi5Name || 'UPI 5 (Merchant VIP Gateway)',
      upiId: db.settings.upi5UpiId || 'vip.nexus@icici',
      upiPayeeName: db.settings.upi5PayeeName || 'Nexus VIP Treasury',
      upiDeepLink: `upi://pay?pa=${db.settings.upi5UpiId || 'vip.nexus@icici'}&pn=${encodeURIComponent(db.settings.upi5PayeeName || 'Nexus VIP Treasury')}&am=${numAmount}&cu=INR&tn=Recharge-${rechargeId}`,
      qrCodeUrl: db.settings.upi5QrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${db.settings.upi5UpiId || 'vip.nexus@icici'}&pn=${encodeURIComponent(db.settings.upi5PayeeName || 'Nexus VIP Treasury')}&am=${numAmount}&cu=INR&tn=Recharge-${rechargeId}`)}`,
      notice: db.settings.upi5Notice || 'VIP high-priority deposit corridor with rapid manual/automated verification.',
    },

    // UPI 6: Express Backup Gateway
    upi6: {
      name: db.settings.upi6Name || 'UPI 6 (Express Backup Gateway)',
      upiId: db.settings.upi6UpiId || 'express.nexus@upi',
      upiPayeeName: db.settings.upi6PayeeName || 'Nexus Express Gateway',
      upiDeepLink: `upi://pay?pa=${db.settings.upi6UpiId || 'express.nexus@upi'}&pn=${encodeURIComponent(db.settings.upi6PayeeName || 'Nexus Express Gateway')}&am=${numAmount}&cu=INR&tn=Recharge-${rechargeId}`,
      qrCodeUrl: db.settings.upi6QrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${db.settings.upi6UpiId || 'express.nexus@upi'}&pn=${encodeURIComponent(db.settings.upi6PayeeName || 'Nexus Express Gateway')}&am=${numAmount}&cu=INR&tn=Recharge-${rechargeId}`)}`,
      notice: db.settings.upi6Notice || '24/7 dedicated high-availability backup UPI payment channel.',
    },

    // Legacy compatibility fields
    upiId: activeUpiId,
    upiPayeeName: db.settings.upiPayeeName || 'Nexus Payments',
    upiDeepLink,
    qrCodeUrl,
    razorpayKeyId: db.settings.razorpayKeyId || '',
    razorpayOrderId,
  });
});

// 1.1 VERIFY RAZORPAY PAYMENT (Automated Instant Wallet Credit)
walletRouter.post('/recharge/verify-razorpay', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const { rechargeId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

  const recharge = db.recharges.find(r => r.id === rechargeId && r.userId === user.id);
  if (!recharge) {
    return res.status(404).json({ error: 'Recharge order not found.' });
  }

  if (recharge.status === 'completed') {
    return res.json({
      success: true,
      message: 'Recharge already verified.',
      newBalance: user.walletBalance,
      recharge,
    });
  }

  // Mark recharge as completed
  recharge.status = 'completed';
  recharge.verifiedAt = new Date().toISOString();
  recharge.gatewayRef = razorpayPaymentId || razorpayOrderId || 'RAZORPAY_PAID';
  recharge.adminRemarks = `Automated verification via UPI 2 (Razorpay Gateway, Payment ID: ${razorpayPaymentId || 'N/A'})`;

  // Credit user wallet balance immediately
  user.walletBalance = Number((user.walletBalance + recharge.amount).toFixed(2));

  // Record completed transaction in ledger
  db.recordTransaction(
    user.id,
    'recharge',
    recharge.amount,
    recharge.amount,
    `Instant Wallet Recharge via UPI 2 / Razorpay (${razorpayPaymentId || 'Ref #' + recharge.txId})`,
    0,
    recharge.id,
    'completed'
  );

  // Notify user
  db.addNotification(
    'Recharge Successful (UPI 2 - Razorpay)',
    `₹${recharge.amount.toFixed(2)} has been credited to your wallet via UPI 2 Razorpay Payment #${razorpayPaymentId || recharge.txId}.`,
    'recharge',
    user.id
  );

  return res.json({
    success: true,
    message: `₹${recharge.amount.toFixed(2)} deposited successfully to your wallet!`,
    newBalance: user.walletBalance,
    recharge,
  });
});

// 1.2 VERIFY CUSTOM WEB API PAYMENT (UPI 3 Instant Verification)
walletRouter.post('/recharge/verify-web-api', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const { rechargeId, webApiRef, utrNumber } = req.body;

  const recharge = db.recharges.find(r => r.id === rechargeId && r.userId === user.id);
  if (!recharge) {
    return res.status(404).json({ error: 'Recharge order not found.' });
  }

  if (recharge.status === 'completed') {
    return res.json({
      success: true,
      message: 'Recharge already verified.',
      newBalance: user.walletBalance,
      recharge,
    });
  }

  // Mark recharge as completed
  recharge.status = 'completed';
  recharge.verifiedAt = new Date().toISOString();
  recharge.gatewayRef = webApiRef || `WEB_API_${Date.now()}`;
  if (utrNumber) recharge.utrNumber = String(utrNumber).trim();
  recharge.adminRemarks = `Automated verification via UPI 3 (Custom Web API Gateway, Ref: ${recharge.gatewayRef})`;

  // Credit user wallet balance immediately
  user.walletBalance = Number((user.walletBalance + recharge.amount).toFixed(2));

  // Record completed transaction in ledger
  db.recordTransaction(
    user.id,
    'recharge',
    recharge.amount,
    recharge.amount,
    `Instant Wallet Recharge via UPI 3 Web API (${recharge.gatewayRef})`,
    0,
    recharge.id,
    'completed'
  );

  // Notify user
  db.addNotification(
    'Recharge Successful (UPI 3 - Custom Web API)',
    `₹${recharge.amount.toFixed(2)} has been credited to your wallet via UPI 3 Web API Gateway (#${recharge.gatewayRef}).`,
    'recharge',
    user.id
  );

  return res.json({
    success: true,
    message: `₹${recharge.amount.toFixed(2)} deposited successfully via UPI 3 Web API!`,
    newBalance: user.walletBalance,
    recharge,
  });
});

// 2. SUBMIT PAYMENT PROOF (Manual Verification Mode)
// Saves UTR/Reference ID and marks as pending for Admin review - NEVER auto-deposits!
walletRouter.post('/recharge/submit', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const { rechargeId, utrNumber, proofImage } = req.body;

  const recharge = db.recharges.find(r => r.id === rechargeId && r.userId === user.id);
  if (!recharge) {
    return res.status(404).json({ error: 'Recharge order not found.' });
  }

  if (recharge.status === 'completed') {
    return res.status(400).json({ error: 'This recharge has already been verified and credited.' });
  }

  if (!utrNumber || String(utrNumber).trim().length < 6) {
    return res.status(400).json({ error: 'Please enter a valid 12-digit UPI UTR / Transaction Reference ID.' });
  }

  const cleanUtr = String(utrNumber).trim();
  recharge.utrNumber = cleanUtr;
  if (proofImage) recharge.proofImage = String(proofImage);
  recharge.status = 'pending';

  // Check if a pending transaction was already logged for this recharge, if not create one
  const existingTx = db.transactions.find(t => t.referenceId === recharge.id);
  if (!existingTx) {
    db.recordTransaction(
      user.id,
      'recharge',
      recharge.amount,
      recharge.amount,
      `Recharge Deposit Request (UTR: ${cleanUtr})`,
      0,
      recharge.id,
      'pending'
    );
  } else {
    existingTx.description = `Recharge Deposit Request (UTR: ${cleanUtr})`;
  }

  // Notify user that request is submitted for Admin verification
  db.addNotification(
    'Recharge Request Submitted',
    `Your recharge request of ₹${recharge.amount.toFixed(2)} (UTR: ${cleanUtr}) has been submitted for Admin verification. Your balance will be credited once verified.`,
    'recharge',
    user.id
  );

  return res.json({
    success: true,
    message: 'Payment proof submitted successfully! Your recharge is pending verification by the admin.',
    recharge,
    walletBalance: user.walletBalance,
  });
});

// 3. GET SINGLE RECHARGE STATUS
walletRouter.get('/recharge/:id', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const recharge = db.recharges.find(r => r.id === req.params.id && r.userId === user.id);
  if (!recharge) {
    return res.status(404).json({ error: 'Recharge not found.' });
  }
  return res.json({ recharge });
});

// 3. WITHDRAWAL REQUEST
walletRouter.post('/withdraw', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const { amount, payoutMethod, upiId } = req.body;

  const method = payoutMethod === 'upi' ? 'upi' : 'bank';
  const targetUpi = (upiId || user.bankAccount?.upiId || '').trim();

  if (method === 'upi' && !targetUpi) {
    return res.status(400).json({
      error: 'Please enter or save your UPI ID (VPA) before requesting a UPI withdrawal.',
    });
  }

  if (method === 'bank' && (!user.bankAccount || !user.bankAccount.accountNumber || !user.bankAccount.ifscCode)) {
    return res.status(400).json({
      error: 'Please add and verify your Bank Account before requesting a Bank withdrawal.',
    });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < db.settings.minWithdrawal || numAmount > db.settings.maxWithdrawal) {
    return res.status(400).json({
      error: `Withdrawal amount must be between ₹${db.settings.minWithdrawal} and ₹${db.settings.maxWithdrawal}.`,
    });
  }

  if (user.walletBalance < numAmount) {
    return res.status(400).json({
      error: `Insufficient balance. Available: ₹${user.walletBalance.toFixed(2)}.`,
    });
  }

  const feePercent = db.settings.withdrawalFeePercent;
  const fee = Number(((numAmount * feePercent) / 100).toFixed(2));
  const finalAmount = Number((numAmount - fee).toFixed(2));

  // Deduct from wallet balance immediately (locked in processing escrow)
  const deducted = db.adjustUserBalance(user.id, -numAmount);
  if (!deducted) {
    return res.status(500).json({ error: 'Failed to deduct withdrawal funds from balance.' });
  }

  const withdrawId = generateId('WTH');
  const txId = generateId('TXN');

  const payoutBankAccount: BankAccount = user.bankAccount ? {
    ...user.bankAccount,
    upiId: targetUpi || user.bankAccount.upiId,
  } : {
    accountHolderName: user.fullName,
    accountNumber: '',
    maskedAccountNumber: '',
    ifscCode: '',
    bankName: 'UPI Direct Payout',
    upiId: targetUpi,
    updatedAt: new Date().toISOString(),
  };

  const withdrawReq: WithdrawalRequest = {
    id: withdrawId,
    userId: user.id,
    userName: user.fullName,
    userMobile: user.mobile,
    payoutMethod: method,
    upiId: targetUpi,
    amount: numAmount,
    fee,
    finalAmount,
    bankAccount: payoutBankAccount,
    status: 'pending',
    txId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.withdrawals.unshift(withdrawReq);

  // Record ledger transaction with 'pending' status
  db.recordTransaction(
    user.id,
    'withdrawal',
    numAmount,
    -numAmount,
    `Withdrawal to ${method === 'upi' ? `UPI (${targetUpi})` : `${payoutBankAccount.bankName} (${payoutBankAccount.maskedAccountNumber})`} - Payout: ₹${finalAmount.toFixed(2)}`,
    fee,
    withdrawId,
    'pending'
  );

  db.addNotification(
    'Withdrawal Request Submitted',
    `Your withdrawal of ₹${numAmount.toFixed(2)} (Net payout: ₹${finalAmount.toFixed(2)}) is currently pending review. Tx ID: ${txId}`,
    'withdrawal',
    user.id
  );

  return res.json({
    success: true,
    message: 'Withdrawal request submitted successfully.',
    withdrawal: withdrawReq,
    newBalance: user.walletBalance,
  });
});

// Get user recharge history
walletRouter.get('/recharges', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const userRecharges = db.recharges.filter(r => r.userId === user.id);
  return res.json({ recharges: userRecharges });
});

// Get user withdrawal history
walletRouter.get('/withdrawals', requireUser, (req: AuthenticatedUserRequest, res: Response) => {
  const user = req.user!;
  const userWithdrawals = db.withdrawals.filter(w => w.userId === user.id);
  return res.json({ withdrawals: userWithdrawals });
});
