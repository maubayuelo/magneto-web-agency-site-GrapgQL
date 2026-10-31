/// <reference types="vitest" />
import React from 'react';
import { render } from '@testing-library/react';
import PackagesContentSections from './index';

// Classic JSX runtime in Vitest (Known debt).
(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe('PackagesContentSections', () => {
  it('renders each section in order with a labelled region', () => {
    const { container } = render(
      <PackagesContentSections sections={[{ heading: 'Paid Website Diagnostic', bodyHtml: '<p>C$450</p>' }, { heading: 'Budget', bodyHtml: null }]} />,
    );
    const sections = [...container.querySelectorAll('section')];
    expect(sections.map((s) => s.querySelector('h2')?.textContent)).toEqual(['Paid Website Diagnostic', 'Budget']);
    expect(sections[0].getAttribute('aria-labelledby')).toBe(sections[0].querySelector('h2')?.id);
    expect(sections[0].textContent).toContain('C$450');
    expect(sections[1].querySelector('.packages-sections__body')).toBeNull();
  });

  it('a body without heading has no orphan heading; no sections → no wrapper', () => {
    const { container } = render(<PackagesContentSections sections={[{ heading: '', bodyHtml: '<p>Only body</p>' }]} />);
    expect(container.querySelector('h2')).toBeNull();
    expect(container.querySelector('section')?.hasAttribute('aria-labelledby')).toBe(false);
    const empty = render(<PackagesContentSections sections={[]} />);
    expect(empty.container).toBeEmptyDOMElement();
  });
});
