'use client';
/**
 * components/payment/PaymentTimeline.tsx
 * A compact vertical timeline used across every payment result screen
 * (success / pending / submitted / failed). Renders each step with a
 * status: done | active | pending | failed | skipped.
 *
 * Kept pure/presentational — takes an array of `PaymentTimelineStep` and
 * animates the "active" step with a soft pulse. Uses framer-motion so
 * the animation matches the rest of the site.
 */
import { motion } from 'framer-motion';
import { Check, Clock, AlertCircle, MinusCircle, Loader2 } from 'lucide-react';

export type StepStatus = 'done' | 'active' | 'pending' | 'failed' | 'skipped';

export interface PaymentTimelineStep {
  key: string;
  label: string;
  description?: string;
  status: StepStatus;
  timestamp?: string; // ISO string, optional
}

const STATUS_STYLES: Record<StepStatus, { bg: string; ring: string; text: string; icon: any }> = {
  done:    { bg: 'bg-green-500',  ring: 'ring-green-100',  text: 'text-green-700', icon: Check },
  active:  { bg: 'bg-primary',    ring: 'ring-orange-100', text: 'text-primary',   icon: Loader2 },
  pending: { bg: 'bg-gray-200',   ring: 'ring-gray-100',   text: 'text-gray-500',  icon: Clock },
  failed:  { bg: 'bg-red-500',    ring: 'ring-red-100',    text: 'text-red-600',   icon: AlertCircle },
  skipped: { bg: 'bg-gray-100',   ring: 'ring-gray-50',    text: 'text-gray-400',  icon: MinusCircle },
};

export default function PaymentTimeline({ steps, testId = 'payment-timeline' }: { steps: PaymentTimelineStep[]; testId?: string }) {
  return (
    <ol
      data-testid={testId}
      className="relative border-l-2 border-orange-100 pl-6 space-y-5 py-2"
    >
      {steps.map((s, i) => {
        const styles = STATUS_STYLES[s.status];
        const Icon = styles.icon;
        return (
          <motion.li
            key={s.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            data-testid={`${testId}-step-${s.key}`}
            className="relative"
          >
            <span
              className={`absolute -left-[34px] top-1 flex h-6 w-6 items-center justify-center rounded-full text-white ring-4 ${styles.bg} ${styles.ring}`}
            >
              <Icon size={12} className={s.status === 'active' ? 'animate-spin' : ''} />
            </span>
            <div>
              <p className={`text-sm font-semibold ${styles.text}`}>{s.label}</p>
              {s.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.description}</p>}
              {s.timestamp && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(s.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
