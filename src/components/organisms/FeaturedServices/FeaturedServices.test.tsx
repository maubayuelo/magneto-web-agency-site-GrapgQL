/// <reference types="vitest" />
// 5c-rest §6: an untitled featured-service row (empty or whitespace serviceTitle) renders no card.
import React from 'react';
import { render, screen } from '@testing-library/react';
import FeaturedServices from './index';
import type { FeaturedServiceItem } from './types';

// Classic JSX runtime in Vitest (Known debt): JSX in this file and in index.tsx needs a global React.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock('@/components/atoms/ServiceIcon', () => ({ default: () => null }));

const row = (serviceTitle: string | null, anchorLink: string): FeaturedServiceItem => ({
  serviceTitle,
  serviceTagline: 'Tagline',
  serviceDescription: 'Description',
  serviceIcon: { node: { sourceUrl: '/icon.svg' } },
  anchorLink,
});

describe('FeaturedServices', () => {
  it('skips a row whose title is empty: 3 rows with one untitled → 2 cards', () => {
    render(<FeaturedServices locale="en" services={[row('BUILD', 'build'), row('FIX', 'fix'), row('', 'care')]} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['BUILD', 'FIX']);
  });

  it('renders nothing when every title is empty or whitespace', () => {
    const { container } = render(<FeaturedServices locale="en" services={[row('', 'build'), row('   ', 'fix'), row(null, 'care')]} />);
    expect(container.innerHTML).toBe('');
  });
});
