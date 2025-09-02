import "./AboutSection.scss";
import { getHomeAboutSection } from "./api";

export default async function AboutSection() {
  const { aboutSectionTitle, description } = await getHomeAboutSection();

  if (!aboutSectionTitle && !description) return null;

  return (
    <section className="main about-section">
      {aboutSectionTitle && (
        <h3 className="about-title typo-3xl-extrabold m-0">{aboutSectionTitle}</h3>
      )}
      {description && (
        <div className="about-content">
          <div
            className="typo-3xl-medium"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}
    </section>
  );
}



