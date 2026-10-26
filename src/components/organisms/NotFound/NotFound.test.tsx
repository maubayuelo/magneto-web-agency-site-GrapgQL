/// <reference types="vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotFoundContent } from './index';
import { I18nProvider } from '@/i18n/I18nProvider';
import { en } from '@/i18n/dictionaries/en';
import { fr } from '@/i18n/dictionaries/fr';

const hrefs = () => screen.getAllByRole('link').map((a) => a.getAttribute('href'));

describe('NotFoundContent', () => {
  it('page variant, EN (no provider): 404 heading, body, Go Home → /', () => {
    render(<NotFoundContent variant="page" />);
    expect(screen.getByRole('heading', { level: 1, name: en.notFound.heading })).toBeInTheDocument();
    expect(screen.getByText(en.notFound.body)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.common.goHome })).toHaveAttribute('href', '/');
  });

  it('project variant, EN: current strings, links /projects (not /portfolio) and /', () => {
    render(<NotFoundContent variant="project" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Project Not Found' })).toBeInTheDocument();
    expect(screen.getByText(en.projectNotFound.body)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.projectNotFound.viewAll })).toBeInTheDocument();
    expect(hrefs()).toEqual(['/projects', '/']);
    expect(hrefs()).not.toContain('/portfolio');
  });

  it('page variant, FR provider: FR strings and /fr home link', () => {
    render(
      <I18nProvider locale="fr" dictionary={fr}>
        <NotFoundContent variant="page" />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: fr.notFound.heading })).toBeInTheDocument();
    expect(screen.getByText(fr.notFound.body)).toBeInTheDocument();
    expect(hrefs()).toEqual(['/fr']);
  });

  it('project variant, FR provider: FR strings, links /fr/projects and /fr', () => {
    render(
      <I18nProvider locale="fr" dictionary={fr}>
        <NotFoundContent variant="project" />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: fr.projectNotFound.heading })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: fr.common.goHome })).toBeInTheDocument();
    expect(hrefs()).toEqual(['/fr/projects', '/fr']);
  });
});
