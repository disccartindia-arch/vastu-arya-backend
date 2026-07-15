'use client';
/**
 * components/payment/PaymentProgress.tsx
 * Inline 4-step animated progress tracker shown during the
 * Pay → Gateway → Verify → Done flow. Non-blocking, replaces the
 * bare "Opening Payment…" spinner on checkout / booking pages.
 */
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export type PaymentStage = 'idle' | 'creating-order' | 'gateway' | 'verifying' | 'done' | 'failed';

const STEPS = [
  { key: 'creating-order', label: 'Preparing' },
  { key: 'gateway',        label: 'Payment' },
  { key: 'verifying',      label: 'Verifying' },
  { key: 'done',           label: 'Confirmed' },
] as const;

function stageIndex(stage: PaymentStage): number {
  const idx = STEPS.findIndex(s => s.key === stage);
  if (stage === 'idle') return -1;
  if (stage === 'failed') return -2;
  return idx;
}

export default function PaymentProgress({ stage, testId = 'payment-progress' }: { stage: PaymentStage; testId?: string }) {
  if (stage === 'idle') return null;
  const active = stageIndex(stage);
  return (
    <div data-testid={testId} className="w-full">
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const isDone   = active > i || stage === 'done';
          const isActive = active === i && stage !== 'done';
          return (
            <div key={s.key} className="flex-1 flex items-center gap-1">
              <div className="flex-1 relative">
                <div className="h-1.5 rounded-full bg-orange-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isDone ? '100%' : isActive ? '75%' : '0%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    className={stage === 'failed' && i >= (active + 2) ? 'h-full bg-red-400' : 'h-full bg-gradient-to-r from-primary to-orange-400'}
                  />
                </div>
              </div>
              {isDone && !isActive && (
                <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-medium">
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={
              stage === 'done' || active > i ? 'text-green-600'
              : active === i                  ? 'text-primary'
              : stage === 'failed' && i > active ? 'text-red-500'
              : 'text-gray-400'
            }
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
