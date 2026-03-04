import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.babeljewelry.app',
  appName: 'مجوهرات بابل',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      backgroundColor: "#000000"
    }
  }
};

export default config;