import React from 'react';
import Image from 'next/image';
import IconComponent from '@/components/atoms/IconComponent';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { localizePath } from '@/i18n/paths';
import type { ContentBody, ServiceItem, ServicesPageData } from './types';

export function ServiceBody({ body }: { body: ContentBody | null }) {
  if (!body) return null;
  // HTML bodies are sanitized by the server mapper, including the empty-HTML fallback decision.
  return body.kind === 'html'
    ? <div className="service-rich-body typo-paragraph-medium" dangerouslySetInnerHTML={{ __html: body.html }} />
    : <p className="service-description typo-paragraph-medium m-0">{body.text}</p>;
}

function ServiceRow({ service, index, locale, grouped }: { service: ServiceItem; index: number; locale: Locale; grouped: boolean }) {
  const supporting = service.group === 'supporting';
  const rich = service.body?.kind === 'html';
  const reverse = index % 2 === 1;
  const Title = grouped ? 'h3' : 'h2';
  return (
    <div id={service.anchorId ?? undefined} className={`service-item ${reverse ? 'service-item--reverse' : ''} ${rich ? 'service-item--rich' : ''} ${supporting ? 'service-item--supporting' : 'pb-md-responsive'}`}>
      {!supporting && (service.image || !rich) && (
        <div className="service-image-wrapper">
          {service.image ? <Image src={service.image.src} alt={service.image.alt} width={675} height={675} className="service-image" /> : null}
        </div>
      )}
      <div className={`service-content ${reverse ? 'service-content--right' : ''}`}>
        {service.icon ? <IconComponent src={service.icon.src} alt={service.icon.alt} size="md" /> : null}
        {service.title ? <Title className={`${supporting ? 'typo-2xl-extrabold' : 'typo-3xl-extrabold'} m-0 mb-15`}>{service.title}</Title> : null}
        {service.heading ? <p className="service-heading typo-xl-medium m-0">{service.heading}</p> : null}
        {service.featured ? <div className="badge"><span className="typo-sm-bold">{getDictionary(locale).services.featuredBadge}</span></div> : null}
        <ServiceBody body={service.body} />
        {service.cta ? <a className="btn btn-secondary service-cta" href={localizePath(service.cta.path, locale)}>{service.cta.text}</a> : null}
      </div>
    </div>
  );
}

export default function ServicesList({ data, locale }: { data: ServicesPageData; locale: Locale }) {
  const groups = ['core', 'unclassified', 'supporting'] as const;
  return <>
    {groups.map((group) => {
      const rows = data.services.filter((service) => service.group === group);
      if (!rows.length) return null;
      const heading = group === 'core' ? data.coreHeading : group === 'supporting' ? data.supportingHeading : '';
      return <section key={group} className={`services-group services-group--${group}`}>
        {heading ? <h2 className="typo-3xl-extrabold services-group__heading">{heading}</h2> : null}
        {group === 'supporting' && data.supportingIntro ? <p className="services-group__intro typo-xl-medium">{data.supportingIntro}</p> : null}
        <div className={group === 'supporting' ? 'services-supporting-grid' : undefined}>
          {rows.map((service, index) => <ServiceRow key={index} service={service} index={index} locale={locale} grouped={Boolean(heading)} />)}
        </div>
      </section>;
    })}
  </>;
}
