/// <reference types="vitest" />
// Zero-projects empty state (Phase 3: proven here instead of with CMS data; every local locale has projects).
import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ProjectsGrid } from './index';

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
    render(<ProjectsGrid projects={[]} maxProjects={6} showButton={false} title="" />);
    expect(screen.getByText(EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book a Free Strategy Call' })).toBeInTheDocument();
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
        showButton={false}
        title=""
      />,
    );
    expect(screen.queryByText(EMPTY_TITLE)).toBeNull();
    expect(screen.getByText('[FR TEST] TRÉPIED — trepied.ca')).toBeInTheDocument();
  });
});
