// Projects Grid component

import './ProjectsGrid.scss';
import Image from 'next/image';
import Link from 'next/link';
import { projectsData } from '../../../data/projects';

interface ProjectsGridProps {
  maxProjects?: number;
  showButton?: boolean;
  title?: string;
}

export const ProjectsGrid = ({ 
  maxProjects = 4, 
  showButton = true, 
  title = "Recent Projects" 
}: ProjectsGridProps) => {
  const displayedProjects = projectsData.slice(0, maxProjects);

  return (
    <div className="main">
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
                    src={project.image}
                    alt={project.title}
                    className="projects-grid__image"
                    width={675}
                    height={460}
                    priority={project.id <= 2} />
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
            <Link href="/portfolio" className="btn btn-secondary mt-30">
              Check All Projects
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};
