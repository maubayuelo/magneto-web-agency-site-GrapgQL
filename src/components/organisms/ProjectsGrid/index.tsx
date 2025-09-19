// Projects Grid component

import './ProjectsGrid.scss';
import Image from 'next/image';
import WpResponsiveImage from '@/components/atoms/WpResponsiveImage';
import Link from 'next/link';


interface ProjectsGridProps {
  projects: {
    id: string | number;
    slug: string;
    title: string;
    featuredImage?: {
      node?: {
        sourceUrl: string;
        altText?: string;
      }
    };
    solutions?: string[];
    results?: string[];
    // Add other fields as needed
  }[];
  title?: string;
  maxProjects?: number;
  showButton?: boolean;
}

export const ProjectsGrid = ({ 
  projects,
  maxProjects = 6, 
  showButton = true, 
  title = "Recent Projects" 
}: ProjectsGridProps) => {
  const displayedProjects = projects.slice(0, maxProjects);

  // Determine the first solution to display prominently (from the first project)
  const firstSolution = displayedProjects.length > 0 && displayedProjects[0].solutions && displayedProjects[0].solutions.length > 0
    ? displayedProjects[0].solutions[0]
    : null;

  // Determine the first result/outcome to display prominently (from the first project)
  const firstResult = displayedProjects.length > 0 && displayedProjects[0].results && displayedProjects[0].results.length > 0
    ? displayedProjects[0].results[0]
    : null;

  //console.log(projects);

  return (
    <div className="main">
      {displayedProjects.length === 0 && <p>No projects found.</p>}
      <section className="projects-grid pb-lg-responsive">

        {title && (
          <div className="projects-grid__header pb-15">
            <h2 className="typo-3xl-extrabold typo-center m-0">
              {title}
            </h2>
          </div>
        )}

        <div className="projects-grid__container">
          <div className="projects-grid__grid">
            {displayedProjects.map((project) => (
            <div key={project.id} className="projects-grid__item mb-sm-responsive">
              <Link href={`/projects/${project.slug}`} className="projects-grid__item-link mb-15">
                {project.featuredImage?.node?.sourceUrl ? (
                  <WpResponsiveImage
                    image={project.featuredImage?.node as any}
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
                <h3 className="projects-grid__item-title typo-2xl-extrabold m-0">
                  {project.title}
                </h3>
              </Link>
              
              {/* Show the project's first solution if available */}
              {project.solutions && project.solutions.length > 0 ? (
                <p className='m-0'><span className='typo-sm-bold'>Solution: </span><span className='m-0 typo-sm-medium'>{project.solutions[0]}</span></p>
              ) : (
                <p className='m-0'><span className='typo-sm-bold'>Solution: </span><span className='m-0 typo-sm-medium'>—</span></p>
              )}
              {/* Show the project's first result/outcome if available */}
              {project.results && project.results.length > 0 ? (
                <p className='m-0'><span className='typo-sm-bold'>Outcome: </span><span className='m-0 typo-sm-medium'>{project.results[0]}</span></p>
              ) : (
                <p className='m-0'><span className='typo-sm-bold'>Outcome: </span><span className='m-0 typo-sm-medium'>—</span></p>
              )}
              
            </div>
          ))}
          </div>
          
          {showButton && (
            <Link href="/projects/" className="btn btn-secondary mt-15">
              Check All Projects
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};
