// Product Types
export interface Product {
  id: string;
  name: string;
  category: string;
  weight: number;
  priceEstimate: number;
  imageUrl: string;
  description: string;
  karat: 18 | 21 | 24;
}

// Gold Price Types
export interface GoldPrice {
  karat: 18 | 21 | 24;
  buy: number;
  sell: number;
}

// Client Request Types
export interface ClientRequest {
  id: string;
  phone: string;
  weight: number;
  imageUrl?: string;
  notes?: string;
  date: string;
  status?: 'new' | 'pending' | 'processing' | 'completed' | 'cancelled';
  user_id?: string;
  profiles?: { full_name?: string, email?: string };
}

// Contact Info Types
export interface ContactInfo {
  manager: string;
  workers: Array<{
    id: string;
    name: string;
    phone: string;
  }>; // أصبح مصفوفة كائنات تحتوي اسم ورقم
  landlines: string[];
  designer: {
    name: string;
    phone: string;
  };
}

// App Preferences Types
export type ThemeMode = 'dark' | 'light';

export interface AppPreferences {
  theme: ThemeMode;
}

// Global Pricing Settings Types (from Supabase app_settings table)
export type PricingCalcMethod = 'db_prices' | 'from_ounce';

export interface PricingSettings {
  exchangeRate: number;
  calcMethod: PricingCalcMethod;
}

// View State Types
export type ViewState = 'home' | 'catalog' | 'favorites' | 'requests';

// User Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  full_name?: string;
  created_at?: string;
}

// Order Status Types
export type OrderStatus = 'new' | 'pending' | 'processing' | 'completed' | 'cancelled';

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Cache Types
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Image Upload Types
export interface UploadResult {
  url: string;
  path: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
}

// Form Types
export interface ProductFormData {
  name: string;
  category: string;
  weight: number;
  karat: 18 | 21 | 24;
  description: string;
  image?: File;
}

export interface RequestFormData {
  phone: string;
  weight: string;
  notes?: string;
  image?: File;
}

// Settings Types
export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  language: 'ar' | 'en';
  notifications: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Network Types
export interface NetworkState {
  isOnline: boolean;
  isSlowConnection: boolean;
}
