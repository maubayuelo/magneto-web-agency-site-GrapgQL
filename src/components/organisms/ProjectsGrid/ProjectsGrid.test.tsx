/// <reference types="vitest" />
// Zero-projects empty state (Phase 3: proven here instead of with CMS data; every local locale has projects).
import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ProjectsGrid } from './index';
import { en } from '@/i18n/dictionaries/en';

// Classic JSX runtime in Vitest (Known debt): ProjectsGrid doesn't import React.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));
vi.mock('@/components/atoms', () => ({
  CalendlyButton: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
}));

const EMPTY_TITLE = 'Everything unfolds in its sacred time.';

describe('ProjectsGrid with zero projects', () => {
  it.each(['/projects', '/fr/projects', '/es/projects', '/en/projects/'])('renders the empty state on %s', (path) => {
    vi.mocked(usePathname).mockReturnValue(path);
    render(<ProjectsGrid projects={[]} maxProjects={6} title="" />);
    expect(screen.getByText(EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.common.bookStrategyCall })).toBeInTheDocument();
    expect(document.querySelector('.projects-grid')).toBeNull();
  });

  it.each(['/', '/fr', '/es'])('renders nothing on the home page (%s)', (path) => {
    vi.mocked(usePathname).mockReturnValue(path);
    const { container } = render(<ProjectsGrid projects={[]} maxProjects={3} title="Recent Projects" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the grid, not the empty state, when there is a project', () => {
    vi.mocked(usePathname).mockReturnValue('/fr/projects');
    render(
      <ProjectsGrid
        projects={[{ id: 'cG9zdDo1NTA=', slug: 'trepied-trepied-ca', title: '[FR TEST] TRÉPIED — trepied.ca', featuredImage: null, solutions: [], results: [] }]}
        title=""
      />,
    );
    expect(screen.queryByText(EMPTY_TITLE)).toBeNull();
    expect(screen.getByText('[FR TEST] TRÉPIED — trepied.ca')).toBeInTheDocument();
  });
});

describe('ProjectsGrid cards (Phase 5a)', () => {
  const projects = [
    { id: '1', slug: 'fashion-company-ecommerce', title: 'Dangel Wellness', featuredImage: null, description: 'Card text', solutions: ['Sol'], results: ['Res'] },
    { id: '2', slug: 'shamaniccas-ecommerce', title: 'Shamanicca', featuredImage: null, description: '', solutions: [], results: [] },
  ];

  it('each card is one link to the case study with thumbnail · title · description; no Solution/Outcome, no "Check All"', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<ProjectsGrid projects={projects} maxProjects={3} title="Selected Web Projects" intro="Intro text" />);
    const cards = screen.getAllByRole('link');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute('href', '/projects/fashion-company-ecommerce');
    expect(cards[0].querySelector('img')).not.toBeNull();
    expect(cards[0]).toHaveTextContent('Dangel Wellness');
    expect(cards[0]).toHaveTextContent('Card text');
    expect(cards[1].querySelector('.projects-grid__item-description')).toBeNull();
    expect(screen.queryByText(/Solution|Outcome|Check All/)).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Selected Web Projects' })).toBeInTheDocument();
    expect(screen.getByText('Intro text')).toBeInTheDocument();
  });

  it('respects maxProjects', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<ProjectsGrid projects={projects} maxProjects={1} title="" />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
