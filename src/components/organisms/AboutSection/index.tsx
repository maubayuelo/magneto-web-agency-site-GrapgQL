import "./AboutSection.scss";
import DOMPurify from "isomorphic-dompurify";
import { getHomeAboutSection } from "./api";
import type { Locale } from "@/i18n/config";

// Home "Meet Magneto": heading + descriptionHtml (legacy `description` when empty), sanitized (AGENTS convention).
export default async function AboutSection({ locale }: { locale: Locale }) {
  const { aboutSectionTitle, bodyHtml } = await getHomeAboutSection(locale);

  if (!aboutSectionTitle && !bodyHtml) return null;

  return (
    <section className="main about-section">
      {aboutSectionTitle && (
        <h2 className="about-title typo-3xl-extrabold m-0">{aboutSectionTitle}</h2>
      )}
      {bodyHtml && (
        <div className="about-content">
          <div
            className="typo-3xl-medium about-content__body"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }}
          />
        </div>
      )}
    </section>
  );
}
