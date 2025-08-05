// Home page

//import Image from "next/image";
import { Hero, FeaturedServices, AboutSection, ProjectsGrid, Testimonials } from '../components/organisms';

const testimonialData = [
  {
    id: 1,
    quote: "Working with Magneto was a game-changer for my online coaching program. Their innovative funnel design doubled my lead generation in just a few weeks!",
    author: "Elena M.",
    role: "Wellness Coach",
    avatar: "https://placehold.co/54x54"
  },
  {
    id: 2,
    quote: "Magneto completely transformed my coaching business. The new funnel brought in 3x more leads in just one month!",
    author: "Marcus T.",
    role: "biz. Coach", 
    avatar: "https://placehold.co/54x54"
  },
  {
    id: 3,
    quote: "Magneto expertly crafted funnel not only streamlined my processes but also tripled my lead generation in just a month!",
    author: "Sarah K.",
    role: "Life Coach",
    avatar: "https://placehold.co/54x54"
  },
  {
    id: 4,
    quote: "Partnering with Magneto was a transformative experience for my coaching business. Their expertly designed funnel increased my lead generation by 300% in just 30 days!",
    author: "David R.",
    role: "Exec. Coach",
    avatar: "https://placehold.co/54x54"
  }
];

export default function Home() {
  return (
    <>
      <Hero 
        variant="home"
        title="Attract leads online"
        subtitle="Websites & Funnels That Convert. Strategic Design for Experts & Coaches"
        titleSize="typo-5xl-extrabold"
        subtitleSize="typo-xl-medium"
        showImage={true}
        cta={{
          text: "Book a Free Strategy Call",
          href: "/contact"
        }}
      />
      <AboutSection />
      <FeaturedServices />
      <ProjectsGrid maxProjects={3} />
      <Testimonials testimonials={testimonialData} />
      
    </>
  );
}
