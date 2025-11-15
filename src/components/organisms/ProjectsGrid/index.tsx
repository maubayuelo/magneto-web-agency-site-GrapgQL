  "use client";

  // Projects Grid component

  import './ProjectsGrid.scss';
  import Image from 'next/image';
  import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
  import Link from 'next/link';
    import { usePathname } from 'next/navigation';
  import type { ProjectItem } from './types';
  import { CalendlyButton } from '@/components/atoms';


  export const ProjectsGrid = ({ 
    projects,
    maxProjects = 6, 
    showButton = true, 
    title = "Recent Projects" 
  }: { projects: ProjectItem[]; maxProjects?: number; showButton?: boolean; title?: string }) => {
    const displayedProjects = projects.slice(0, maxProjects);
      const pathname = usePathname();
      const isProjectsRoot = pathname === '/projects' || pathname === '/projects/';

    return (
      <>
        {displayedProjects.length === 0 && isProjectsRoot && (
        <div className="main typo-center pb-md-responsive">
          <div className="projects-coming pb-30">
          <h2 className="typo-3xl-bold typo-center  m-0">Everything unfolds in its sacred time.</h2>
          <h2 className="typo-xl-bold typo-center m-0">We’re planting and cultivating new digital projects with wonderful clients.</h2>
          <p className="typo-2xl-bold typo-center mt-md-responsive mb-0">Do you have a project in mind?</p>
          <CalendlyButton className="mt-5" variant="primary" utmContent="projects_empty" utmTerm="strategy_call">
            Book a Free Strategy Call
          </CalendlyButton>
          </div>
        </div>

      )}
        {projects.length > 0 && (
          <div className="main">
            

            {projects.length > 5 && (
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
                        <Link href={`/projects/${project.slug}`} className="projects-grid__item-link mb-15">
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
                        <Link href={`/projects/${project.slug}`} className="projects-grid__item-link m-0">
                          <h3 className="projects-grid__item-title typo-2xl-extrabold m-0">{project.title}</h3>
                        </Link>
                        {project.solutions && project.solutions.length > 0 ? (
                          <p className='m-0'><span className='typo-sm-bold'>Solution: </span><span className='m-0 typo-sm-medium'>{project.solutions[0]}</span></p>
                        ) : (
                          <p className='m-0'><span className='typo-sm-bold'>Solution: </span><span className='m-0 typo-sm-medium'>—</span></p>
                        )}
                        {project.results && project.results.length > 0 ? (
                          <p className='m-0'><span className='typo-sm-bold'>Outcome: </span><span className='m-0 typo-sm-medium'>{project.results[0]}</span></p>
                        ) : (
                          <p className='m-0'><span className='typo-sm-bold'>Outcome: </span><span className='m-0 typo-sm-medium'>—</span></p>
                        )}
                      </div>
                    ))}
                  </div>

                  {showButton && projects.length > 5 && (
                    <Link href="/projects/" className="btn btn-secondary mt-15">
                      Check All Projects
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
