import { useState, useEffect } from 'react';

export type MarketStatus = 'NORMAL' | 'AMBER' | 'RED';

export const useMarketSentiment = () => {
  const [vix, setVix] = useState<number>(24.5); // Default Mock
  const [status, setStatus] = useState<MarketStatus>('NORMAL');

  useEffect(() => {
    // Logic: Simulate VIX or fetch here
    // Change this value to test Red/Amber states
    const currentVix = 24.5; 

    setVix(currentVix);

    if (currentVix > 30) {
      setStatus('RED');
    } else if (currentVix > 25) {
      setStatus('AMBER');
    } else {
      setStatus('NORMAL');
    }
  }, []);

  return { vix, status };
};