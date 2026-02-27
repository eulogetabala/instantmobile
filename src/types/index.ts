// Types pour l'application Instant+

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  location?: {
    city?: string;
    province?: string;
    country: string;
  };
  preferences: {
    language: 'fr' | 'en' | 'ln' | 'sw';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    interests: string[];
  };
  stats: {
    totalEventsPurchased: number;
    totalAmountSpent: number;
    lastLoginAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  organizer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    bio?: string;
  };
  category: 'concert' | 'seminar' | 'sport' | 'festival' | 'theater' | 'conference' | 'workshop' | 'exhibition' | 'other';
  subcategory?: string;
  tags: string[];
  startDate: string;
  endDate: string;
  timezone: string;
  location: {
    type: 'physical' | 'online' | 'hybrid';
    address?: {
      street?: string;
      city?: string;
      province?: string;
      country: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    onlineUrl?: string;
    streamingUrl?: string;
  };
  media: {
    poster: string;
    gallery: Array<{
      url: string;
      type: 'image' | 'video';
      caption?: string;
    }>;
    trailer?: {
      url: string;
      duration: number;
    };
  };
  streaming: {
    isLive: boolean;
    isReplayAvailable: boolean;
    replayAccess: 'free' | 'paid' | 'purchased_only';
    replayDuration?: number;
    maxViewers: number;
    currentViewers: number;
  };
  pricing: {
    isFree: boolean;
    price?: {
      amount: number;
      currency: 'CDF' | 'USD' | 'EUR';
    };
    earlyBirdPrice?: {
      amount: number;
      validUntil: string;
    };
    groupDiscount?: {
      minQuantity: number;
      discountPercentage: number;
    };
  };
  capacity: {
    total: number;
    available: number;
    reserved: number;
    max?: number;
    current?: number;
  };
  duration?: string;
  status: 'draft' | 'published' | 'live' | 'ended' | 'cancelled' | 'postponed';
  visibility: 'public' | 'private' | 'unlisted';
  isFeatured: boolean;
  stats: {
    views: number;
    likes: number;
    shares: number;
    ticketsSold: number;
    revenue: number;
    averageRating: number;
    totalRatings: number;
  };
  settings: {
    allowChat: boolean;
    allowReactions: boolean;
    requireApproval: boolean;
    autoStart: boolean;
    recordingEnabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  user: string;
  event: string;
  payment: string;
  ticketNumber: string;
  qrCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: 'CDF' | 'USD' | 'EUR';
  status: 'pending' | 'confirmed' | 'used' | 'cancelled' | 'refunded';
  access: {
    canAccessLive: boolean;
    canAccessReplay: boolean;
    accessToken: string;
    accessExpiresAt: string;
  };
  usage: {
    firstAccessAt?: string;
    lastAccessAt?: string;
    totalWatchTime: number;
    accessCount: number;
    isUsed: boolean;
    usedAt?: string;
  };
  metadata: {
    purchaseMethod: 'mobile_money' | 'stripe' | 'paypal' | 'bank_transfer';
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      platform?: string;
    };
    notes?: string;
  };
  validFrom: string;
  validUntil: string;
  refund: {
    isRefundable: boolean;
    refundDeadline: string;
    refundAmount: number;
    refundedAt?: string;
    refundReason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  user: string;
  event: string;
  paymentId: string;
  transactionId?: string;
  amount: number;
  currency: 'CDF' | 'USD' | 'EUR';
  exchangeRate: number;
  method: 'mtn_momo' | 'airtel_money' | 'stripe' | 'paypal' | 'bank_transfer' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  paymentDetails: {
    mobileMoney?: {
      phoneNumber?: string;
      operator?: 'mtn' | 'airtel' | 'orange' | 'vodacom';
      transactionReference?: string;
      externalTransactionId?: string;
    };
    stripe?: {
      paymentIntentId?: string;
      chargeId?: string;
      customerId?: string;
      paymentMethodId?: string;
    };
    paypal?: {
      orderId?: string;
      captureId?: string;
      payerId?: string;
    };
    bankTransfer?: {
      bankName?: string;
      accountNumber?: string;
      reference?: string;
      receiptUrl?: string;
    };
  };
  fees: {
    processingFee: number;
    platformFee: number;
    totalFees: number;
  };
  netAmount: number;
  organizerAmount: number;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    deviceInfo?: {
      type?: string;
      platform?: string;
      version?: string;
    };
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  paidAt?: string;
  expiresAt: string;
  refund: {
    isRefundable: boolean;
    refundDeadline: string;
    refundedAmount: number;
    refundedAt?: string;
    refundReason?: string;
    refundMethod?: 'original_method' | 'bank_transfer' | 'mobile_money';
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
  method?: string;
}

export interface PaginationResponse<T = any> {
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface StreamingAccess {
  channelName: string;
  uid: string;
  token: string;
  expiresAt: string;
  agoraAppId: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  message: string;
  timestamp: string;
  eventId: string;
}

export interface Reaction {
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  emoji: string;
  timestamp: string;
  eventId: string;
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  data?: any;
  timestamp: string;
  read: boolean;
}

// Types pour les formulaires
export interface LoginForm {
  phone: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface EventForm {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  capacity: {
    total: number;
  };
  pricing: {
    isFree: boolean;
    price?: {
      amount: number;
      currency: string;
    };
  };
  location: {
    type: 'physical' | 'online' | 'hybrid';
    address?: {
      city?: string;
      province?: string;
      country: string;
    };
  };
}

// Types pour la navigation
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Guest: undefined;
  GuestTabs: undefined;
  MainTabs: undefined;
  Home: undefined;
  Events: undefined;
  Live: undefined;
  Replays: undefined;
  EventList: undefined;
  LiveList: undefined;
  ReplaysList: undefined;
  EventDetails: { eventId: string };
  Streaming: { eventId: string };
  Payment: { eventId: string; quantity?: number };
  Categories: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
  Profile: undefined;
  EditProfile: undefined;
  Favorites: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  NotificationHistory: undefined;
  UserHistory: undefined;
  Tickets: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Live: undefined;
  Replays: undefined;
  Profile: undefined;
};

export type EventStackParamList = {
  EventList: undefined;
  EventDetails: { eventId: string };
  EventSearch: undefined;
  EventFilters: undefined;
};

