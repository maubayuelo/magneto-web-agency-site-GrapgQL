import React from "react";
import { HeroLoader } from "@/components/organisms/Hero";
import { PackagesGrid } from "@/components/organisms";
import PackagesContentSections from "@/components/organisms/PackagesContentSections";
import type { PackageItem } from "@/components/organisms/PackagesGrid/types";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { localizePath } from "@/i18n/paths";
import FinalCTASectionLoader from "@/components/organisms/FinalCTASection/FinalCTASectionLoader";
import { getPackagesPageData, legacyIntroHtml } from "./api";
import type { PackageContent, PackagesPageData } from "./types";
import { pageMetadata } from "@/utils/page-metadata";
import "./Packages.scss";

type PackagesPageProps = { params: Promise<{ locale: string }> };

function toCard(item: PackageContent, locale: Locale): PackageItem {
  const html = item.body?.kind === "html" ? item.body.html : null;
  return {
    title: item.title,
    description: item.body?.kind === "text" ? item.body.text : "",
    price: item.price,
    features: item.features,
    icon: item.icon || null,
    heading: item.heading || null,
    bodyHtml: html,
    anchorId: item.anchorId,
    // 'legacy' → undefined: the card keeps its strategy-call CTA (label common.bookStrategyCall).
    cta: item.ctaMode === "link" && item.cta ? { text: item.cta.text, href: localizePath(item.cta.path, locale) } : item.ctaMode === "none" ? null : undefined,
  };
}

export default async function PackagesPage({ params }: PackagesPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  let pageData: PackagesPageData | null = null;
  let failed = false;
  try {
    pageData = await getPackagesPageData(locale);
  } catch (error) {
    // CMS error ≠ missing translation: render the error state, not a 404 or a 500.
    console.error("Failed to load packages page data:", error);
    failed = true;
  }
  if (!failed && !pageData) notFound();
  if (pageData?.issues.length) console.warn("Incomplete Packages content:", pageData.issues);
  const t = getDictionary(locale);
  const content = pageData?.content;
  // New Packages content populated → the Hero may only link to /contact, never fall back to the booking link (§5.3).
  const rich = Boolean(content && (content.introBody !== null || content.packages.some((p) => p.body?.kind === "html")));

  return (
    <>
      <HeroLoader pageUri="packages" variant="packages" locale={locale} requireInternalCta={rich} />
      {failed || !pageData || !content ? (
        <div className="main pb-md-responsive packages-error" role="status">
          <h2 className="typo-2xl-bold">{t.packages.errorTitle}</h2>
          <p>{t.packages.errorBody}</p>
        </div>
      ) : (
        <>
          {rich ? (
            content.introBody ? (
              <div className="main typo-center packages-intro">
                {content.introBody.kind === "html" ? (
                  <div className="packages-intro__body typo-md-medium" dangerouslySetInnerHTML={{ __html: content.introBody.html }} />
                ) : (
                  <p className="packages-intro__body typo-md-medium m-0">{content.introBody.text}</p>
                )}
              </div>
            ) : null
          ) : pageData.introText ? (
            <div className="main typo-center">
              <h3 className="typo-3xl-bold m-0" dangerouslySetInnerHTML={{ __html: legacyIntroHtml(pageData.introText) }} />
            </div>
          ) : null}
          {content.packages.length > 0 ? (
            <div className="main">
              <PackagesGrid packages={content.packages.map((item) => toCard(item, locale))} />
            </div>
          ) : null}
          <PackagesContentSections
            sections={content.sections.map((s) => ({ heading: s.heading, bodyHtml: s.body?.kind === "html" ? s.body.html : null }))}
          />
        </>
      )}
      <FinalCTASectionLoader source={{ kind: "page", name: "packages" }} locale={locale} />
    </>
  );
}

export async function generateMetadata({ params }: PackagesPageProps) {
  const { locale: rawLocale } = await params;
  return pageMetadata(getDictionary(isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE).meta.packages);
}
