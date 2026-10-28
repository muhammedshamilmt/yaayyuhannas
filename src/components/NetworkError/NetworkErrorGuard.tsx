'use client';

import React, { useEffect, useState, PropsWithChildren } from 'react';
import { NetworkErrorScreen } from './NetworkErrorScreen';

export function NetworkErrorGuard({ children }: PropsWithChildren) {
  const [isNetworkErrorActive, setIsNetworkErrorActive] = useState<boolean>(() => {
    return process.env.NEXT_PUBLIC_NETWORK_ERROR_MODE === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);

    // Bypass options for the developer/administrator:
    // Visiting ?bypass=off or ?stealth=off turns off the network error screen for this device
    if (urlParams.get('stealth') === 'off' || urlParams.get('bypass') === 'off') {
      localStorage.setItem('stealth_network_bypass', 'true');
      setIsNetworkErrorActive(false);
      return;
    }

    // Visiting ?bypass=on or ?stealth=on re-engages the network error screen
    if (urlParams.get('stealth') === 'on' || urlParams.get('bypass') === 'on') {
      localStorage.removeItem('stealth_network_bypass');
      setIsNetworkErrorActive(true);
      return;
    }

    // Check if device currently has active bypass
    const hasBypass = localStorage.getItem('stealth_network_bypass') === 'true';
    if (hasBypass) {
      setIsNetworkErrorActive(false);
      return;
    }

    const envActive = process.env.NEXT_PUBLIC_NETWORK_ERROR_MODE === 'true';
    setIsNetworkErrorActive(envActive);
  }, []);

  if (isNetworkErrorActive) {
    return <NetworkErrorScreen />;
  }

  return <>{children}</>;
}

