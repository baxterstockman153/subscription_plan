'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../src/api/client';

function CheckoutReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Verifying payment…');

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    if (!sessionId) {
      setStatusMessage('Invalid return URL — no session ID found.');
      return;
    }
    api
      .getSessionStatus(sessionId)
      .then(({ paymentStatus }) => {
        if (paymentStatus === 'paid') {
          router.replace('/usage');
        } else {
          setStatusMessage('Payment not completed. Please try again from the usage page.');
        }
      })
      .catch(() => {
        setStatusMessage('Could not verify payment status. Redirecting to usage…');
        setTimeout(() => router.replace('/usage'), 3000);
      });
  }, [searchParams, router]);

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">{statusMessage}</p>
      </div>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950" />}>
      <CheckoutReturnContent />
    </Suspense>
  );
}
