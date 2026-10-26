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


  export const ProjectsGrid = ({ 
    projects,
    maxProjects = 6, 
    showButton = true, 
    title: titleProp
  }: { projects: ProjectItem[]; maxProjects?: number; showButton?: boolean; title?: string }) => {
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
            

            {projects.length > 0 && (
              <section className="projects-grid pb-lg-responsive">
                {title && (
                  <div className="projects-grid__header pb-15">
                    <h2 className="typo-3xl-extrabold typo-center m-0">{title}</h2>
                  </div>
                )}

                <div className="projects-grid__container">
                  <div className="projects-grid__grid">
                    {displayedProjects.map((project) => (
                      <div key={project.id} className="projects-grid__item mb-sm-responsive">
                        <Link href={localizePath(`/projects/${project.slug}`, locale)} className="projects-grid__item-link mb-15">
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
                              alt={project.title}
                              className="projects-grid__image"
                              width={390}
                              height={270}
                              priority
                            />
                          )}
                        </Link>
                        <Link href={localizePath(`/projects/${project.slug}`, locale)} className="projects-grid__item-link m-0">
                          <h3 className="projects-grid__item-title typo-2xl-extrabold m-0">{project.title}</h3>
                        </Link>
                        {project.solutions && project.solutions.length > 0 ? (
                          <p className='m-0'><span className='typo-sm-bold'>{t.projects.solutionLabel}</span><span className='m-0 typo-sm-medium'>{project.solutions[0]}</span></p>
                        ) : (
                          <p className='m-0'><span className='typo-sm-bold'>{t.projects.solutionLabel}</span><span className='m-0 typo-sm-medium'>—</span></p>
                        )}
                        {project.results && project.results.length > 0 ? (
                          <p className='m-0'><span className='typo-sm-bold'>{t.projects.outcomeLabel}</span><span className='m-0 typo-sm-medium'>{project.results[0]}</span></p>
                        ) : (
                          <p className='m-0'><span className='typo-sm-bold'>{t.projects.outcomeLabel}</span><span className='m-0 typo-sm-medium'>—</span></p>
                        )}
                      </div>
                    ))}
                  </div>

                  {showButton && projects.length > maxProjects && (
                    <Link href={localizePath('/projects/', locale)} className="btn btn-secondary mt-15">
                      {t.projects.checkAll}
                    </Link>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </>
    );
  };
