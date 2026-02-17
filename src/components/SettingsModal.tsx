import { useState, useEffect } from 'react';
import { PATTERNS } from '../constants';
import { X, Lock, Paintbrush, Sliders, LogOut } from 'lucide-react';
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
  const [localOpacity, setLocalOpacity] = useState(preferences.backgroundOpacity);

  // ✅ تحديث القيمة المحلية عند تغير الـ props
  useEffect(() => {
    setLocalOpacity(preferences.backgroundOpacity);
  }, [preferences.backgroundOpacity]);

  const handlePatternSelect = (url: string) => {
    const newPrefs = { ...preferences, backgroundPattern: url };
    onUpdatePreferences(newPrefs);
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalOpacity(val);
  };

  const handleOpacityCommit = () => {
    const newPrefs = { ...preferences, backgroundOpacity: localOpacity };
    onUpdatePreferences(newPrefs);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative bg-[#0F0F0F] border border-gold-600/30 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up">

        {/* Header */}
        <div className="bg-neutral-900/80 p-6 border-b border-gray-800/50 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            تفضيلات العرض
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto max-h-[75vh]">

          {/* Background Selection Section */}
          <section>
            <h3 className="text-gray-400 text-[10px] mb-4 tracking-widest uppercase flex items-center gap-2 font-bold">
              <Paintbrush className="w-4 h-4 text-gold-600" />
              نمط النقش والخلفية
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {PATTERNS.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => handlePatternSelect(pattern.url)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500 group ${preferences.backgroundPattern === pattern.url ? 'border-gold-500 scale-105 shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-gray-800 hover:border-gray-600'}`}
                >
                  <div className="absolute inset-0 bg-neutral-900"></div>
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{ backgroundImage: `url(${pattern.url})`, backgroundSize: 'cover' }}
                  ></div>

                  {preferences.backgroundPattern === pattern.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gold-500/10 backdrop-blur-[1px]">
                      <div className="w-2 h-2 bg-gold-500 rounded-full shadow-[0_0_10px_#D4AF37]"></div>
                    </div>
                  )}

                  <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-gold-200/70 py-1 text-center truncate px-1 font-sans">
                    {pattern.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Opacity Slider */}
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
              <div className="flex justify-between text-[10px] text-gray-500 mb-3 font-bold tracking-wider">
                <span>وضوح النقش</span>
                <span className="text-gold-500/80">{Math.round(localOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.01"
                value={localOpacity}
                onChange={handleOpacityChange}
                onMouseUp={handleOpacityCommit}
                onTouchEnd={handleOpacityCommit}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-gold-600"
              />
            </div>
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