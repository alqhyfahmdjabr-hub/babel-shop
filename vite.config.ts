import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import  visualizerModule from 'vite-bundle-visualizer';
import { resolve } from 'path';

const visualizer = (visualizerModule as any).default || visualizerModule;
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      // Bundle analyzer (only in analyze mode)
      process.env.ANALYZE === 'true' && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@services': resolve(__dirname, './src/services'),
        '@utils': resolve(__dirname, './src/utils'),
        '@types': resolve(__dirname, './src/types'),
        '@constants': resolve(__dirname, './src/constants'),
      },
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,

      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-framer': ['framer-motion'],
            'vendor-lucide': ['lucide-react'],
            'vendor-capacitor': [
              '@capacitor/core',
              '@capacitor/preferences',
              '@capacitor/camera',
              '@capacitor/app'
            ],
          },
        },
      },

      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'browser-image-compression',
      ],
      exclude: ['@capacitor/core'],
    },

    server: {
      port: 3000,
      host: true,
      open: true,
      
      // Proxy for API calls during development
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    preview: {
      port: 4173,
      host: true,
    },

    css: {
      devSourcemap: true,
      postcss: {
        plugins: [],
      },
    },

    define: {
      // Environment variables
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    esbuild: {
      // Drop console logs in production
      drop: isProduction ? ['console', 'debugger'] : [],
    },
  };
});
