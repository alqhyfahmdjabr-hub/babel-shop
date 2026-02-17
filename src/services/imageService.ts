import { supabase } from '../supabase-client';
import imageCompression from 'browser-image-compression';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * خدمة إدارة الصور - Image Service
 * تتضمن ضغط الصور، الرفع، والتحقق
 */
export const imageService = {
  /**
   * ضغط الصورة قبل الرفع
   */
  async compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      return file;
    }
  },

  /**
   * رفع صورة إلى Supabase Storage
   */
  async uploadImage(file: File, folder: string = 'products'): Promise<string> {
    try {
      // ضغط الصورة أولاً
      const compressedFile = await this.compressImage(file);
      
      // إنشاء اسم فريد للملف
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // رفع الصورة
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // الحصول على الرابط العام
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  /**
   * رفع صورة الطلب
   */
  async uploadRequestImage(file: File): Promise<string> {
    return this.uploadImage(file, 'requests');
  },

  /**
   * حذف صورة من Storage
   */
  async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('products')
        .remove([path]);

      if (error) {
        console.warn('Error deleting image:', error);
      }
    } catch (error) {
      console.warn('Error deleting image:', error);
    }
  },

  /**
   * التحقق من حجم الصورة
   */
  validateImageSize(file: File, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  /**
   * التحقق من نوع الصورة
   */
  validateImageType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    return allowedTypes.includes(file.type);
  },

  /**
   * التحقق الكامل من الصورة
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    if (!this.validateImageType(file)) {
      return { valid: false, error: 'يجب اختيار ملف صورة (JPEG, PNG, WebP)' };
    }
    
    if (!this.validateImageSize(file)) {
      return { valid: false, error: 'حجم الصورة كبير جداً! الحد الأقصى 5 ميجابايت' };
    }
    
    return { valid: true };
  }
};