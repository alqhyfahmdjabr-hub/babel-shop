import { useEffect, useState } from 'react';
import { Check, Lock, LogOut, Paintbrush, Sliders, Sparkles, X } from 'lucide-react';
import { PATTERNS } from '../constants/patterns';
import { AppPreferences } from '../types/types';

interface SettingsModalProps {
  preferences: AppPreferences;
  onUpdatePreferences: (prefs: AppPreferences) => void;
  onOpenAdmin: () => void;
  onClose: () => void;
  onLogout: () => void;
}

const OPACITY_PRESETS = [
  { label: 'هادئ', value: 0.02 },
  { label: 'متوازن', value: 0.04 },
  { label: 'أوضح', value: 0.06 }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  preferences,
  onUpdatePreferences,
  onOpenAdmin,
  onClose,
  onLogout
}) => {
  const [localOpacity, setLocalOpacity] = useState(preferences.backgroundOpacity);

  useEffect(() => {
    setLocalOpacity(preferences.backgroundOpacity);
  }, [preferences.backgroundOpacity]);

  const handlePatternSelect = (url: string) => {
    onUpdatePreferences({ ...preferences, backgroundPattern: url });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalOpacity(parseFloat(e.target.value));
  };

  const commitOpacity = (value: number = localOpacity) => {
    onUpdatePreferences({ ...preferences, backgroundOpacity: value });
  };

  const patternSelectionDisabled = !preferences.backgroundPattern;

  return (
    <div className="fixed inset-0 z-[60] modal-safe flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      <div className="relative max-h-[min(82dvh,44rem)] w-full max-w-md overflow-hidden rounded-[2.5rem] border border-gold-600/30 bg-[#0F0F0F] shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between border-b border-gray-800/50 bg-neutral-900/80 p-6">
          <h2 className="flex items-center gap-2 text-xl font-serif font-bold text-gold-500">
            <Sliders className="h-5 w-5" />
            تفضيلات العرض
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10"
            aria-label="إغلاق"
            title="إغلاق"
          >
            <X className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-8 overflow-y-auto p-6">
          <section>
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <Paintbrush className="h-4 w-4 text-gold-600" />
                نمط النقش والخلفية
              </h3>
              <p className="mt-2 text-xs leading-6 text-gray-500">
                النقوشات الهادئة تخدم هوية المجوهرات أفضل. الخيار الموصى به هو
                <span className="mx-1 text-gold-300">أرابيسك هادئ</span>
                مع وضوح بين 2% و5%.
              </p>
            </div>

            <div className="mb-6 space-y-3">
              {PATTERNS.map((pattern) => {
                const isSelected = preferences.backgroundPattern === pattern.url;
                const hasPattern = Boolean(pattern.url);

                return (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => handlePatternSelect(pattern.url)}
                    className={`flex w-full items-center gap-4 rounded-3xl border p-3 text-right transition-all duration-300 ${
                      isSelected
                        ? 'border-gold-500/50 bg-gold-500/10 shadow-[0_0_20px_rgba(212,175,55,0.12)]'
                        : 'border-white/5 bg-black/20 hover:border-gold-500/20 hover:bg-white/[0.03]'
                    }`}
                    aria-label={pattern.name}
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/5 bg-[#111111]">
                      {hasPattern ? (
                        <div
                          className="absolute inset-0 bg-repeat opacity-80"
                          style={{
                            backgroundImage: `url('${pattern.url}')`,
                            backgroundSize: '120px'
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#191919] to-[#0B0B0B]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-100">{pattern.name}</span>
                          {pattern.recommended ? (
                            <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-2 py-0.5 text-[10px] font-bold text-gold-300">
                              موصى به
                            </span>
                          ) : null}
                        </div>
                        {isSelected ? <Check className="h-4 w-4 text-gold-400" /> : null}
                      </div>

                      {pattern.description ? (
                        <p className="mt-1 text-[11px] text-gray-500">{pattern.description}</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              className={`rounded-2xl border border-white/5 bg-black/40 p-5 shadow-inner transition-opacity ${
                patternSelectionDisabled ? 'opacity-50' : ''
              }`}
            >
              <div className="mb-3 flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-500">
                <span>وضوح النقش</span>
                <span className="text-gold-500/80">{Math.round(localOpacity * 100)}%</span>
              </div>

              <input
                type="range"
                min="0"
                max="0.12"
                step="0.01"
                value={localOpacity}
                onChange={handleOpacityChange}
                onMouseUp={() => commitOpacity()}
                onTouchEnd={() => commitOpacity()}
                onKeyUp={() => commitOpacity()}
                disabled={patternSelectionDisabled}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-800 accent-gold-600 disabled:cursor-not-allowed"
              />

              <div className="mt-4 grid grid-cols-3 gap-2">
                {OPACITY_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setLocalOpacity(preset.value);
                      commitOpacity(preset.value);
                    }}
                    disabled={patternSelectionDisabled}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      Math.abs(localOpacity - preset.value) < 0.005
                        ? 'border-gold-500/40 bg-gold-500/10 text-gold-200'
                        : 'border-white/5 bg-white/[0.03] text-gray-400 hover:text-gray-200'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="pt-2">
            <h3 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              إعدادات متقدمة
            </h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="group flex w-full items-center justify-between rounded-2xl border border-gray-800 bg-neutral-900/40 p-4 transition-all duration-300 hover:border-gold-500/30 hover:bg-neutral-800"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-gold-500/10 bg-gold-500/5 p-2.5 transition-colors group-hover:bg-gold-500/10">
                  <Lock className="h-5 w-5 text-gold-600" strokeWidth={1.5} />
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-gray-200">بوابة الإدارة</span>
                  <span className="block text-[10px] text-gray-500">خاص بمالك التطبيق</span>
                </div>
              </div>
              <Sparkles className="h-4 w-4 text-gold-500/60 transition-transform group-hover:scale-110" />
            </button>
          </section>

          <section className="pb-2 pt-2">
            <h3 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              الحساب
            </h3>
            <button
              type="button"
              onClick={onLogout}
              className="group flex w-full items-center justify-between rounded-2xl border border-red-500/10 bg-red-500/5 p-4 transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/10"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-red-500/10 bg-red-500/10 p-2.5 transition-colors group-hover:bg-red-500/20">
                  <LogOut className="h-5 w-5 text-red-500" strokeWidth={1.5} />
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-red-400">تسجيل الخروج</span>
                  <span className="block text-[10px] text-gray-600">الخروج من الحساب الحالي</span>
                </div>
              </div>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
