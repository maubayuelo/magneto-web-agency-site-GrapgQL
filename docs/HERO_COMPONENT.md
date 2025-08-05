# Hero Component Documentation

## Overview

The Hero component is a flexible, reusable component that can be used across all site pages with different variations through props. It supports different layouts, content, and styling based on the page variant.

## Usage

```tsx
import { Hero } from '../../components/organisms';

<Hero 
  variant="home"
  title="Your Title"
  subtitle="Your subtitle text"
  showImage={true}
  cta={{
    text: "Call to Action",
    href: "/contact"
  }}
/>
```

## Props

### Required Props

- `title` (string): The main heading text
- `subtitle` (string): The secondary text below the title

### Optional Props

- `variant` (string): Controls the hero layout and styling
  - Options: `'home' | 'about' | 'services' | 'portfolio' | 'contact' | 'default'`
  - Default: `'home'`

- `titleSize` (string): CSS class for title typography
  - Default: `'typo-5xl-extrabold'` for home, `'typo-4xl-extrabold'` for others

- `subtitleSize` (string): CSS class for subtitle typography
  - Default: `'typo-3xl-medium'` for home, `'typo-2xl-medium'` for others

- `image` (object): Custom image configuration
  ```tsx
  {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }
  ```

- `cta` (object | null): Call-to-action button configuration
  ```tsx
  {
    text: string;
    href?: string;        // For links
    onClick?: () => void; // For interactive buttons
  }
  ```

- `backgroundImage` (string): Custom background image URL

- `showImage` (boolean): Whether to display the hero image
  - Default: `true` for home variant, `false` for others

- `className` (string): Additional CSS classes

## Variants

### Home Variant (`variant="home"`)
- Full height hero with large image
- Larger typography
- Default hero image displayed
- Optimized for homepage layout

### Other Variants (`about`, `services`, `portfolio`, `contact`, `default`)
- Smaller height hero
- Smaller typography
- No hero image by default
- Optimized for content pages

## Examples

### Homepage Hero
```tsx
<Hero 
  variant="home"
  title="Attract leads online"
  subtitle="Websites & Funnels That Convert. Strategic Design for Experts & Coaches"
  showImage={true}
/>
```

### About Page Hero
```tsx
<Hero 
  variant="about"
  title="About Magneto"
  subtitle="More than a web studio—Magneto is a mission to empower creators, coaches, and conscious brands."
  showImage={false}
/>
```

### Contact Page with Custom CTA
```tsx
<Hero 
  variant="contact"
  title="Get In Touch"
  subtitle="Ready to transform your digital presence? Let's start the conversation."
  showImage={false}
  cta={{
    text: "Start Your Project",
    href: "#contact-form"
  }}
/>
```

### Custom Image Hero
```tsx
<Hero 
  variant="portfolio"
  title="Our Portfolio"
  subtitle="Explore our latest projects"
  image={{
    src: "/assets/images/portfolio-hero.png",
    alt: "Portfolio showcase",
    width: 800,
    height: 600
  }}
  showImage={true}
/>
```

### Hero without CTA
```tsx
<Hero 
  variant="about"
  title="Our Story"
  subtitle="Learn more about our journey"
  cta={null}
/>
```

## CSS Classes Generated

The component generates the following CSS classes:
- Base: `hero`
- Variant: `hero-{variant}` (e.g., `hero-home`, `hero-about`)
- Additional: Any classes passed via `className` prop

## Responsive Behavior

- **Mobile**: Optimized padding and smaller hero images
- **Tablet**: Increased padding and medium-sized elements
- **Desktop**: Full padding and larger elements
- **Large Desktop**: Maximum sizing for hero elements

The component uses SCSS breakpoints defined in your design system variables.
