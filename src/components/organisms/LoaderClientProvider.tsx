"use client";
import React from 'react';
import { LoaderProvider } from '@/context/LoaderContext';

export default function LoaderClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <LoaderProvider>
      {children}
    </LoaderProvider>
  );
}
