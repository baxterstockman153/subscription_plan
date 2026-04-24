'use client';
import { useCallback } from 'react';
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';
import { api } from '../api/client';

interface CheckoutModalProps {
  planCode: 'PRO' | 'BUSINESS';
  onClose: () => void;
}

export function CheckoutModal({ planCode, onClose }: CheckoutModalProps) {
  const fetchClientSecret = useCallback(async () => {
    const { clientSecret } = await api.createCheckoutSession(planCode);
    return clientSecret;
  }, [planCode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Close checkout"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="p-1 overflow-y-auto">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
