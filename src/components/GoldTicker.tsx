import { useEffect, useRef, useState } from 'react';
import { GoldPrice } from '../types/types';
import { ArrowDownLeft, ArrowUpRight, Activity } from 'lucide-react';

interface GoldTickerProps {
  prices: GoldPrice[];
  liveOunceUsd: number | null;
}

const PriceCard: React.FC<{ price: GoldPrice }> = ({ price }) => {
  const prevBuy = useRef(price.buy);
  const prevSell = useRef(price.sell);
  const lastRealBuyRef = useRef(price.buy);
  const lastRealSellRef = useRef(price.sell);
  const lockTimerRef = useRef<number | null>(null);
  const [buyAnim, setBuyAnim] = useState('');
  const [sellAnim, setSellAnim] = useState('');
  const SAR_MULTIPLIER = 3.8;
  const buySar = price.buy * SAR_MULTIPLIER;
  const sellSar = price.sell * SAR_MULTIPLIER;
  const [displayBuySar, setDisplayBuySar] = useState(buySar);
  const [displaySellSar, setDisplaySellSar] = useState(sellSar);
  const [isLockedToReal, setIsLockedToReal] = useState(false);

  useEffect(() => {
    if (price.buy > prevBuy.current) {
      setBuyAnim('animate-flash-green');
    } else if (price.buy < prevBuy.current) {
      setBuyAnim('animate-flash-red');
    } else {
      setBuyAnim('');
    }
    prevBuy.current = price.buy;

    const timer = setTimeout(() => setBuyAnim(''), 2000);
    return () => clearTimeout(timer);
  }, [price.buy]);

  useEffect(() => {
    if (price.sell > prevSell.current) {
      setSellAnim('animate-flash-green');
    } else if (price.sell < prevSell.current) {
      setSellAnim('animate-flash-red');
    } else {
      setSellAnim('');
    }
    prevSell.current = price.sell;

    const timer = setTimeout(() => setSellAnim(''), 2000);
    return () => clearTimeout(timer);
  }, [price.sell]);

  useEffect(() => {
    const realChanged =
      price.buy !== lastRealBuyRef.current || price.sell !== lastRealSellRef.current;

    setDisplayBuySar(buySar);
    setDisplaySellSar(sellSar);

    if (realChanged) {
      setIsLockedToReal(true);
      if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = window.setTimeout(() => {
        setIsLockedToReal(false);
      }, 10000);
    }

    lastRealBuyRef.current = price.buy;
    lastRealSellRef.current = price.sell;
  }, [price.buy, price.sell, buySar, sellSar]);

  useEffect(() => {
    if (isLockedToReal) return;

    let jitterTimer: number | null = null;
    const scheduleJitter = () => {
      jitterTimer = window.setTimeout(() => {
        setDisplayBuySar(visualNudge(buySar, 0.001));
        setDisplaySellSar(visualNudge(sellSar, 0.001));
        scheduleJitter();
      }, 2000 + Math.random() * 2000);
    };

    scheduleJitter();
    return () => {
      if (jitterTimer) window.clearTimeout(jitterTimer);
    };
  }, [isLockedToReal, buySar, sellSar]);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
    };
  }, []);

  return (
    <div className={`rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#111111] via-[#0B0B0B] to-[#141414] p-4 md:p-5 shadow-[0_10px_30px_-18px_rgba(255,223,0,0.45)] transition-all duration-500 ${isLockedToReal ? 'ring-1 ring-[#FFDF00]/60 shadow-[0_0_35px_rgba(255,223,0,0.28)]' : ''}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl border border-[#D4AF37]/30 bg-[#17130a] px-3 py-1.5 text-sm font-serif font-bold tracking-wide text-[#F6D574]">
          عيار {price.karat}
        </div>
        <span className="text-[10px] uppercase tracking-[0.24em] text-[#8f7d50]">Spot Card</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl border border-white/5 bg-black/30 p-3 text-center transition-all duration-1000 ${buyAnim}`}>
          <div className="mb-1 flex items-center justify-center gap-1 text-[10px] tracking-[0.18em] text-gray-400">
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span>شراء</span>
          </div>
          <p className="font-sans text-lg font-medium tracking-wide text-gray-200">
            {displayBuySar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
          </p>
        </div>

        <div className={`rounded-xl border border-[#D4AF37]/25 bg-[#1a1302]/45 p-3 text-center transition-all duration-1000 ${sellAnim}`}>
          <div className="mb-1 flex items-center justify-center gap-1 text-[10px] tracking-[0.18em] text-[#D4AF37]">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>بيع</span>
          </div>
          <p className="bg-gradient-to-r from-[#FFE8A3] via-[#FFDF00] to-[#D4AF37] bg-clip-text text-lg font-bold tracking-wide text-transparent">
            {displaySellSar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
          </p>
        </div>
      </div>
    </div>
  );
};

const USD_TO_SAR = 3.75;

const formatMoney = (value: number, currency: 'USD' | 'SAR') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);

const visualNudge = (base: number, percent = 0.001) =>
  Math.max(0, base + (Math.random() * 2 - 1) * base * percent);

export const GoldTicker: React.FC<GoldTickerProps> = ({ prices, liveOunceUsd }) => {
  const liveUsd = typeof liveOunceUsd === 'number' && Number.isFinite(liveOunceUsd) && liveOunceUsd > 0
    ? liveOunceUsd
    : null;
  const liveSar = liveUsd ? liveUsd * USD_TO_SAR : null;
  const [displayLiveUsd, setDisplayLiveUsd] = useState<number | null>(liveUsd);
  const [displayLiveSar, setDisplayLiveSar] = useState<number | null>(liveSar);
  const [isOunceLockedToReal, setIsOunceLockedToReal] = useState(false);
  const prevRealOunceRef = useRef<number | null>(liveUsd);
  const ounceLockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const realChanged = liveUsd !== prevRealOunceRef.current;
    prevRealOunceRef.current = liveUsd;

    setDisplayLiveUsd(liveUsd);
    setDisplayLiveSar(liveSar);

    if (realChanged && liveUsd !== null) {
      setIsOunceLockedToReal(true);
      if (ounceLockTimerRef.current) window.clearTimeout(ounceLockTimerRef.current);
      ounceLockTimerRef.current = window.setTimeout(() => {
        setIsOunceLockedToReal(false);
      }, 10000);
    }
  }, [liveUsd, liveSar]);

  useEffect(() => {
    if (isOunceLockedToReal) return;

    let jitterTimer: number | null = null;
    const scheduleJitter = () => {
      jitterTimer = window.setTimeout(() => {
        setDisplayLiveUsd(liveUsd === null ? null : visualNudge(liveUsd, 0.0008));
        setDisplayLiveSar(liveSar === null ? null : visualNudge(liveSar, 0.0008));
        scheduleJitter();
      }, 2000 + Math.random() * 2000);
    };

    scheduleJitter();
    return () => {
      if (jitterTimer) window.clearTimeout(jitterTimer);
    };
  }, [isOunceLockedToReal, liveUsd, liveSar]);

  useEffect(() => {
    return () => {
      if (ounceLockTimerRef.current) window.clearTimeout(ounceLockTimerRef.current);
    };
  }, []);

  return (
    <div className="mb-12 w-full">
      <div className="mb-4 text-center">
        <h3 className="font-serif text-xl tracking-wide text-[#FFDF00] md:text-2xl">
          أسعار الذهب العالمية المحدثة لحظياً
        </h3>
        <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-gold-300/50">
          Live Global Gold Feed
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-[#D4AF37]/20 bg-[#0D0D0D]/80 shadow-[0_25px_90px_-40px_rgba(212,175,55,0.55)] backdrop-blur-2xl">
        <div className="border-b border-[#D4AF37]/15 bg-gradient-to-r from-[#120f03] via-[#0b0b0b] to-[#120f03] p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={`relative overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-[radial-gradient(circle_at_top,_rgba(255,223,0,0.24),_rgba(15,15,15,0.95)_60%)] p-5 transition-all duration-500 ${isOunceLockedToReal ? 'ring-1 ring-[#FFDF00]/70 shadow-[0_0_40px_rgba(255,223,0,0.35)]' : ''}`}>
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,223,0,0.10)_0%,rgba(255,223,0,0)_38%,rgba(255,223,0,0.14)_62%,rgba(255,223,0,0)_100%)] animate-[pulse_3.2s_ease-in-out_infinite]" />
                <div className="absolute inset-x-0 bottom-2 h-10 bg-[linear-gradient(90deg,transparent_0%,rgba(255,223,0,0.25)_45%,transparent_100%)] blur-md animate-[pulse_2.6s_ease-in-out_infinite]" />
              </div>
              <div className="pointer-events-none absolute -inset-8 animate-[pulse_2.8s_ease-in-out_infinite] bg-[#FFDF00]/20 blur-3xl" />
              <div className="relative z-10 mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#FFE8A3]">Live Ounce Price</span>
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#FFDF00]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFDF00] opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFDF00]" />
                  </span>
                  Live
                </span>
              </div>
              <p className="relative z-10 mb-1 text-xs text-[#EAD49B]/80">USD</p>
              <p className="relative z-10 text-2xl font-bold text-[#FFDF00] drop-shadow-[0_0_12px_rgba(255,223,0,0.4)] md:text-3xl">
                {displayLiveUsd !== null ? formatMoney(displayLiveUsd, 'USD') : '--'}
              </p>
            </div>

            <div className={`relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#111111] via-[#0B0B0B] to-[#131313] p-5 transition-all duration-500 ${isOunceLockedToReal ? 'ring-1 ring-[#FFDF00]/45 shadow-[0_0_32px_rgba(255,223,0,0.22)]' : ''}`}>
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,223,0,0.07)_0%,rgba(255,223,0,0)_40%,rgba(255,223,0,0.12)_68%,rgba(255,223,0,0)_100%)] animate-[pulse_3.5s_ease-in-out_infinite]" />
                <div className="absolute inset-x-0 bottom-1 h-9 bg-[linear-gradient(90deg,transparent_0%,rgba(212,175,55,0.22)_50%,transparent_100%)] blur-md animate-[pulse_2.9s_ease-in-out_infinite]" />
              </div>
              <div className="relative z-10 mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#C9B279]">Converted Ounce</span>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#C9B279]">SAR</span>
              </div>
              <p className="relative z-10 mb-1 text-xs text-[#C9B279]/80">Saudi Riyal</p>
              <p className="relative z-10 text-2xl font-bold text-[#F6D574] md:text-3xl">
                {displayLiveSar !== null ? formatMoney(displayLiveSar, 'SAR') : '--'}
              </p>
              <p className="relative z-10 mt-2 text-[10px] text-[#8f7d50]">1 USD = 3.75 SAR</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:p-6">
          {prices.map((price) => (
            <PriceCard key={price.karat} price={price} />
          ))}
        </div>

        <div className="border-t border-[#D4AF37]/10 bg-[#050505]/60 p-3 text-center">
          <p className="font-sans text-[10px] font-light tracking-wide text-[#9a8551] flex items-center justify-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            تحديث لحظي حسب السوق العالمي
          </p>
        </div>
      </div>
    </div>
  );
};
