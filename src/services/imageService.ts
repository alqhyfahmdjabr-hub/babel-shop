import { supabase } from '../supabase-client';
import imageCompression from 'browser-image-compression';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * ط®ط¯ظ…ط© ط¥ط¯ط§ط±ط© ط§ظ„طµظˆط± - Image Service
 * طھطھط¶ظ…ظ† ط¶ط؛ط· ط§ظ„طµظˆط±طŒ ط§ظ„ط±ظپط¹طŒ ظˆط§ظ„طھط­ظ‚ظ‚
 */
export const imageService = {
  /**
   * ط¶ط؛ط· ط§ظ„طµظˆط±ط© ظ‚ط¨ظ„ ط§ظ„ط±ظپط¹
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
   * ط±ظپط¹ طµظˆط±ط© ط¥ظ„ظ‰ Supabase Storage
   */
  async uploadImage(file: File, folder: string = 'products'): Promise<string> {
    try {
      // ط¶ط؛ط· ط§ظ„طµظˆط±ط© ط£ظˆظ„ط§ظ‹
      const compressedFile = await this.compressImage(file);
      
      // ط¥ظ†ط´ط§ط، ط§ط³ظ… ظپط±ظٹط¯ ظ„ظ„ظ…ظ„ظپ
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // ط±ظپط¹ ط§ظ„طµظˆط±ط©
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط§ظ„ط±ط§ط¨ط· ط§ظ„ط¹ط§ظ…
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
   * ط±ظپط¹ طµظˆط±ط© ط§ظ„ط·ظ„ط¨
   */
  async uploadRequestImage(file: File): Promise<string> {
    return this.uploadImage(file, 'requests');
  },

  /**
   * رفع صورة إلهام لتصميم الاستوديو (يرجع الرابط والمسار معاً)
   */
  async uploadStudioInspirationImage(file: File): Promise<UploadResult> {
    try {
      const compressedFile = await this.compressImage(file);
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const path = `studio-inspirations/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(path, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Error uploading studio inspiration image:', error);
      throw error;
    }
  },

  /**
   * ط­ط°ظپ طµظˆط±ط© ظ…ظ† Storage
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
   * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط­ط¬ظ… ط§ظ„طµظˆط±ط©
   */
  validateImageSize(file: File, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  /**
   * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظ†ظˆط¹ ط§ظ„طµظˆط±ط©
   */
  validateImageType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    return allowedTypes.includes(file.type);
  },

  /**
   * ط§ظ„طھط­ظ‚ظ‚ ط§ظ„ظƒط§ظ…ظ„ ظ…ظ† ط§ظ„طµظˆط±ط©
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    if (!this.validateImageType(file)) {
      return { valid: false, error: 'ظٹط¬ط¨ ط§ط®طھظٹط§ط± ظ…ظ„ظپ طµظˆط±ط© (JPEG, PNG, WebP)' };
    }
    
    if (!this.validateImageSize(file)) {
      return { valid: false, error: 'ط­ط¬ظ… ط§ظ„طµظˆط±ط© ظƒط¨ظٹط± ط¬ط¯ط§ظ‹! ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ 5 ظ…ظٹط¬ط§ط¨ط§ظٹطھ' };
    }
    
    return { valid: true };
  }
};
