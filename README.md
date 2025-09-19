# magneto-web-agency-site-GrapgQL

CHANGES
-------
* Added basic SEO improvements: centralized `src/utils/seo.ts`, page-level `metadata` exports for key pages, and route handlers for `/sitemap.xml` and `/robots.txt`.
* Set `NEXT_PUBLIC_SITE_URL` in your environment to your production site URL so generated canonical links and sitemap entries are correct.

Example:

```bash
export NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

The sitemap is available at `/sitemap.xml` and robots at `/robots.txt` when running the Next.js app.

# Magneto - Web Solo Agency Site

A modern, responsive website for a solo web agency specializing in creating high-converting websites and funnels for experts and coaches. Built with Next.js 15, TypeScript, and SCSS.

## 🚀 Features

- **Modern Design**: Clean, professional design optimized for conversions
- **Responsive Layout**: Fully responsive across all device sizes
- **Performance Optimized**: Built with Next.js 15 for optimal loading speeds
- **TypeScript**: Full type safety throughout the application
- **SCSS Styling**: Modular and maintainable styling architecture
- **Component Architecture**: Atomic design principles with atoms, molecules, and organisms
- **SEO Optimized**: Built-in SEO optimization with Next.js
- **Contact Forms**: Integrated contact and consultation booking forms

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [SCSS](https://sass-lang.com/)
- **Runtime**: [React 19](https://reactjs.org/)
- **Build Tool**: [Next.js Built-in](https://nextjs.org/docs/app/building-your-application/deploying)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   ├── packages/          # Service packages
│   ├── portfolio/         # Portfolio showcase
│   ├── projects/          # Project case studies
│   ├── services/          # Services overview
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # Reusable components
│   ├── atoms/            # Basic UI elements
│   ├── molecules/        # Composite components
│   └── organisms/        # Complex components
├── data/                 # Static data and content
├── lib/                  # Utility functions and configurations
├── styles/               # Global styles and SCSS modules
└── types/                # TypeScript type definitions
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/magneto-web-agency.git
cd magneto-web-agency
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Design System

The project uses a modular design system with:

- **Atomic Design**: Components organized as atoms, molecules, and organisms
- **SCSS Architecture**: Modular styles with variables, mixins, and components
- **Responsive Breakpoints**: Mobile-first approach with consistent breakpoints
- **Typography System**: Consistent font scales and spacing
- **Color System**: Professional color palette optimized for conversions

## 📄 Pages Overview

- **Home** (`/`): Hero section, featured services, about, projects showcase, testimonials
- **About** (`/about`): Detailed information about the agency and approach
- **Services** (`/services`): Complete service offerings and process
- **Packages** (`/packages`): Service packages and pricing
- **Portfolio** (`/portfolio`): Full portfolio with case studies
- **Projects** (`/projects`): Individual project showcases
- **Contact** (`/contact`): Contact form and consultation booking

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy this Next.js app is using [Vercel](https://vercel.com/):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Deploy with zero configuration

### Other Platforms

This project can be deployed on any platform that supports Node.js:

- **Netlify**: Use the Next.js build plugin
- **Railway**: Direct deployment from GitHub
- **DigitalOcean App Platform**: Node.js application
- **AWS Amplify**: Full-stack deployment

## 🧑‍💻 How the Web App Works

This project is a modern web application built with Next.js, TypeScript, and SCSS. It uses a modular, component-based architecture for scalability and maintainability.

### How the Code and Files Work

- **Pages** are defined in `src/app/` as folders with a `page.tsx` file. Each folder (like `about/`, `services/`) maps to a route.
- **Components** are organized by atomic design in `src/components/` as atoms (basic UI), molecules (combinations of atoms), and organisms (complex UI sections). Components are imported into pages to build the UI.
- **Props** are used to pass data from parent to child components, enabling reusability and flexibility.
- **SCSS Modules** (`.module.scss`) provide scoped, maintainable styles for each component, while global styles and variables live in `src/styles/`.
- **TypeScript** (`.tsx` and `.ts` files) ensures type safety for props, data, and functions, making the codebase robust and easier to maintain.
- **Data** is often stored in `src/data/` as static arrays or objects, and imported where needed.
- **Utility functions** and helpers live in `src/lib/`.
- **Types** for data and props are defined in `src/types/`.

### Example: Services List

The `ServicesList` component (`src/app/services/ServicesList.tsx`) demonstrates how data and components work together:

- A list of services is defined as an array of objects, each with a title, description, image, and icon.
- The component maps over this array and renders a `ServiceItem` for each service.
- Layout alternates between left and right alignment using a `variant` prop.
- Images are rendered with Next.js's `Image` component for optimization.
- Icons are rendered using a reusable `IconComponent`.
- All styles are applied using SCSS classes.

### NPM Packages

- **next**: Framework for routing and SSR.
- **react**: UI library for building components.
- **typescript**: Adds static typing.
- **sass**: Enables SCSS styling.
- **eslint, prettier**: Code linting and formatting.

### Communication & Logic

- Data flows via props between components.
- Utility functions and static data are imported as needed.
- TypeScript types ensure robust, maintainable code.

---

This structure makes the app easy to extend and maintain, and ensures a consistent developer experience for teams.

## 🤝 Contributing

If you'd like to contribute to this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

For questions about this project or potential collaboration:

- **LinkedIn**: [[Mauricio Bayuelo](https://www.linkedin.com/in/maubayuelo/)]

## 📜 License

This project is private and proprietary. All rights reserved.

---

Built with ❤️ by [[Mauricio Bayuelo](https://www.linkedin.com/in/maubayuelo/)] - Helping experts and coaches build their online presence through high-converting websites and funnels.
