export type NavTab = 'home' | 'investments' | 'store' | 'checkin' | 'team' | 'profile';

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  walletBalance: number;
  referralCode: string;
  bankAccount?: BankAccount;
  createdAt?: string;
}

export interface BankAccount {
  accountHolderName: string;
  accountNumber: string;
  maskedAccountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId?: string; // UPI ID / VPA for instant UPI payouts
  updatedAt?: string;
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txId: string;
  remarks?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  type: 'recharge' | 'withdrawal' | 'order' | 'checkin' | 'referral';
  amount: number;
  fee?: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
  referenceId?: string;
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
  colorScheme: string;
  iconType: string;
  stock: number;
  isActive: boolean;
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

export interface CheckinStatus {
  alreadyClaimedToday: boolean;
  currentStreak: number;
  nextDayNumber: number;
  rewardSchedule: number[];
  history: Array<{
    id: string;
    date: string;
    dayNumber: number;
    rewardAmount: number;
    createdAt: string;
  }>;
}

export interface TeamMember {
  id: string;
  name: string;
  mobile?: string;
  joinedAt: string;
}

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalTeamSize: number;
  totalCommission: number;
  rates: {
    level1: number;
    level2: number;
    level3: number;
  };
  level1: { count: number; rate: number; members: TeamMember[] };
  level2: { count: number; rate: number; members: TeamMember[] };
  level3: { count: number; rate: number; members: TeamMember[] };
  recentEarnings: Transaction[];
}

export interface Advertisement {
  id: string;
  title: string;
  adType?: 'promo_banner' | 'adsterra_script' | 'custom_html';
  scriptCode?: string;
  position: 'home_top' | 'home_middle' | 'home_bottom' | 'store_banner' | 'product_banner' | 'checkin_banner' | 'referral_banner' | 'profile_banner';
  imageUrl?: string;
  bannerType?: 'gradient_card' | 'custom_image' | 'adsterra_script';
  badgeText?: string;
  headline: string;
  subtext: string;
  buttonText?: string;
  actionUrl?: string;
  priority: number;
  mobileVisible: boolean;
  desktopVisible: boolean;
  isEnabled: boolean;
  startDate?: string;
  endDate?: string;
  clicks?: number;
  impressions?: number;
}

export interface AdsterraSlotConfig {
  isEnabled: boolean;
  scriptCode: string;
  bannerSize: string;
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
  updatedAt?: string;
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
  borderRadius: string;
  mode: 'light' | 'dark';
  websiteName: string;
  logoText: string;
  logoUrl?: string;
  tagline: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'recharge' | 'withdrawal' | 'order' | 'referral' | 'checkin';
  isRead: boolean;
  createdAt: string;
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
    level1: number;
    level2: number;
    level3: number;
  };
  checkinRewards: number[];
  announcementTicker: string;
}

export type AdminRole = 'super_admin' | 'admin' | 'finance_admin' | 'content_admin';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  fullName: string;
  role: AdminRole;
  isActive?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorPin?: string;
  lastLoginAt?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}
