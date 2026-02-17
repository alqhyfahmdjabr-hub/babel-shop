import { useEffect, useRef, useState } from 'react';
import { GoldPrice } from '../types/types';
import { ArrowDownLeft, ArrowUpRight, Activity } from 'lucide-react';

interface GoldTickerProps {
  prices: GoldPrice[];
}

const PriceRow: React.FC<{ price: GoldPrice }> = ({ price }) => {
  const prevBuy = useRef(price.buy);
  const prevSell = useRef(price.sell);
  const [buyAnim, setBuyAnim] = useState('');
  const [sellAnim, setSellAnim] = useState('');

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

  return (
    <tr className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors duration-500 cursor-default group">
      <td className="py-5 px-4">
        <div className="flex items-center justify-center">
          <div className="bg-[#151515] text-gold-300 font-bold px-4 py-2 rounded-xl border border-white/5 group-hover:border-gold-500/30 transition-colors">
            <span className="text-sm font-serif tracking-wide">عيار {price.karat}</span>
          </div>
        </div>
      </td>
      <td className={`py-5 px-4 text-center transition-all duration-1000 ${buyAnim}`}>
        <span className="font-sans text-xl font-medium text-gray-400 block tracking-wider">
          {price.buy.toLocaleString()}
        </span>
      </td>
      <td className={`py-5 px-4 text-center transition-all duration-1000 ${sellAnim}`}>
        <span className="font-sans text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 block tracking-wider drop-shadow-sm">
          {price.sell.toLocaleString()}
        </span>
      </td>
    </tr>
  );
};

export const GoldTicker: React.FC<GoldTickerProps> = ({ prices }) => {
  return (
    <div className="w-full bg-[#0D0D0D]/60 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-luxury mb-12 overflow-hidden relative group transition-all duration-1000">

      {/* Header */}
      <div className="bg-white/[0.01] p-6 border-b border-white/[0.03] flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="bg-gold-500/10 p-2 rounded-full animate-pulse-slow">
            <Activity className="w-4 h-4 text-gold-500" />
          </div>
          <h3 className="text-gold-100 font-serif text-xl tracking-wide">أسعار الذهب اليوم</h3>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-red-900/10 border border-red-500/10 rounded-full">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-50 duration-1000"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-bold text-red-500/80 tracking-widest uppercase font-sans">Live</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-500 border-b border-white/[0.03]">
              <th className="py-4 font-normal tracking-widest uppercase">العيار</th>
              <th className="py-4 font-normal tracking-widest uppercase">
                <div className="flex items-center justify-center gap-2">
                  <span>شراء</span>
                  <ArrowDownLeft className="w-3 h-3 text-gray-600" />
                </div>
              </th>
              <th className="py-4 font-normal tracking-widest uppercase">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gold-500/70">بيع</span>
                  <ArrowUpRight className="w-3 h-3 text-gold-600" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => (
              <PriceRow key={price.karat} price={price} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="bg-[#050505]/50 p-3 text-center border-t border-white/[0.03]">
        <p className="text-[9px] text-gray-600 flex items-center justify-center gap-2 font-light tracking-wide font-sans">
          <span className="w-1 h-1 bg-gold-600/50 rounded-full"></span>
          تحديث لحظي حسب السوق العالمي
        </p>
      </div>
    </div>
  );
};