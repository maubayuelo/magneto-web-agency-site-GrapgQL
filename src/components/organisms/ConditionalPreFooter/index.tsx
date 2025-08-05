'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { PreFooter } from '../PreFooter';
import { PreFooterProps } from '../PreFooter/types';

type ConditionalPreFooterProps = Omit<PreFooterProps, 'show'>;

export const ConditionalPreFooter: React.FC<ConditionalPreFooterProps> = (props) => {
  const pathname = usePathname();
  const isContactPage = pathname === '/contact';

  return <PreFooter {...props} show={!isContactPage} />;
};
