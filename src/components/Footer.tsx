
import { ContactInfo } from '../types/types';
import { Phone, Smartphone } from 'lucide-react';

interface FooterProps {
  contact: ContactInfo;
}

export const Footer: React.FC<FooterProps> = ({ contact }) => {
  return (
    <footer className="app-surface border-t pt-10 pb-24 px-4 text-center">

      <div className="max-w-md mx-auto mb-8">
        <h3 className="gold-text-gradient font-serif text-2xl font-bold mb-6">اتصل بنا</h3>

        <div className="space-y-4 text-sm">
          {/* Manager */}
          <div className="flex items-center justify-center gap-3 text-gold-200">
            <Smartphone className="w-5 h-5" />
            <span className="font-bold">الادارة:</span>
            <a href={`tel:${contact.manager}`} dir="ltr" className="font-mono hover:text-white">{contact.manager}</a>
          </div>

          {/* Workers */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 font-bold">خدمة العملاء (واتساب/اتصال):</span>
            <div className="flex flex-wrap justify-center gap-4">
              {contact.workers.map((worker) => (
                <a key={worker.id} href={`tel:${worker.phone}`} dir="ltr" className="bg-white/5 px-3 py-1 rounded-full text-gray-300 font-mono text-xs border border-white/10 hover:border-gold-500/50 transition-colors">
                  {worker.phone}
                </a>
              ))}
            </div>
          </div>

          {/* Landlines */}
          <div className="flex flex-col gap-2 mt-4">
            <span className="text-gray-400 font-bold flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" /> الهاتف الثابت:
            </span>
            <div className="flex flex-wrap justify-center gap-4">
              {contact.landlines.map((num, idx) => (
                <span key={idx} dir="ltr" className="text-gray-400 font-mono text-xs">
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-gold-700 to-transparent mx-auto mb-6"></div>

      {/* Credits */}
      <div className="text-xs text-gray-600 space-y-2">
        <p>&copy; {new Date().getFullYear()} مجوهرات بابل. جميع الحقوق محفوظة.</p>
        <div className="flex items-center justify-center gap-2">
          <span>تصميم وتطوير:</span>
          <span className="text-gold-500 font-bold">{contact.designer.name}</span>
        </div>
        <a href={`tel:${contact.designer.phone}`} dir="ltr" className="block text-gray-500 hover:text-gold-400 font-mono">
          {contact.designer.phone}
        </a>
      </div>
    </footer>
  );
};
