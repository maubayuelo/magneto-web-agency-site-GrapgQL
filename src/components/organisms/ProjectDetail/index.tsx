import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProjectData } from '../../../data/projects';
import './ProjectDetail.scss';

interface ProjectDetailProps {
  project: ProjectData;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project }) => {
  return (
    <div className="main project-detail pt-sm-responsive pb-lg-responsive">
      <div className="project-detail__container">

        {/* Header */}
        <header className="project-detail__header typo-center">
          <h1 className="typo-4xl-extrabold m-0">{project.title}</h1>
          {project.tagText && (
            <h2 className="typo-2xl-bold mt-15">{project.tagText}</h2>
          )}
        </header>

        <header className="">
          <p className="project-detail__description typo-xl-medium pb-30">{project.description}</p>
        </header>

        {/* Main Image */}
        <div className="project-detail__image mb-md-responsive">
          <Image
            src={project.image}
            alt={project.title}
            width={1200}
            height={600}
            className="project-detail__main-image"
            priority
          />
        </div>

        {/* Challenges, Solutions, Results in columns */}
        <div className="project-detail__columns mb-md-responsive">
          {/* Challenges */}
          {project.challenges && project.challenges.length > 0 && (
            <div className="project-detail__column">
              <h3 className="project-detail__column-title typo-2xl-extrabold">Challenges</h3>
              <ul className="project-detail__list">
                {project.challenges.map((challenge, index) => (
                  <li key={index} className="typo-lg-medium">
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Solutions */}
          {project.solutions && project.solutions.length > 0 && (
            <div className="project-detail__column">
              <h3 className="project-detail__column-title typo-2xl-extrabold">Solutions</h3>
              <ul className="project-detail__list">
                {project.solutions.map((solution, index) => (
                  <li key={index} className="typo-lg-medium">
                    {solution}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Results */}
          {project.results && project.results.length > 0 && (
            <div className="project-detail__column">
              <h3 className="project-detail__column-title typo-2xl-extrabold">Results</h3>
              <ul className="project-detail__list">
                {project.results.map((result, index) => (
                  <li key={index} className="typo-lg-medium">
                    <div className="project-detail__result-item">
                      <div className="project-detail__check-icon">
                        <Image
                          src="/assets/images/ico-check.svg"
                          alt="Check icon"
                          width={18}
                          height={18}
                          className="project-detail__check"
                        />
                      </div>
                      <span>{result}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Gallery - Full width images */}
        {project.gallery && project.gallery.length > 0 && (
          <div className="project-detail__gallery">
            {project.gallery.map((image, index) => (
              <div key={index} className="project-detail__image mb-md-responsive">
                <Image
                  src={image}
                  alt={`${project.title} - Image ${index + 1}`}
                  width={1200}
                  height={600}
                  className="project-detail__main-image"
                />
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <nav className="project-detail__navigation mt-md-responsive">
          <Link href="/portfolio" className="btn btn-secondary">
            ← Back to Portfolio
          </Link>
        </nav>

      </div>
    </div>
  );
};
