import { Preferences } from '@capacitor/preferences';
import { AppPreferences } from '../types/types';
import { DEFAULT_BACKGROUND_PATTERN_URL } from '../constants/background';

const STORAGE_KEYS = {
  FAVORITES: 'favorites',
  PREFERENCES: 'app_preferences',
  CACHE: 'app_cache'
};

const LEGACY_SERVER_BACKED_KEYS = ['requests'] as const;

// --- Favorites ---

export const getFavorites = async (): Promise<string[]> => {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.FAVORITES });
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

export const toggleFavorite = async (productId: string): Promise<string[]> => {
  try {
    const current = await getFavorites();
    let updated: string[];
    
    if (current.includes(productId)) {
      updated = current.filter(id => id !== productId);
    } else {
      updated = [...current, productId];
    }
    
    await Preferences.set({ 
      key: STORAGE_KEYS.FAVORITES, 
      value: JSON.stringify(updated) 
    });
    
    return updated;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return [];
  }
};

export const isFavorite = async (productId: string): Promise<boolean> => {
  const favorites = await getFavorites();
  return favorites.includes(productId);
};

export const clearFavorites = async (): Promise<void> => {
  await Preferences.remove({ key: STORAGE_KEYS.FAVORITES });
};

// --- App Preferences ---

const DEFAULT_PREFERENCES: AppPreferences = {
  backgroundPattern: DEFAULT_BACKGROUND_PATTERN_URL,
  backgroundOpacity: 0.03
};

export const getAppPreferences = async (): Promise<AppPreferences> => {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.PREFERENCES });
    if (value) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(value) };
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

export const saveAppPreferences = async (prefs: AppPreferences): Promise<void> => {
  try {
    await Preferences.set({ 
      key: STORAGE_KEYS.PREFERENCES, 
      value: JSON.stringify(prefs) 
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

// --- Cache Management ---

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const setCache = async <T>(key: string, data: T, ttlMinutes: number = 60): Promise<void> => {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    };
    
    const currentCache = await getCache<T>();
    currentCache[key] = cacheItem;
    
    await Preferences.set({
      key: STORAGE_KEYS.CACHE,
      value: JSON.stringify(currentCache)
    });
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

export const getCache = async <T>(): Promise<Record<string, CacheItem<T>>> => {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.CACHE });
    return value ? JSON.parse(value) : {};
  } catch (error) {
    return {};
  }
};

export const getCachedItem = async <T>(key: string): Promise<T | null> => {
  try {
    const cache = await getCache<T>();
    const item = cache[key];
    
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      delete cache[key];
      await Preferences.set({
        key: STORAGE_KEYS.CACHE,
        value: JSON.stringify(cache)
      });
      return null;
    }
    
    return item.data;
  } catch (error) {
    return null;
  }
};

export const clearCache = async (): Promise<void> => {
  await Preferences.remove({ key: STORAGE_KEYS.CACHE });
};

export const clearLegacyServerBackedData = async (): Promise<void> => {
  try {
    await Promise.all(
      LEGACY_SERVER_BACKED_KEYS.map((key) => Preferences.remove({ key }))
    );
  } catch (error) {
    console.error('Error clearing legacy server-backed data:', error);
  }
};

// --- Clear All Data ---

export const clearAllData = async (): Promise<void> => {
  await Preferences.clear();
};
