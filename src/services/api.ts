import { supabase } from '../supabase-client';
import { Product, GoldPrice, ClientRequest } from '../types/types';
import { MOCK_PRICES } from '../constants';

// ط£ط³ظ…ط§ط، ط§ظ„ط¬ط¯ط§ظˆظ„ ظƒظ…ط§ ظ‡ظٹ ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
const TABLE_PRODUCTS = 'products';
const TABLE_ORDERS = 'orders';
const TABLE_PRICES = 'prices';
const TABLE_PROFILES = 'profiles';
const TABLE_PRICE_HISTORY = 'price_history';

/**
 * API Service - ط®ط¯ظ…ط© ط§ظ„ط§طھطµط§ظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
 */
export const api = {
  // --- ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط±طھط¨ط© ط§ظ„ظ…ط³طھط®ط¯ظ… ---
  async getUserRole(): Promise<string | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return null;
      }

      const { data, error } = await supabase
        .from(TABLE_PROFILES)
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching role:', error);
        return 'user';
      }

      return data?.role || 'user';
    } catch (err) {
      console.error('Unexpected error:', err);
      return 'user';
    }
  },

  // --- طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ ---
  async updateProfile(id: string, updates: Partial<{ full_name: string; email: string }>): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_PROFILES)
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // --- طھط؛ظٹظٹط± ط±طھط¨ط© ط§ظ„ظ…ط³طھط®ط¯ظ… (ظ„ظ„ظ…ط¯ظٹط± ظپظ‚ط·) ---
  async adminSetUserRole(targetUserId: string, newRole: 'admin' | 'user'): Promise<void> {
    try {
      const { error } = await supabase.rpc('set_user_role', {
        target_user_id: targetUserId,
        new_role: newRole
      });

      if (error) throw error;
    } catch (error) {
      console.error('Security Error changing role:', error);
      throw new Error('ظپط´ظ„ ظپظٹ طھط؛ظٹظٹط± ط§ظ„ط±طھط¨ط©: ظ‚ط¯ ظ„ط§ طھظ…ظ„ظƒ ط§ظ„طµظ„ط§ط­ظٹط© ط§ظ„ظƒط§ظپظٹط©');
    }
  },

  // --- ط§ظ„ظ…ظ†طھط¬ط§طھ ---
  async getProducts(page: number = 0, limit: number = 20): Promise<Product[]> {
    try {
      const from = page * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from(TABLE_PRODUCTS)
        .select('id, name, category, weight, priceEstimate, imageUrl, description, karat')
        .range(from, to)
        .order('id', { ascending: false });

      if (error) throw error;
      
      return (data || []) as Product[];
    } catch (error) {
      console.error('API Error fetching products:', error);
      return [];
    }
  },

  async saveProduct(product: Product): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_PRODUCTS)
        .upsert({
          id: product.id,
          name: product.name,
          category: product.category,
          weight: product.weight,
          priceEstimate: product.priceEstimate,
          imageUrl: product.imageUrl,
          description: product.description,
          karat: product.karat
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Supabase Error saving product:', error);
      throw new Error('Unable to save product to the database');
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_PRODUCTS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Supabase Error deleting product:', error);
      throw new Error('Unable to delete product');
    }
  },

  // --- ط§ظ„ط£ط³ط¹ط§ط± ---
  async getPrices(): Promise<GoldPrice[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_PRICES)
        .select('karat, buy, sell')
        .order('karat', { ascending: false });

      if (error || !data || data.length === 0) {
        console.warn('No prices found, using mock data');
        return MOCK_PRICES;
      }
      
      return data.map(p => ({
        karat: p.karat as 18 | 21 | 24,
        buy: Number(p.buy),
        sell: Number(p.sell)
      }));
    } catch (error) {
      console.error('Error fetching prices:', error);
      return MOCK_PRICES;
    }
  },

  async getLatestOuncePriceUsd(): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from(TABLE_PRICE_HISTORY)
        .select('source_price_per_oz')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('No ounce history found:', error.message);
        return null;
      }

      const ounce = Number(data?.source_price_per_oz);
      return Number.isFinite(ounce) && ounce > 0 ? ounce : null;
    } catch (error) {
      console.error('Error fetching ounce price:', error);
      return null;
    }
  },

  async updatePrices(prices: GoldPrice[]): Promise<void> {
    try {
      
      const { error } = await supabase
        .from(TABLE_PRICES)
        .upsert(prices.map(p => ({
          karat: p.karat,
          buy: p.buy,
          sell: p.sell
        })),{ onConflict: 'karat' });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving prices:', error);
      throw error;
    }
  },

  // --- ط§ظ„ط·ظ„ط¨ط§طھ ---
  async submitOrder(order: Omit<ClientRequest, 'id'>): Promise<ClientRequest> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ظٹط¬ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط£ظˆظ„ط§ظ‹ ظ„ط¥طھظ…ط§ظ… ط§ظ„ط·ظ„ط¨');
      if (!order.imageUrl) {
        throw new Error('Order image is required');
      }

      const { data, error } = await supabase
        .from(TABLE_ORDERS)
        .insert({
          phone: order.phone,
          weight: order.weight,
          imageUrl: order.imageUrl,
          notes: order.notes,
          date: order.date,
          status: 'new',
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data as ClientRequest;
    } catch (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
  },

  async getOrders(): Promise<ClientRequest[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const role = await this.getUserRole();

      let query = supabase
        .from(TABLE_ORDERS)
        .select('id, phone, weight, imageUrl, notes, date, status, user_id');

      if (role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      const orders = (data || []) as ClientRequest[];
      if (orders.length === 0) return [];

      const userIds = Array.from(
        new Set(orders.map((order) => order.user_id).filter((id): id is string => Boolean(id)))
      );

      let profileNameById = new Map<string, string | null>();
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from(TABLE_PROFILES)
          .select('id, full_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles for orders:', profilesError);
        } else {
          profileNameById = new Map(
            (profilesData || []).map((profile) => [profile.id, profile.full_name])
          );
        }
      }

      return orders.map((order) => ({
        ...order,
        profiles: order.user_id
          ? { full_name: profileNameById.get(order.user_id) ?? undefined }
          : undefined
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_ORDERS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  async updateOrderStatus(id: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_ORDERS)
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
};
