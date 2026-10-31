import React from "react";
import { HeroLoader } from "@/components/organisms/Hero";
import { PackagesGrid } from "@/components/organisms";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import FinalCTASectionLoader from "@/components/organisms/FinalCTASection/FinalCTASectionLoader";
import { getPackagesPageData } from "./api";

type PackagesPageProps = { params: Promise<{ locale: string }> };

export default async function PackagesPage({ params }: PackagesPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const pageData = await getPackagesPageData(locale);
  if (!pageData) notFound();
  const { introText, packages, content } = pageData;
  // New Packages content populated → the Hero may only link to /contact, never fall back to the booking link (§5.3).
  const requireInternalCta = content.introBody !== null || content.packages.some((p) => p.body?.kind === 'html');

  return (
    <>
      <HeroLoader pageUri="packages" variant="packages" locale={locale} requireInternalCta={requireInternalCta} />
      {introText ? (
        <div className="main typo-center">
          <h3
            className="typo-3xl-bold m-0"
            dangerouslySetInnerHTML={{
              __html: introText.replace(/\r?\n/g, "<br />"),
            }}
          />
        </div>
      ) : null}
      <div className="main">
        <PackagesGrid packages={packages} />
      </div>
      <FinalCTASectionLoader source={{ kind: "page", name: "packages" }} locale={locale} />
    </>
  );
}

export async function generateMetadata({ params }: PackagesPageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = getDictionary(locale);
  try {
    await getPackagesPageData(locale);
    const title = t.meta.packages.title;
    const desc = t.meta.packages.description;
    return {
      title,
      description: desc,
      openGraph: { title, description: desc },
      twitter: { title, description: desc },
    };
  } catch (e) {
    const title = t.meta.packages.title;
    const desc = t.meta.packages.description;
    return {
      title,
      description: desc,
      openGraph: { title, description: desc },
      twitter: { title, description: desc },
    };
  }
}
