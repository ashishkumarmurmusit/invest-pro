import crypto from 'crypto';
import {
  AdminRole,
  AdminUser,
  Advertisement,
  AuditLog,
  BankAccount,
  CheckinRecord,
  AdsterraSettings,
  NotificationItem,
  Order,
  Product,
  RechargeRequest,
  SystemSettings,
  ThemeConfig,
  Transaction,
  User,
  WithdrawalRequest,
} from './types';

// SHA256 password hash helper
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_nexus_salt_2026').digest('hex');
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function maskAccount(acc: string): string {
  if (!acc || acc.length < 4) return '•••• •••• ••••';
  const last4 = acc.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  purple: {
    preset: 'purple',
    primaryColor: '#4F46E5', // Clean Modern Indigo
    secondaryColor: '#3B82F6', // Royal Sky
    backgroundColor: '#F8FAFC',
    textColor: '#0F172A',
    buttonColor: '#4F46E5',
    cardColor: '#FFFFFF',
    headerColor: '#FFFFFF',
    sidebarColor: '#0F172A',
    bottomNavColor: '#FFFFFF',
    borderRadius: '16px',
    mode: 'light',
    websiteName: 'Nexus Global',
    logoText: 'NEXUS',
    tagline: 'Modern Digital Rewards & E-Commerce',
    updatedAt: new Date().toISOString(),
  },
  blue: {
    preset: 'blue',
    primaryColor: '#2563EB',
    secondaryColor: '#0284C7',
    backgroundColor: '#F0F9FF',
    textColor: '#0F172A',
    buttonColor: '#2563EB',
    cardColor: '#FFFFFF',
    headerColor: '#FFFFFF',
    sidebarColor: '#0F172A',
    bottomNavColor: '#FFFFFF',
    borderRadius: '12px',
    mode: 'light',
    websiteName: 'Nexus Prime Blue',
    logoText: 'NEXUS',
    tagline: 'Next-Gen Financial Node Platform',
    updatedAt: new Date().toISOString(),
  },
  green: {
    preset: 'green',
    primaryColor: '#059669',
    secondaryColor: '#0D9488',
    backgroundColor: '#F0FDF4',
    textColor: '#064E3B',
    buttonColor: '#059669',
    cardColor: '#FFFFFF',
    headerColor: '#FFFFFF',
    sidebarColor: '#022C22',
    bottomNavColor: '#FFFFFF',
    borderRadius: '16px',
    mode: 'light',
    websiteName: 'Nexus Eco Green',
    logoText: 'NEXUS',
    tagline: 'Sustainable Power & Daily Yield Nodes',
    updatedAt: new Date().toISOString(),
  },
  red: {
    preset: 'red',
    primaryColor: '#DC2626',
    secondaryColor: '#E11D48',
    backgroundColor: '#FFF1F2',
    textColor: '#1C1917',
    buttonColor: '#DC2626',
    cardColor: '#FFFFFF',
    headerColor: '#FFFFFF',
    sidebarColor: '#18181B',
    bottomNavColor: '#FFFFFF',
    borderRadius: '14px',
    mode: 'light',
    websiteName: 'Nexus Crimson Hub',
    logoText: 'NEXUS',
    tagline: 'High Velocity Asset Marketplace',
    updatedAt: new Date().toISOString(),
  },
  dark: {
    preset: 'dark',
    primaryColor: '#A855F7',
    secondaryColor: '#6366F1',
    backgroundColor: '#090D16',
    textColor: '#F8FAFC',
    buttonColor: '#9333EA',
    cardColor: '#131B2E',
    headerColor: '#0E1526',
    sidebarColor: '#070A12',
    bottomNavColor: '#0E1526',
    borderRadius: '16px',
    mode: 'dark',
    websiteName: 'Nexus Obsidian Pro',
    logoText: 'NEXUS',
    tagline: 'Deep Space Digital Earning Platform',
    updatedAt: new Date().toISOString(),
  },
  light: {
    preset: 'light',
    primaryColor: '#475569',
    secondaryColor: '#334155',
    backgroundColor: '#FAFAFA',
    textColor: '#18181B',
    buttonColor: '#18181B',
    cardColor: '#FFFFFF',
    headerColor: '#FFFFFF',
    sidebarColor: '#27272A',
    bottomNavColor: '#FFFFFF',
    borderRadius: '8px',
    mode: 'light',
    websiteName: 'Nexus Minimalist',
    logoText: 'NEXUS',
    tagline: 'Sleek Clean Digital Commerce',
    updatedAt: new Date().toISOString(),
  },
};

class Database {
  users: Map<string, User> = new Map();
  admins: Map<string, AdminUser> = new Map();
  transactions: Transaction[] = [];
  recharges: RechargeRequest[] = [];
  withdrawals: WithdrawalRequest[] = [];
  products: Product[] = [];
  orders: Order[] = [];
  checkins: CheckinRecord[] = [];
  ads: Advertisement[] = [];
  adsterra: AdsterraSettings;
  theme: ThemeConfig;
  settings: SystemSettings;
  notifications: NotificationItem[] = [];
  auditLogs: AuditLog[] = [];
  userSessions: Map<string, string> = new Map();
  adminSessions: Map<string, string> = new Map();

  constructor() {
    this.theme = { ...PRESET_THEMES.blue };

    this.settings = {
      websiteName: 'Nexus Global',
      logoText: 'NEXUS',
      logoUrl: '',

      paymentGatewayMode: 'all_channels',
      
      // UPI 1: Custom UPI
      upi1Enabled: true,
      upi1Name: 'UPI 1 (Manual UPI QR)',
      upiId: 'payment.nexus@okaxis',
      upiPayeeName: 'Nexus Official Payments',
      qrCodeUrl: '',
      upi1Notice: 'Pay via PhonePe, GPay, Paytm, BHIM and submit your 12-digit UTR reference number.',

      // UPI 2: Razorpay
      upi2Enabled: true,
      upi2Name: 'UPI 2 (Razorpay Instant)',
      razorpayKeyId: 'rzp_test_1DP5mmOlF5G5ag',
      razorpayKeySecret: 'sample_secret_key_123',
      upi2Notice: 'Automated 1-click UPI, Cards & Netbanking with instant wallet credit.',

      // UPI 3: Custom Web API Gateway
      upi3Enabled: true,
      upi3Name: 'UPI 3 (Custom Web API Gateway)',
      customWebApiUrl: 'https://api.upi-gateway.example/v1/create-order',
      customWebApiMerchantKey: 'MERCHANT_API_KEY_LIVE_9981',
      customWebApiSecret: 'SEC_KEY_81920831920491',
      customGatewayWebhookUrl: '',
      cashfreeAppId: '',
      cashfreeSecretKey: '',
      upi3Notice: 'Fast Web API gateway redirect with automated real-time verification.',

      // UPI 4: Direct Fast Channel
      upi4Enabled: true,
      upi4Name: 'UPI 4 (Direct Fast Channel)',
      upi4UpiId: 'fastpay.nexus@okaxis',
      upi4PayeeName: 'Nexus FastPay Merchant',
      upi4QrCodeUrl: '',
      upi4Notice: 'Scan directly using any UPI app and submit 12-digit UTR for quick credit.',

      // UPI 5: Merchant VIP Gateway
      upi5Enabled: true,
      upi5Name: 'UPI 5 (Merchant VIP Gateway)',
      upi5UpiId: 'vip.nexus@icici',
      upi5PayeeName: 'Nexus VIP Treasury',
      upi5QrCodeUrl: '',
      upi5Notice: 'VIP high-priority deposit corridor with rapid manual/automated verification.',

      // UPI 6: Express Backup Gateway
      upi6Enabled: true,
      upi6Name: 'UPI 6 (Express Backup Gateway)',
      upi6UpiId: 'express.nexus@upi',
      upi6PayeeName: 'Nexus Express Gateway',
      upi6QrCodeUrl: '',
      upi6Notice: '24/7 dedicated high-availability backup UPI payment channel.',

      // Support & Telegram
      telegramUsername: 'investpro_india',
      telegramSupportUrl: 'https://t.me/investpro_india',
      telegramChannelTitle: 'Official Telegram Channel',
      supportChatEnabled: true,

      minRecharge: 50,
      maxRecharge: 500000,
      minWithdrawal: 100,
      maxWithdrawal: 250000,
      withdrawalFeePercent: 5, // 5% platform fee
      referralRates: {
        level1: 10, // 10%
        level2: 5,  // 5%
        level3: 2,  // 2%
      },
      checkinRewards: [10, 15, 20, 30, 40, 50, 100],
      announcementTicker: '🚀 Welcome to Nexus! UPI 1, UPI 2 (Razorpay) & UPI 3 (Web API) active for instant deposits.',
    };

    this.adsterra = {
      isEnabled: true,
      popunderScript: '',
      socialBarScript: '',
      directLinkUrl: '',
      slots: {
        headerBanner: {
          isEnabled: true,
          scriptCode: '',
          bannerSize: '728x90',
        },
        homeTopBanner: {
          isEnabled: true,
          scriptCode: '',
          bannerSize: '728x90',
        },
        homeMiddleBanner: {
          isEnabled: true,
          scriptCode: '',
          bannerSize: '300x250',
        },
        storeBanner: {
          isEnabled: true,
          scriptCode: '',
          bannerSize: '468x60',
        },
        productBanner: {
          isEnabled: true,
          scriptCode: '',
          bannerSize: '320x50',
        },
        footerBanner: {
          isEnabled: true,
          scriptCode: '',
          bannerSize: '728x90',
        },
        sidebarBanner: {
          isEnabled: true,
          scriptCode: '',
          bannerSize: '160x600',
        },
      },
      updatedAt: new Date().toISOString(),
    };

    this.seedInitialData();
  }

  seedInitialData() {
    // 1. Seed Admin Users with RBAC
    const defaultAdmins: AdminUser[] = [
      {
        id: 'adm-super-1',
        username: 'superadmin',
        email: 'superadmin@nexus.io',
        passwordHash: hashPassword('SuperAdmin@123'),
        role: 'super_admin',
        fullName: 'Executive Super Admin',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'adm-general-1',
        username: 'admin',
        email: 'admin@nexus.io',
        passwordHash: hashPassword('Admin@123'),
        role: 'admin',
        fullName: 'General Operations Admin',
        isActive: true,
        createdAt: '2026-01-02T00:00:00Z',
      },
      {
        id: 'adm-finance-1',
        username: 'finance',
        email: 'finance@nexus.io',
        passwordHash: hashPassword('Finance@123'),
        role: 'finance_admin',
        fullName: 'Chief Finance Officer',
        isActive: true,
        createdAt: '2026-01-03T00:00:00Z',
      },
      {
        id: 'adm-content-1',
        username: 'content',
        email: 'content@nexus.io',
        passwordHash: hashPassword('Content@123'),
        role: 'content_admin',
        fullName: 'Media & Marketing Director',
        isActive: true,
        createdAt: '2026-01-04T00:00:00Z',
      },
    ];

    defaultAdmins.forEach(adm => this.admins.set(adm.id, adm));
    this.adminSessions.set('admin-token-super-123', 'adm-super-1');

    // 2. Seed Default Demo User
    const demoUser: User = {
      id: 'usr-demo-01',
      fullName: 'Alex Rivera',
      email: 'alex@demo.com',
      mobile: '9876543210',
      passwordHash: hashPassword('password123'),
      walletBalance: 2450.00,
      referralCode: 'NEXUS987',
      bankAccount: {
        accountHolderName: 'Alex Rivera',
        accountNumber: '9182736451928374',
        maskedAccountNumber: maskAccount('9182736451928374'),
        ifscCode: 'HDFC0001824',
        bankName: 'HDFC Premier Bank',
        updatedAt: '2026-03-20T10:00:00Z',
      },
      isActive: true,
      createdAt: '2026-02-10T08:30:00Z',
      lastLoginAt: new Date().toISOString(),
    };
    this.users.set(demoUser.id, demoUser);
    this.userSessions.set('demo-token-alex-123', demoUser.id);

    // 3. Seed Additional Team referrals under Alex
    const referralUser1: User = {
      id: 'usr-ref-02',
      fullName: 'Elena Rostova',
      email: 'elena@nexus-team.io',
      mobile: '9811223344',
      passwordHash: hashPassword('password123'),
      walletBalance: 840.00,
      referralCode: 'ELENA482',
      referredBy: 'usr-demo-01',
      isActive: true,
      createdAt: '2026-03-01T12:00:00Z',
    };
    const referralUser2: User = {
      id: 'usr-ref-03',
      fullName: 'Marcus Vance',
      email: 'marcus@nexus-team.io',
      mobile: '9822334455',
      passwordHash: hashPassword('password123'),
      walletBalance: 1200.00,
      referralCode: 'MARCUS19',
      referredBy: 'usr-demo-01',
      isActive: true,
      createdAt: '2026-03-12T14:30:00Z',
    };
    this.users.set(referralUser1.id, referralUser1);
    this.users.set(referralUser2.id, referralUser2);

    // 4. Seed Products
    this.products = [
      {
        id: 'prod-01',
        name: 'Nexus 25-Day Locking Capital Vault',
        subtitle: 'Fixed-Term High Compound Yield',
        planType: 'locking_cycle',
        price: 500,
        dailyReturn: 60.00,
        durationDays: 25,
        totalReturn: 1500.00,
        description: 'Fixed 25-day capital locking cycle. 100% principal and accumulated profit of ₹1,500 matures and unlocks after exactly 25 days.',
        badge: 'Locking Cycle',
        colorScheme: 'purple',
        iconType: 'solar',
        stock: 500,
        isActive: true,
        createdAt: '2026-01-10T00:00:00Z',
      },
      {
        id: 'prod-02',
        name: 'Quantum 65-Day Daily Income Stream',
        subtitle: 'Automated 24h Daily Payout Node',
        planType: 'daily_withdrawal',
        price: 500,
        dailyReturn: 100.00,
        durationDays: 65,
        totalReturn: 6500.00,
        description: 'High-speed daily withdrawal node. Generates ₹100 every 24 hours for 65 consecutive days. Transferable daily to main wallet.',
        badge: 'Daily Payout',
        colorScheme: 'indigo',
        iconType: 'cpu',
        stock: 350,
        isActive: true,
        createdAt: '2026-01-15T00:00:00Z',
      },
      {
        id: 'prod-03',
        name: 'HydroMax 40-Day Prime Lock',
        subtitle: 'Green Energy Baseload Storage',
        planType: 'locking_cycle',
        price: 1500,
        dailyReturn: 125.00,
        durationDays: 40,
        totalReturn: 5000.00,
        description: 'Industrial hydroelectric storage cycle locked for 40 days, delivering ₹5,000 total return at maturity.',
        badge: 'Locking Cycle',
        colorScheme: 'emerald',
        iconType: 'zap',
        stock: 200,
        isActive: true,
        createdAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'prod-04',
        name: 'Titan 50-Day Daily Supercharger',
        subtitle: 'Zero-Emission Power Storage Matrix',
        planType: 'daily_withdrawal',
        price: 3000,
        dailyReturn: 240.00,
        durationDays: 50,
        totalReturn: 12000.00,
        description: 'Industrial hydrogen matrix providing ₹240 daily payout every single day for 50 days directly to your wallet.',
        badge: 'Daily Payout',
        colorScheme: 'cyan',
        iconType: 'flame',
        stock: 120,
        isActive: true,
        createdAt: '2026-02-20T00:00:00Z',
      },
      {
        id: 'prod-05',
        name: 'Hyperion VIP Orbital Relay',
        subtitle: 'Satellite Bandwidth Network',
        planType: 'daily_withdrawal',
        price: 10000,
        dailyReturn: 950.00,
        durationDays: 60,
        totalReturn: 57000.00,
        description: 'Top-tier orbital ground station routing institutional bandwidth with maximum priority daily payouts.',
        badge: 'VIP Elite',
        colorScheme: 'violet',
        iconType: 'radio',
        stock: 25,
        isActive: true,
        createdAt: '2026-03-01T00:00:00Z',
      },
    ];

    // 5. Seed Orders for Demo User
    this.orders.push({
      id: 'ord-10928',
      userId: demoUser.id,
      productId: 'prod-02',
      productName: 'Quantum 65-Day Daily Income Stream',
      planType: 'daily_withdrawal',
      price: 500,
      dailyReturn: 100.00,
      durationDays: 65,
      totalReturn: 6500.00,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 62 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      collectedReturns: 0,
      daysClaimed: 0,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 6. Seed Recent Transactions
    this.transactions = [
      {
        id: 'TXN-948102',
        userId: demoUser.id,
        userName: demoUser.fullName,
        type: 'recharge',
        amount: 2000,
        netAmount: 2000,
        status: 'completed',
        description: 'Instant UPI Wallet Recharge',
        createdAt: '2026-03-24T14:22:10Z',
        updatedAt: '2026-03-24T14:23:05Z',
      },
      {
        id: 'TXN-839210',
        userId: demoUser.id,
        userName: demoUser.fullName,
        type: 'order',
        amount: 500,
        netAmount: -500,
        status: 'completed',
        description: 'Purchased Aura Solar Generation Node',
        createdAt: '2026-03-24T15:10:00Z',
        updatedAt: '2026-03-24T15:10:00Z',
      },
      {
        id: 'TXN-728192',
        userId: demoUser.id,
        userName: demoUser.fullName,
        type: 'checkin',
        amount: 30.0,
        netAmount: 30.0,
        status: 'completed',
        description: 'Day 4 Streak Check-in Reward',
        createdAt: '2026-03-28T09:12:44Z',
        updatedAt: '2026-03-28T09:12:44Z',
      },
      {
        id: 'TXN-619283',
        userId: demoUser.id,
        userName: demoUser.fullName,
        type: 'referral',
        amount: 150.00,
        netAmount: 150.00,
        status: 'completed',
        description: '10% Referral Commission from Elena Rostova',
        createdAt: '2026-03-29T11:05:12Z',
        updatedAt: '2026-03-29T11:05:12Z',
      },
      {
        id: 'TXN-509281',
        userId: demoUser.id,
        userName: demoUser.fullName,
        type: 'withdrawal',
        amount: 800.00,
        fee: 40.00,
        netAmount: -800.00,
        status: 'completed',
        description: 'Bank Withdrawal to HDFC Premier (•••• 8374)',
        createdAt: '2026-03-25T16:45:00Z',
        updatedAt: '2026-03-25T17:15:30Z',
      },
    ];

    // 7. Seed Recharges
    this.recharges.push({
      id: 'rch-948102',
      userId: demoUser.id,
      userName: demoUser.fullName,
      userMobile: demoUser.mobile,
      amount: 2000,
      paymentMethod: 'upi',
      status: 'completed',
      txId: 'TXN-948102',
      gatewayRef: 'GW-UPI-984920491',
      createdAt: '2026-03-24T14:22:10Z',
      verifiedAt: '2026-03-24T14:23:05Z',
    });

    // 8. Seed Withdrawals
    this.withdrawals.push({
      id: 'wth-509281',
      userId: demoUser.id,
      userName: demoUser.fullName,
      userMobile: demoUser.mobile,
      amount: 800.00,
      fee: 40.00,
      finalAmount: 760.00,
      bankAccount: demoUser.bankAccount!,
      status: 'completed',
      txId: 'TXN-509281',
      remarks: 'Settled via NEFT / IMPS Banking Gateway',
      processedBy: 'superadmin@nexus.io',
      createdAt: '2026-03-25T16:45:00Z',
      updatedAt: '2026-03-25T17:15:30Z',
    });

    // 9. Seed Advertisements
    this.ads = [
      {
        id: 'ad-01',
        title: 'Spring Yield Multiplier Event',
        position: 'home_top',
        bannerType: 'gradient_card',
        badgeText: 'SEASON EXCLUSIVE',
        headline: 'Earn Up to 18% Daily Bonus Yield',
        subtext: 'Activate any Quantum or EcoHydro Node this week to unlock automated daily booster payouts.',
        buttonText: 'Explore Store',
        actionUrl: '/store',
        priority: 10,
        mobileVisible: true,
        desktopVisible: true,
        isEnabled: true,
        startDate: '2026-03-01T00:00:00Z',
        endDate: '2026-04-30T00:00:00Z',
        clicks: 342,
        impressions: 4890,
        createdAt: '2026-03-01T00:00:00Z',
      },
      {
        id: 'ad-02',
        title: 'VIP Referral Accelerator',
        position: 'home_middle',
        bannerType: 'gradient_card',
        badgeText: 'TEAM REWARDS',
        headline: 'Double Direct Commissions on 3+ Invites',
        subtext: 'Share your personal referral link today. Receive instant wallet payouts for every team activation.',
        buttonText: 'Get Referral Code',
        actionUrl: '/referral',
        priority: 8,
        mobileVisible: true,
        desktopVisible: true,
        isEnabled: true,
        startDate: '2026-03-10T00:00:00Z',
        endDate: '2026-05-15T00:00:00Z',
        clicks: 189,
        impressions: 2910,
        createdAt: '2026-03-10T00:00:00Z',
      },
      {
        id: 'ad-03',
        title: 'Institutional Grade Security Guarantee',
        position: 'store_banner',
        bannerType: 'gradient_card',
        badgeText: 'VERIFIED SECURITY',
        headline: '100% Reserve Backing on All Node Assets',
        subtext: 'Every deployed unit is verified and monitored with multi-signature cold custody vault protocols.',
        buttonText: 'View Certifications',
        actionUrl: '#security',
        priority: 5,
        mobileVisible: true,
        desktopVisible: true,
        isEnabled: true,
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-12-31T00:00:00Z',
        clicks: 94,
        impressions: 1650,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'ad-04',
        title: 'Daily Streak Bonus Notice',
        position: 'checkin_banner',
        bannerType: 'gradient_card',
        badgeText: '7-DAY STREAK',
        headline: 'Reach Day 7 for a ₹50.00 Instant Cash Bonus',
        subtext: 'Check-in once per 24 hours. Missing a day resets the multiplier chain.',
        buttonText: 'Claim Today',
        actionUrl: '#claim',
        priority: 7,
        mobileVisible: true,
        desktopVisible: true,
        isEnabled: true,
        startDate: '2026-02-01T00:00:00Z',
        endDate: '2026-12-31T00:00:00Z',
        clicks: 210,
        impressions: 3100,
        createdAt: '2026-02-01T00:00:00Z',
      },
    ];

    // 10. Seed Notifications
    this.notifications = [
      {
        id: 'notif-01',
        title: 'System Security Upgrade Complete',
        message: 'High-speed payment verification webhooks and 2FA authentication are now active across all accounts.',
        type: 'system',
        isRead: false,
        createdAt: '2026-03-29T08:00:00Z',
      },
      {
        id: 'notif-02',
        userId: demoUser.id,
        title: 'Referral Bonus Credited',
        message: 'You received ₹84.00 commission from member Elena Rostova product activation.',
        type: 'referral',
        isRead: false,
        createdAt: '2026-03-29T11:05:12Z',
      },
      {
        id: 'notif-03',
        userId: demoUser.id,
        title: 'Recharge Confirmed',
        message: 'Your recharge of ₹1,500.00 via UPI has been verified and added to your balance.',
        type: 'recharge',
        isRead: true,
        createdAt: '2026-03-24T14:23:05Z',
      },
    ];

    // 11. Seed Audit Logs
    this.auditLogs = [
      {
        id: 'log-01',
        adminId: 'adm-super-1',
        adminEmail: 'superadmin@nexus.io',
        adminRole: 'super_admin',
        action: 'SYSTEM_INITIALIZATION',
        targetType: 'setting',
        details: 'Initial system deployment and RBAC roles configuration.',
        timestamp: '2026-01-01T00:00:00Z',
      },
      {
        id: 'log-02',
        adminId: 'adm-finance-1',
        adminEmail: 'finance@nexus.io',
        adminRole: 'finance_admin',
        action: 'WITHDRAWAL_APPROVED',
        targetType: 'withdrawal',
        targetId: 'wth-509281',
        details: 'Approved bank payout ₹475.00 (fee ₹25.00) for Alex Rivera (•••• 8374).',
        timestamp: '2026-03-25T17:15:30Z',
      },
    ];
  }

  // --- Helper Methods ---

  addAuditLog(
    admin: AdminUser,
    action: string,
    targetType: AuditLog['targetType'],
    details: string,
    targetId?: string,
    ip?: string
  ) {
    const log: AuditLog = {
      id: generateId('LOG'),
      adminId: admin.id,
      adminEmail: admin.email,
      adminRole: admin.role,
      action,
      targetType,
      targetId,
      details,
      ipAddress: ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    // Keep max 500 logs in memory
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }

  recordTransaction(
    userId: string,
    type: Transaction['type'],
    amount: number,
    netAmount: number,
    description: string,
    fee: number = 0,
    referenceId?: string,
    status: Transaction['status'] = 'completed'
  ): Transaction {
    const user = this.users.get(userId);
    const tx: Transaction = {
      id: generateId('TXN'),
      userId,
      userName: user ? user.fullName : undefined,
      type,
      amount,
      fee,
      netAmount,
      status,
      description,
      referenceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transactions.unshift(tx);
    return tx;
  }

  adjustUserBalance(userId: string, deltaAmount: number): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    const newBal = Number((user.walletBalance + deltaAmount).toFixed(2));
    if (newBal < 0) return false;
    user.walletBalance = newBal;
    return true;
  }

  addNotification(
    title: string,
    message: string,
    type: NotificationItem['type'],
    userId?: string
  ) {
    const notif: NotificationItem = {
      id: generateId('NTF'),
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    return notif;
  }
}

export const db = new Database();
