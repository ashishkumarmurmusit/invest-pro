export type UserRole = 'user';
export type AdminRole = 'super_admin' | 'admin' | 'finance_admin' | 'content_admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  passwordHash: string;
  walletBalance: number;
  referralCode: string;
  referredBy?: string;
  bankAccount?: BankAccount;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: AdminRole;
  fullName: string;
  isActive: boolean;
  twoFactorEnabled?: boolean;
  twoFactorPin?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface BankAccount {
  accountHolderName: string;
  accountNumber: string; // Stored securely
  maskedAccountNumber: string; // e.g. "•••• •••• •••• 4920"
  ifscCode: string;
  bankName: string;
  upiId?: string; // UPI ID / VPA for instant UPI payouts
  updatedAt: string;
}

export type TransactionType = 'recharge' | 'withdrawal' | 'order' | 'checkin' | 'referral';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Transaction {
  id: string; // Unique Tx ID e.g. TXN-10928392
  userId: string;
  userName?: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  netAmount: number;
  status: TransactionStatus;
  description: string;
  referenceId?: string; // e.g. recharge ID, order ID
  createdAt: string;
  updatedAt: string;
}

export interface RechargeRequest {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  amount: number;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'crypto';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  txId: string;
  utrNumber?: string;
  proofImage?: string;
  adminRemarks?: string;
  processedBy?: string;
  gatewayRef?: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  payoutMethod?: 'bank' | 'upi';
  upiId?: string;
  amount: number;
  fee: number;
  finalAmount: number;
  bankAccount: BankAccount;
  status: TransactionStatus;
  txId: string;
  remarks?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  planType?: 'locking_cycle' | 'daily_withdrawal';
  price: number;
  dailyReturn: number;
  durationDays: number;
  totalReturn: number;
  description: string;
  badge?: string;
  colorScheme: string; // e.g. "purple", "emerald", "amber", "cyan"
  iconType: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  planType?: 'locking_cycle' | 'daily_withdrawal';
  price: number;
  dailyReturn: number;
  durationDays: number;
  totalReturn: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  collectedReturns: number;
  daysClaimed?: number;
  lastClaimDate?: string;
  nextClaimAvailableAt?: string;
  createdAt: string;
}

export interface CheckinRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1 to 7
  rewardAmount: number;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  adType?: 'promo_banner' | 'adsterra_script' | 'custom_html';
  scriptCode?: string;
  position: 'home_top' | 'home_middle' | 'home_bottom' | 'store_banner' | 'product_banner' | 'checkin_banner' | 'referral_banner' | 'profile_banner';
  imageUrl?: string;
  bannerType: 'gradient_card' | 'custom_image' | 'adsterra_script';
  badgeText?: string;
  headline: string;
  subtext: string;
  buttonText: string;
  actionUrl: string;
  priority: number;
  mobileVisible: boolean;
  desktopVisible: boolean;
  isEnabled: boolean;
  startDate: string;
  endDate: string;
  clicks: number;
  impressions: number;
  createdAt: string;
}

export interface AdsterraSlotConfig {
  isEnabled: boolean;
  scriptCode: string;
  bannerSize: string; // e.g. '728x90', '300x250', '468x60', '320x50', '160x600', 'native'
}

export interface AdsterraSettings {
  isEnabled: boolean;
  popunderScript: string;
  socialBarScript: string;
  directLinkUrl: string;
  slots: {
    headerBanner: AdsterraSlotConfig;
    homeTopBanner: AdsterraSlotConfig;
    homeMiddleBanner: AdsterraSlotConfig;
    storeBanner: AdsterraSlotConfig;
    productBanner: AdsterraSlotConfig;
    footerBanner: AdsterraSlotConfig;
    sidebarBanner: AdsterraSlotConfig;
  };
  updatedAt: string;
}

export interface ThemeConfig {
  preset: 'purple' | 'blue' | 'green' | 'red' | 'dark' | 'light' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  cardColor: string;
  headerColor: string;
  sidebarColor: string;
  bottomNavColor: string;
  borderRadius: string; // '8px' | '12px' | '16px' | '24px'
  mode: 'light' | 'dark';
  websiteName: string;
  logoText: string;
  logoUrl?: string;
  tagline: string;
  updatedAt: string;
}

export interface SystemSettings {
  websiteName: string;
  logoText?: string;
  logoUrl?: string;
  
  // Custom UPI & Multi-Channel Gateway Configuration
  paymentGatewayMode?: 'all_channels' | 'upi1' | 'upi2' | 'upi3' | 'upi_manual' | 'razorpay' | 'custom_gateway';
  
  // UPI 1: Custom UPI Settings
  upi1Enabled?: boolean;
  upi1Name?: string;
  upiId?: string;
  upiPayeeName?: string;
  qrCodeUrl?: string;
  upi1Notice?: string;

  // UPI 2: Razorpay Settings
  upi2Enabled?: boolean;
  upi2Name?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  upi2Notice?: string;

  // UPI 3: Custom Web API Gateway Settings
  upi3Enabled?: boolean;
  upi3Name?: string;
  customWebApiUrl?: string;
  customWebApiMerchantKey?: string;
  customWebApiSecret?: string;
  customGatewayWebhookUrl?: string;
  cashfreeAppId?: string;
  cashfreeSecretKey?: string;
  upi3Notice?: string;

  // UPI 4: Direct Fast Channel
  upi4Enabled?: boolean;
  upi4Name?: string;
  upi4UpiId?: string;
  upi4PayeeName?: string;
  upi4QrCodeUrl?: string;
  upi4Notice?: string;

  // UPI 5: Merchant VIP Gateway
  upi5Enabled?: boolean;
  upi5Name?: string;
  upi5UpiId?: string;
  upi5PayeeName?: string;
  upi5QrCodeUrl?: string;
  upi5Notice?: string;

  // UPI 6: Express Backup Gateway
  upi6Enabled?: boolean;
  upi6Name?: string;
  upi6UpiId?: string;
  upi6PayeeName?: string;
  upi6QrCodeUrl?: string;
  upi6Notice?: string;

  // Support & Telegram Configuration
  telegramUsername?: string;
  telegramSupportUrl?: string;
  telegramChannelTitle?: string;
  supportChatEnabled?: boolean;

  minRecharge: number;
  maxRecharge: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFeePercent: number;
  referralRates: {
    level1: number; // e.g. 10%
    level2: number; // e.g. 5%
    level3: number; // e.g. 2%
  };
  checkinRewards: number[]; // Day 1 to 7 e.g. [1, 1.5, 2, 2.5, 3, 4, 6]
  announcementTicker: string;
}

export interface NotificationItem {
  id: string;
  userId?: string; // if undefined, broadcast to all
  title: string;
  message: string;
  type: 'system' | 'recharge' | 'withdrawal' | 'order' | 'referral' | 'checkin';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: string;
  targetType: 'user' | 'product' | 'withdrawal' | 'recharge' | 'theme' | 'ad' | 'setting' | 'admin' | 'auth';
  targetId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}
