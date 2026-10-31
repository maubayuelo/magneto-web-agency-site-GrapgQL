import React from 'react';
import type { PackagesContentSectionsProps } from './types';
import './PackagesContentSections.scss';

// Packages-only (5b §5.2): Paid Website Diagnostic + budget guidance, in CMS order after the cards.
// Rows without heading and body are dropped by the mapper; no rows → no wrapper.
export default function PackagesContentSections({ sections }: PackagesContentSectionsProps) {
  if (sections.length === 0) return null;
  return (
    <div className="main packages-sections pb-lg-responsive">
      {sections.map((section, index) => (
        <section key={index} className="packages-sections__item" aria-labelledby={section.heading ? `packages-section-${index}` : undefined}>
          {section.heading ? (
            <h2 id={`packages-section-${index}`} className="typo-2xl-extrabold m-0">{section.heading}</h2>
          ) : null}
          {section.bodyHtml ? (
            <div className="packages-sections__body typo-md-medium" dangerouslySetInnerHTML={{ __html: section.bodyHtml }} />
          ) : null}
        </section>
      ))}
    </div>
  );
}
