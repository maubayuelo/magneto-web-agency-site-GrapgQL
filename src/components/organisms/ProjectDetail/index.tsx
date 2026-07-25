import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { ProjectData } from '@/data/projects';
import './ProjectDetail.scss';

interface ProjectDetailProps {
  project: ProjectData;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project }) => {
  return (
    <div className="main project-detail pt-sm-responsive pb-lg-responsive">
      <div className="project-detail__container">

        {/* Header */}
        <header className="project-detail__header">
          <h1 className="typo-4xl-extrabold typo-center m-0">{project.title}</h1>
          {project.tagText && (
            <h2 className="typo-2xl-bold mt-15 typo-center">{project.tagText}</h2>
          )}

          {/* Main Image */}
          <div className="project-detail__image mb-md-responsive mt-15">
            <Image
              src={project.image}
              alt={project.title}
              width={1200}
              height={600}
              className="project-detail__main-image"
              priority
            />
          </div>

          <div
            className="project-detail__description typo-xl-medium pb-30"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(project.description || '') }}
          />
        </header>

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
          <div className="project-detail__gallery typo-center pb-md">
            {project.gallery.map((img: any, i: number) => {
              const isMobileScreenshot = typeof img !== 'string' && !!img.isMobileScreenshot;
              return (
                <div key={i} className={`project-detail__image mb-md-responsive${isMobileScreenshot ? ' project-detail__image--mobile-stage' : ''}`}>
                  <Image
                    src={typeof img === 'string' ? img : img.image}
                    alt={typeof img === 'string' ? `Gallery image ${i + 1}` : (img.footNote || `Gallery image ${i + 1}`)}
                    width={isMobileScreenshot ? 400 : 1200}
                    height={isMobileScreenshot ? 866 : 600}
                    className={`project-detail__main-image${isMobileScreenshot ? ' project-detail__main-image--mobile' : ''}`}
                  />
                  <p>
                  {typeof img === 'string' ? '' : img.footNote}
                  </p>
                </div>
              );
            })}

            {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-detail__external-link typo-sm-medium mt-sm-responsive mb-lg-responsive"
            >
              View live site
              <svg
                className="project-detail__external-link-icon"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          )}
          </div>
        )}

        {/* Back Button */}
        <nav className="project-detail__navigation mt-sm pb-md">
          
          <Link href="/projects" className="btn btn-secondary">
            ← Back to Projects
          </Link>
        </nav>

      </div>
    </div>
  );
};
