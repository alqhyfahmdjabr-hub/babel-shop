import type { OrderStatus } from '../types/types';

export type OrderStatusUi = {
  status: OrderStatus;
  label: string;
  badgeClass: string;
  steps: Array<{ key: string }>;
  activeStep: number; // -1 means "no progress track" (e.g., cancelled)
  stepOnClass: string;
  stepOffClass: string;
};

const STEPS: Array<{ key: string }> = [
  { key: 'received' },
  { key: 'review' },
  { key: 'processing' },
  { key: 'ready' },
  { key: 'delivered' }
];

const normalizeStatus = (status?: string): OrderStatus => {
  if (!status) return 'new';
  const value = status.trim();
  if (
    value === 'new' ||
    value === 'pending' ||
    value === 'processing' ||
    value === 'completed' ||
    value === 'delivered' ||
    value === 'cancelled'
  ) {
    return value;
  }
  return 'new';
};

export const getOrderStatusUi = (rawStatus?: string): OrderStatusUi => {
  const status = normalizeStatus(rawStatus);

  switch (status) {
    case 'new':
      return {
        status,
        label: 'تم استلام الطلب',
        badgeClass: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
        steps: STEPS,
        activeStep: 0,
        stepOnClass: 'bg-blue-400/70',
        stepOffClass: 'bg-white/10'
      };
    case 'pending':
      return {
        status,
        label: 'قيد المراجعة',
        badgeClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
        steps: STEPS,
        activeStep: 1,
        stepOnClass: 'bg-amber-400/70',
        stepOffClass: 'bg-white/10'
      };
    case 'processing':
      return {
        status,
        label: 'قيد التنفيذ',
        badgeClass: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
        steps: STEPS,
        activeStep: 2,
        stepOnClass: 'bg-purple-400/70',
        stepOffClass: 'bg-white/10'
      };
    case 'completed':
      return {
        status,
        label: 'جاهز للاستلام',
        badgeClass: 'bg-green-500/10 text-green-300 border border-green-500/20',
        steps: STEPS,
        activeStep: 3,
        stepOnClass: 'bg-green-400/70',
        stepOffClass: 'bg-white/10'
      };
    case 'delivered':
      return {
        status,
        label: 'تم التسليم',
        badgeClass: 'bg-teal-500/10 text-teal-300 border border-teal-500/20',
        steps: STEPS,
        activeStep: 4,
        stepOnClass: 'bg-teal-400/70',
        stepOffClass: 'bg-white/10'
      };
    case 'cancelled':
      return {
        status,
        label: 'ملغي',
        badgeClass: 'bg-red-500/10 text-red-300 border border-red-500/20',
        steps: STEPS,
        activeStep: -1,
        stepOnClass: 'bg-red-400/70',
        stepOffClass: 'bg-white/10'
      };
  }
};

