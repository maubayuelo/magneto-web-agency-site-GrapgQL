import React from 'react';

interface AboutMagnetoSectionProps {
  sectionTitle: string;
  description: string;
  linkText: string;
  linkUrl: string;
  generalText: string;
  calendlyText: string;
  calendly_url: string;
}

export const AboutMagnetoSection: React.FC<AboutMagnetoSectionProps> = ({
  sectionTitle,
  description,
  linkText,
  linkUrl,
  generalText,
  calendlyText,
  calendly_url,
}) => (
  <section className="main about-section">
    <h2 className="typo-3xl-extrabold m-0">{sectionTitle}</h2>
    <p className="typo-xl-medium">{description}</p>
    <div dangerouslySetInnerHTML={{ __html: generalText }} />
    {linkText && linkUrl && (
      <a href={linkUrl} className="btn btn-primary mt-15">{linkText}</a>
    )}
    {calendlyText && calendly_url && (
      <a href={calendly_url} className="btn btn-secondary mt-15" target="_blank" rel="noopener noreferrer">
        {calendlyText}
      </a>
    )}
  </section>
);