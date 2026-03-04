import { supabase } from '../supabase-client';
import imageCompression from 'browser-image-compression';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Image management service
 * Handles compression, upload, and validation
 */
export const imageService = {
  /**
   * Compress image before upload
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
   * Upload image to Supabase Storage
   */
  async uploadImage(file: File, folder: string = 'products'): Promise<string> {
    try {
      // Compress image first
      const compressedFile = await this.compressImage(file);
      
      // Generate unique file name
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload image
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Build public URL
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
   * Upload request image
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
   * Delete image from Storage
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
   * Validate image size
   */
  validateImageSize(file: File, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  /**
   * Validate image type
   */
  validateImageType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    return allowedTypes.includes(file.type);
  },

  /**
   * Full image validation
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    if (!this.validateImageType(file)) {
      return { valid: false, error: '\u064a\u062c\u0628 \u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0644\u0641 \u0635\u0648\u0631\u0629 (JPEG, PNG, WebP)' };
    }
    
    if (!this.validateImageSize(file)) {
      return { valid: false, error: '\u062d\u062c\u0645 \u0627\u0644\u0635\u0648\u0631\u0629 \u0643\u0628\u064a\u0631 \u062c\u062f\u0627\u064b! \u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 5 \u0645\u064a\u062c\u0627\u0628\u0627\u064a\u062a' };
    }
    
    return { valid: true };
  }
};
