import { Suspense, lazy } from 'react';
import { X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { AppPreferences, ContactInfo, GoldPrice, PricingSettings, Product } from '../types/types';

const AdminPanel = lazy(() => import('../components/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const LoginScreen = lazy(() => import('../LoginScreen').then((m) => ({ default: m.default })));
const ProductModal = lazy(() => import('../components/ProductModal').then((m) => ({ default: m.ProductModal })));
const SettingsModal = lazy(() => import('../components/SettingsModal').then((m) => ({ default: m.SettingsModal })));

type AppModalsProps = {
  fallback: React.ReactNode;

  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  preferences: AppPreferences;
  handleUpdatePreferences: (prefs: AppPreferences) => void;
  handleOpenAdmin: () => void;
  handleLogout: () => void;

  isAuthPromptOpen: boolean;
  closeAuthPrompt: () => void;

  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  currentPrices: GoldPrice[];
  products: Product[];
  pricingSettings: PricingSettings;
  refreshData: () => void;

  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  contact: ContactInfo;
  session: Session | null;
  handleRequireCheckoutAuth: () => void;
};

export const AppModals: React.FC<AppModalsProps> = ({
  fallback,
  isSettingsOpen,
  setIsSettingsOpen,
  preferences,
  handleUpdatePreferences,
  handleOpenAdmin,
  handleLogout,
  isAuthPromptOpen,
  closeAuthPrompt,
  isAdminOpen,
  setIsAdminOpen,
  currentPrices,
  products,
  pricingSettings,
  refreshData,
  selectedProduct,
  setSelectedProduct,
  contact,
  session,
  handleRequireCheckoutAuth
}) => {
  return (
    <>
      {isSettingsOpen && (
        <Suspense fallback={fallback}>
          <SettingsModal
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onOpenAdmin={handleOpenAdmin}
            onClose={() => setIsSettingsOpen(false)}
            onLogout={handleLogout}
          />
        </Suspense>
      )}

      {isAuthPromptOpen && (
        <div className="fixed inset-0 z-[90] animate-fade-in">
          <button
            onClick={closeAuthPrompt}
            className="absolute z-[95] p-2 bg-black/60 text-white rounded-full border border-white/20 hover:bg-black/80 transition-colors top-[max(1.25rem,env(safe-area-inset-top,0px))] right-[max(1.25rem,env(safe-area-inset-right,0px))]"
            aria-label="Close login"
            title="Close login"
          >
            <X className="w-5 h-5" />
          </button>
          <Suspense fallback={fallback}>
            <LoginScreen />
          </Suspense>
        </div>
      )}

      {isAdminOpen && (
        <Suspense fallback={fallback}>
          <AdminPanel
            prices={currentPrices}
            products={products}
            pricingSettings={pricingSettings}
            onUpdatePrices={() => refreshData()}
            onUpdateProducts={() => refreshData()}
            onClose={() => setIsAdminOpen(false)}
          />
        </Suspense>
      )}

      {selectedProduct && (
        <Suspense fallback={fallback}>
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            contact={contact}
            isAuthenticated={!!session}
            onRequireAuth={handleRequireCheckoutAuth}
          />
        </Suspense>
      )}
    </>
  );
};

