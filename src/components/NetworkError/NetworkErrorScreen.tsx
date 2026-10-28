'use client';

import React, { useEffect, useState } from 'react';

export function NetworkErrorScreen() {
  const [hostname, setHostname] = useState('wattaqa-arts-fest');
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    // Silence console so no application errors, React traces, or logs appear
    try {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.info = () => {};
      console.debug = () => {};
      console.clear();
    } catch (_) {}

    if (typeof window !== 'undefined') {
      const host = window.location.hostname || 'localhost';
      setHostname(host);
      document.title = 'This site can’t be reached';
    }
  }, []);

  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999999] bg-[#ffffff] dark:bg-[#202124] text-[#3c4043] dark:text-[#bdc1c6] font-sans flex flex-col justify-between p-6 sm:p-12 md:p-20 overflow-auto select-none">
      <div className="max-w-2xl mx-auto w-full my-auto">
        {/* Chrome Sad Page Icon */}
        <div className="mb-6 text-[#5f6368] dark:text-[#9aa0a6]">
          <svg
            className="w-14 h-14"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 8C7.79086 8 6 9.79086 6 12V36C6 38.2091 7.79086 40 10 40H38C40.2091 40 42 38.2091 42 36V18L32 8H10Z"
              fill="#E8EAED"
              stroke="#5F6368"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M30 8V18H40"
              stroke="#5F6368"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Sad Eyes */}
            <circle cx="17" cy="24" r="2" fill="#5F6368" />
            <circle cx="27" cy="24" r="2" fill="#5F6368" />
            {/* Sad Mouth */}
            <path
              d="M17 32C18.5 30 20.5 29 22 29C23.5 29 25.5 30 27 32"
              stroke="#5F6368"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Primary Heading */}
        <h1 className="text-2xl sm:text-[28px] font-medium text-[#202124] dark:text-[#e8eaed] tracking-tight leading-snug mb-3">
          This site can’t be reached
        </h1>

        {/* Diagnostic Subtext */}
        <p className="text-[15px] text-[#5f6368] dark:text-[#9aa0a6] mb-6 leading-relaxed">
          <strong className="font-semibold text-[#202124] dark:text-[#e8eaed]">{hostname}</strong> refused to connect.
        </p>

        {/* Steps to try */}
        <div className="text-[14px] text-[#5f6368] dark:text-[#9aa0a6] space-y-2 mb-8">
          <p>Try:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Checking the connection</li>
            <li>Checking the proxy and the firewall</li>
            <li>Running Network Diagnostics</li>
          </ul>
        </div>

        {/* Error Code & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#dadce0] dark:border-[#3c4043]">
          <span className="text-xs text-[#70757a] dark:text-[#80868b] font-mono tracking-wider">
            ERR_CONNECTION_REFUSED
          </span>

          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] text-white text-sm font-medium rounded-[4px] shadow-sm transition-colors cursor-pointer disabled:opacity-70"
          >
            {isReloading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Checking...</span>
              </div>
            ) : (
              'Reload'
            )}
          </button>
        </div>
      </div>

      {/* Footer subtle text */}
      <div className="text-center text-xs text-[#80868b] mt-8">
        Network connection offline
      </div>
    </div>
  );
}

