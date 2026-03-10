import { X, Lock, Sliders, LogOut, SunMedium, MoonStar } from 'lucide-react';
import { AppPreferences } from '../types/types';


interface SettingsModalProps {
  preferences: AppPreferences;
  onUpdatePreferences: (prefs: AppPreferences) => void;
  onOpenAdmin: () => void;
  onClose: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  preferences,
  onUpdatePreferences,
  onOpenAdmin,
  onClose,
  onLogout
}) => {
  const isLight = preferences.theme === 'light';

  const handleThemeToggle = () => {
    onUpdatePreferences({
      ...preferences,
      theme: isLight ? 'dark' : 'light'
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative app-surface border border-gold-600/30 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up">

        {/* Header */}
        <div className="app-surface p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            تفضيلات العرض
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="إغلاق"
            title="إغلاق"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto max-h-[75vh]">

          {/* Theme Section */}
          <section>
            <h3 className="settings-section-title">
              {isLight ? (
                <SunMedium className="w-4 h-4 text-[var(--gold-accent)]" />
              ) : (
                <MoonStar className="w-4 h-4 text-[var(--gold-accent)]" />
              )}
              المظهر
            </h3>

            <button onClick={handleThemeToggle} className="theme-toggle-card" type="button">
              <div className="text-right">
                <span className="block text-[10px] text-[var(--text-muted)]">الوضع الحالي</span>
                <span className="block text-sm font-bold text-[var(--text-color)]">
                  {isLight ? 'الوضع الفاتح' : 'الوضع الداكن'}
                </span>
              </div>

              <div className={`theme-switch ${isLight ? 'is-light' : ''}`}>
                <span className="theme-switch-thumb" />
              </div>
            </button>
          </section>

          {/* Admin Access Section */}
          <section className="pt-2">
            <h3 className="text-gray-500 text-[10px] mb-3 tracking-widest uppercase font-bold px-1">إعدادات متقدمة</h3>
            <button
              onClick={() => { onClose(); onOpenAdmin(); }}
              className="w-full flex items-center justify-between p-4 bg-neutral-900/40 border border-gray-800 rounded-2xl hover:border-gold-500/30 hover:bg-neutral-800 transition-all duration-500 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gold-500/5 rounded-xl group-hover:bg-gold-500/10 transition-colors border border-gold-500/10">
                  <Lock className="w-5 h-5 text-gold-600" strokeWidth={1.5} />
                </div>
                <div className="text-right">
                  <span className="block text-gray-200 font-bold text-sm">بوابة الإدارة</span>
                  <span className="block text-gray-500 text-[10px]">خاص بمالك التطبيق</span>
                </div>
              </div>
              <div className="text-gray-600 group-hover:text-gold-500 transition-all group-hover:translate-x-[-4px]">←</div>
            </button>
          </section>

          {/* Account & Logout Section */}
          <section className="pt-2 pb-2">
            <h3 className="text-gray-500 text-[10px] mb-3 tracking-widest uppercase font-bold px-1">الحساب</h3>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors border border-red-500/10">
                  <LogOut className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                </div>
                <div className="text-right">
                  <span className="block text-red-400 font-bold text-sm">تسجيل الخروج</span>
                  <span className="block text-gray-600 text-[10px]">الخروج من الحساب الحالي</span>
                </div>
              </div>
            </button>
          </section>

        </div>
      </div>
    </div>
  );
};
