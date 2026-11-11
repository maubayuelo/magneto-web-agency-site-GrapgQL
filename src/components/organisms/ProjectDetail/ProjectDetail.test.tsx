/// <reference types="vitest" />
// Design round A5: a gallery caption <p> renders only when footNote has text, so uncaptioned images don't leave a gap.
// A3: the results check icon is decorative (alt="").
import React from 'react';
import { render } from '@testing-library/react';
import type { ProjectData } from '@/data/projects';
import { ProjectDetail } from './index';

// Classic JSX runtime in Vitest (Known debt).
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const project = (footNotes: string[]): ProjectData => ({
  id: 'p1',
  slug: 'example',
  title: 'Example',
  description: '',
  image: '/assets/images/example.png',
  results: ['Faster site'],
  gallery: footNotes.map((footNote, i) => ({ image: `/assets/images/g${i}.png`, footNote, isMobileScreenshot: false })),
});

const captions = (container: HTMLElement) =>
  [...container.querySelectorAll('.project-detail__gallery .project-detail__image')].map((el) =>
    el.querySelector(':scope > p')?.textContent ?? null,
  );

describe('ProjectDetail gallery captions (A5)', () => {
  it('renders no <p> for an empty or whitespace-only footNote, and a <p> for text', () => {
    const { container } = render(<ProjectDetail project={project(['', '  ', 'Positioning first'])} locale="en" />);
    expect(captions(container)).toEqual([null, null, 'Positioning first']);
  });
});

describe('ProjectDetail check icon (A3)', () => {
  it('is decorative', () => {
    const { container } = render(<ProjectDetail project={project([])} locale="en" />);
    const icon = container.querySelector('img.project-detail__check');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('alt', '');
  });
});
