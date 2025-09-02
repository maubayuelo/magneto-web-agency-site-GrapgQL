// Projects Grid component

import './ProjectsGrid.scss';
import Image from 'next/image';
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
            <div key={project.id} className="projects-grid__item">
              <Link href={`/projects/${project.slug}`} className="projects-grid__item-link">
                <Image
                  src={project.featuredImage?.node?.sourceUrl || "https://placehold.co/400x300"}
                  alt={project.title}
                  className="projects-grid__image"
                  width={390}
                  height={270}
                  priority
                />
              </Link>
              <Link href={`/projects/${project.slug}`} className="projects-grid__item-link">
                <h3 className="projects-grid__item-title typo-2xl-extrabold m-0">
                  {project.title}
                </h3>
              </Link>
            </div>
          ))}
          </div>
          
          {showButton && (
            <Link href="/projects/" className="btn btn-secondary mt-30">
              Check All Projects
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};
