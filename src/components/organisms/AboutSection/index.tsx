import "./AboutSection.scss";
import { getHomeAboutSection } from "./api";

export default async function AboutSection() {
  const { sectiontitle, description } = await getHomeAboutSection();

  if (!sectiontitle && !description) return null;

  return (
    <section className="main about-section">
      {sectiontitle && (
        <h3 className="about-title typo-3xl-extrabold m-0">{sectiontitle}</h3>
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



