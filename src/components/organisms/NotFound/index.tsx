'use client';
// Dictionary-driven 404 body (ADR 0005). Rendered by the not-found.tsx files inside [locale]/layout.tsx, so it
// sits inside I18nProvider and uses the layout's locale (a not-found component receives no params).
import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { localizePath } from '@/i18n/paths';
import type { NotFoundContentProps } from './types';
import './NotFound.scss';

export function NotFoundContent({ variant }: NotFoundContentProps) {
  const { t, locale } = useI18n();

  if (variant === 'project') {
    return (
      <div className="main">
        <section className="not-found">
          <h1 className="typo-4xl-extrabold">{t.projectNotFound.heading}</h1>
          <p className="typo-xl-medium">{t.projectNotFound.body}</p>
          <div className="not-found__actions">
            <Link href={localizePath('/projects', locale)} className="btn btn-primary">
              {t.projectNotFound.viewAll}
            </Link>
            <Link href={localizePath('/', locale)} className="btn btn-secondary">
              {t.common.goHome}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="main">
      {/* Like Next's built-in 404: the client-side title would otherwise fall back to the layout's after hydration
          (the [...rest] page has no metadata). React 19 hoists <title> into <head>. */}
      <title>{t.notFound.metaTitle}</title>
      <section className="not-found">
        <h1 className="typo-4xl-extrabold">{t.notFound.heading}</h1>
        <p className="typo-xl-medium">{t.notFound.body}</p>
        <div className="not-found__actions">
          <Link href={localizePath('/', locale)} className="btn btn-primary">
            {t.common.goHome}
          </Link>
        </div>
      </section>
    </div>
  );
}

export default NotFoundContent;
