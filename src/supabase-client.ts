import { Preferences } from '@capacitor/preferences';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

const CapacitorStorage = {
    getItem: async (key: string) => {
        const { value } = await Preferences.get({ key });
        return value;
    },
    setItem: async (key: string, value: string) => {
        await Preferences.set({ key, value });
    },
    removeItem: async (key: string) => {
        await Preferences.remove({ key });
    },
};

// الاتصال المطور (بديل السطر القديم)
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: CapacitorStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});