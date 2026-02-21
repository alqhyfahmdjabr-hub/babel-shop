import { supabase } from '../supabase-client';
import { Product, GoldPrice, ClientRequest } from '../types/types';
import { MOCK_PRICES } from '../constants';

// أسماء الجداول كما هي في قاعدة البيانات
const TABLE_PRODUCTS = 'products';
const TABLE_ORDERS = 'orders';
const TABLE_PRICES = 'prices';
const TABLE_PROFILES = 'profiles';

/**
 * API Service - خدمة الاتصال بقاعدة البيانات
 */
export const api = {
 // --- التحقق الآمن من كلمة مرور المدير عبر قاعدة البيانات ---
  async verifyAdminPassword(inputPassword: string): Promise<boolean> {
    try {
      // إرسال الرقم الذي كتبه المستخدم إلى الحارس (الدالة) الذي صنعناه في Supabase
      const { data, error } = await supabase.rpc('verify_admin_password', {
        input_password: inputPassword
      });

      if (error) {
        console.error('Error verifying admin password:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('Unexpected error verifying password:', err);
      return false;
    }
  },
  // --- التحقق من رتبة المستخدم ---
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

  // --- تحديث بيانات الملف الشخصي ---
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

  // --- تغيير رتبة المستخدم (للمدير فقط) ---
  async adminSetUserRole(targetUserId: string, newRole: 'admin' | 'user'): Promise<void> {
    try {
      const { error } = await supabase.rpc('set_user_role', {
        target_user_id: targetUserId,
        new_role: newRole
      });

      if (error) throw error;
    } catch (error) {
      console.error('Security Error changing role:', error);
      throw new Error('فشل في تغيير الرتبة: قد لا تملك الصلاحية الكافية');
    }
  },

  // --- المنتجات ---
  async getProducts(page: number = 0, limit: number = 1000): Promise<Product[]> {
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

  // --- الأسعار ---
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

  // --- الطلبات ---
  async submitOrder(order: Omit<ClientRequest, 'id'>): Promise<ClientRequest> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً لإتمام الطلب');

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

      let query = supabase.from(TABLE_ORDERS)
        .select('id, phone, weight, imageUrl, notes, date, status, user_id, profiles(full_name)');

      if (role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      
     return (data || []) as ClientRequest[];
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