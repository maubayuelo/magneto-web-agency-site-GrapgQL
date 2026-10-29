  "use client";

  // Projects Grid component

  import './ProjectsGrid.scss';
  import Image from 'next/image';
  import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
  import Link from 'next/link';
    import { usePathname } from 'next/navigation';
    import { localizePath, splitLocalePath } from '@/i18n/paths';
  import type { ProjectItem } from './types';
  import { CalendlyButton } from '@/components/atoms';
  import { useI18n } from '@/i18n/I18nProvider';


  // Card = thumbnail · title · description, the whole card linked to the case study (Phase 5a).
  export const ProjectsGrid = ({ 
    projects,
    maxProjects = 6, 
    title: titleProp,
    intro,
  }: { projects: ProjectItem[]; maxProjects?: number; title?: string; intro?: string }) => {
    const { t, locale } = useI18n();
    const title = titleProp ?? t.home.recentProjects;
    const displayedProjects = projects.slice(0, maxProjects);
      const pathname = usePathname();
      const path = splitLocalePath(pathname ?? '/').path;
      const isProjectsRoot = path === '/projects' || path === '/projects/';

    return (
      <>
        {displayedProjects.length === 0 && isProjectsRoot && (
        <div className="main typo-center pb-md-responsive">
          <div className="projects-coming pb-30">
          <h2 className="typo-3xl-bold typo-center  m-0">{t.projects.emptyTitle}</h2>
          <h2 className="typo-xl-bold typo-center m-0">{t.projects.emptySubtitle}</h2>
          <p className="typo-2xl-bold typo-center mt-md-responsive mb-0">{t.projects.emptyQuestion}</p>
          <CalendlyButton className="mt-5" variant="primary" utmContent="projects_empty" utmTerm="strategy_call">
            {t.common.bookStrategyCall}
          </CalendlyButton>
          </div>
        </div>

      )}
        {projects.length > 0 && (
          <div className="main">
              <section className="projects-grid pb-lg-responsive">
                {(title || intro) && (
                  <div className="projects-grid__header pb-15">
                    {title && <h2 className="typo-3xl-extrabold typo-center m-0">{title}</h2>}
                    {intro && <p className="projects-grid__intro typo-xl-medium typo-center m-0">{intro}</p>}
                  </div>
                )}

                <div className="projects-grid__container">
                  <div className="projects-grid__grid">
                    {displayedProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={localizePath(`/projects/${project.slug}`, locale)}
                        className="projects-grid__item projects-grid__item-link mb-sm-responsive"
                      >
                          {project.featuredImage?.node?.sourceUrl ? (
                            <WpResponsiveImage
                              image={project.featuredImage?.node}
                              className="projects-grid__image"
                              width={390}
                              height={270}
                            />
                          ) : (
                            <Image
                              src={"https://placehold.co/400x300"}
                              alt=""
                              className="projects-grid__image"
                              width={390}
                              height={270}
                              priority
                            />
                          )}
                          <h3 className="projects-grid__item-title typo-2xl-extrabold m-0">{project.title}</h3>
                          {project.description ? (
                            <p className="projects-grid__item-description typo-paragraph-medium m-0">{project.description}</p>
                          ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
          </div>
        )}
      </>
    );
  };
