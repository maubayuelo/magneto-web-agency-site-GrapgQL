"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import Loader from '@/components/atoms/Loader';

type LoaderContextType = {
  show: () => void;
  hide: () => void;
  isLoading: boolean;
};

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const isLoading = count > 0;

  const show = useCallback(() => setCount((c) => c + 1), []);
  const hide = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  return (
    <LoaderContext.Provider value={{ show, hide, isLoading }}>
      {children}
      <Loader visible={isLoading} />
      <style jsx global>{`
        .global-loader { pointer-events: none; position: fixed; inset: 0; z-index: 9999; opacity: 0; transition: opacity 220ms ease; }
        .global-loader.visible { opacity: 1; pointer-events: auto; }
        .loader-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.2); backdrop-filter: blur(2px); }
        .loader-wrap { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display:flex; flex-direction:column; align-items:center; gap:12px; background: rgba(255,255,255,0.95); padding:16px 20px; border-radius:10px; box-shadow: 0 6px 22px rgba(0,0,0,0.12); }
        .spinner { animation: spin 1s linear infinite; }
        .spinner .path { stroke: #333; stroke-linecap: round; }
        .loader-text { font-size: 14px; color: #333; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error('useLoader must be used within LoaderProvider');
  return ctx;
}

export default LoaderContext;
