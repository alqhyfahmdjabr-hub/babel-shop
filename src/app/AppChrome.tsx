import { ChevronUp, ClipboardList, Grid, Heart, Home, RefreshCw } from 'lucide-react';
import type { ViewState } from '../types/types';

type AppChromeProps = {
  activeTab: ViewState;
  handleTabChange: (tab: ViewState) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshData: () => void;
  showScrollTop: boolean;
  scrollToTop: () => void;
};

export const AppChrome: React.FC<AppChromeProps> = ({
  activeTab,
  handleTabChange,
  isLoading,
  isRefreshing,
  refreshData,
  showScrollTop,
  scrollToTop
}) => {
  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed h-20 bg-[#080808]/80 backdrop-blur-xl border border-white/10 rounded-full z-40 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] max-w-md mx-auto left-[max(1.5rem,env(safe-area-inset-left,0px))] right-[max(1.5rem,env(safe-area-inset-right,0px))] bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex justify-around items-center h-full px-2">
          {[
            { id: 'home', icon: Home, label: 'الرئيسية' },
            { id: 'catalog', icon: Grid, label: 'المعرض' },
            { id: 'requests', icon: ClipboardList, label: 'الطلبات' },
            { id: 'favorites', icon: Heart, label: 'المفضلة' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as ViewState)}
              className="flex flex-col items-center justify-center w-16 h-full space-y-1.5 transition-all duration-500 group relative"
            >
              {activeTab === item.id && (
                <div className="absolute top-0 w-8 h-1 bg-gold-500 rounded-b-full shadow-[0_2px_10px_rgba(212,175,55,0.5)]" />
              )}
              <item.icon
                className={`w-5 h-5 transition-transform duration-500 ${
                  activeTab === item.id
                    ? '-translate-y-1 text-gold-400 scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                    : 'text-gray-600 group-hover:text-gray-400 group-hover:-translate-y-0.5'
                }`}
                strokeWidth={activeTab === item.id ? 2 : 1.5}
                fill={activeTab === item.id && item.id === 'favorites' ? 'currentColor' : 'none'}
              />
              <span
                className={`text-[9px] font-bold tracking-wide transition-all duration-300 ${
                  activeTab === item.id
                    ? 'text-gold-100 opacity-100 translate-y-0'
                    : 'text-gray-600 opacity-0 translate-y-2'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#020202] border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="h-6 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-[9px] text-gray-500">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLoading || isRefreshing
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'
            }`}
          />
          <span className="font-sans font-medium tracking-wide">
            {activeTab === 'home'
              ? 'الرئيسية'
              : activeTab === 'catalog'
                ? 'المعرض العام'
                : activeTab === 'requests'
                  ? 'قسم الطلبات الخاصة'
                  : 'المفضلة'}
          </span>
        </div>
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-[9px] text-gold-600 hover:text-gold-400 transition-colors group"
        >
          <span>تحديث البيانات</span>
          <RefreshCw
            className={`w-2.5 h-2.5 ${
              isRefreshing
                ? 'animate-spin text-gold-400'
                : 'group-hover:rotate-180 transition-transform duration-500'
            }`}
          />
        </button>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed w-10 h-10 bg-gold-600/20 backdrop-blur-sm border border-gold-500/30 rounded-full flex items-center justify-center text-gold-400 hover:bg-gold-600/30 transition-all z-30 animate-fade-in bottom-[calc(7rem+env(safe-area-inset-bottom,0px))] right-[max(1.5rem,env(safe-area-inset-right,0px))]"
          aria-label="العودة للأعلى"
          title="العودة للأعلى"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

