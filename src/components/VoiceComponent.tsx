'use client';

import { VoiceChat } from './voice';
import React, { useEffect, useState } from 'react';

const MAX_QUOTA = 180;

const VoiceComponent = () => {
  const [quota, setQuota] = useState<number | null>(null);

  useEffect(() => {
    async function fetchQuota() {
      try {
        const res = await fetch('/api/conversations/tick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickSeconds: 0 }),
        });
        const data = await res.json();
        if (typeof data.remaining === 'number') {
          setQuota(data.remaining);
        } else {
          setQuota(null);
        }
      } catch {
        setQuota(null);
      }
    }
    fetchQuota();
  }, []);

  return (
    <>
      {/* Quota Warning/Alert */}
      {quota === 0 && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center justify-between gap-2 animate-pulse">
          <span>🚫 Your call quota has run out. Please upgrade to continue using voice features.</span>
          <button
            className="ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-medium shadow animate-pulse"
            onClick={() => window.open('https://dashboard.taxai.ae/dashboard/account?tab=Subscription', '_blank')}
          >
            Upgrade Now
          </button>
        </div>
      )}
      {quota !== null && quota > 0 && quota < 15 && (
        <div className="mb-4 p-3 bg-yellow-200 text-yellow-900 border border-yellow-400 rounded flex items-center gap-2 animate-pulse">
          <span>⚠️ Your call quota is critically low. Please upgrade soon to avoid interruption.</span>
        </div>
      )}
      {/* Existing <30 detik warning tetap, tapi <15 detik tampilkan yang ini */}
      {quota !== null && quota >= 15 && quota < 30 && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded flex items-center gap-2">
          <span>⚠️ Your call quota is almost exhausted.</span>
        </div>
      )}
      <VoiceChat />
    </>
  );
};

export default VoiceComponent;
