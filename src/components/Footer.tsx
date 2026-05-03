import { ContactInfo } from '../types/types';
import { Phone, Smartphone } from 'lucide-react';

interface FooterProps {
  contact: ContactInfo;
}

export const Footer: React.FC<FooterProps> = ({ contact }) => {
  return (
    <footer className="border-t border-gold-900/30 bg-neutral-900 pt-10 pb-[calc(7.75rem+env(safe-area-inset-bottom,0px))] text-center">
      <div className="app-container">
        <div className="mx-auto mb-8 max-w-md">
          <h3 className="gold-text-gradient mb-6 font-serif text-2xl font-bold">اتصل بنا</h3>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-center gap-3 text-gold-200">
              <Smartphone className="h-5 w-5" />
              <span className="font-bold">الادارة:</span>
              <a href={`tel:${contact.manager}`} dir="ltr" className="font-mono hover:text-white">
                {contact.manager}
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold text-gray-400">خدمة العملاء (واتساب/اتصال):</span>
              <div className="flex flex-wrap justify-center gap-4">
                {contact.workers.map((worker) => (
                  <a
                    key={worker.id}
                    href={`tel:${worker.phone}`}
                    dir="ltr"
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-gray-300 transition-colors hover:border-gold-500/50"
                  >
                    {worker.phone}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <span className="flex items-center justify-center gap-2 font-bold text-gray-400">
                <Phone className="h-4 w-4" /> الهاتف الثابت:
              </span>
              <div className="flex flex-wrap justify-center gap-4">
                {contact.landlines.map((num, idx) => (
                  <span key={idx} dir="ltr" className="font-mono text-xs text-gray-400">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-gold-700 to-transparent" />

        <div className="space-y-2 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} مجوهرات بابل. جميع الحقوق محفوظة.</p>
          <div className="flex items-center justify-center gap-2">
            <span>تصميم وتطوير:</span>
            <span className="font-bold text-gold-500">{contact.designer.name}</span>
          </div>
          <a href={`tel:${contact.designer.phone}`} dir="ltr" className="block font-mono text-gray-500 hover:text-gold-400">
            {contact.designer.phone}
          </a>
        </div>
      </div>
    </footer>
  );
};
