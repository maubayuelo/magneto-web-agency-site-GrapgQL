# Button & CTA Styles Documentation - MINIMAL VERSION

## Overview
This project includes a **minimal, clean button system** that contains only the button styles that are actually being used in the application. All unused styles have been removed for optimal performance.

## File Structure
- **Main File**: `/src/styles/components/button.scss` - Contains only used button styles (~75 lines)
- **Variables**: Uses SCSS variables from `/src/styles/variables.scss`

## Available Button Classes (Used Only)

### Standard Buttons
- `.btn` - Base button class
- `.btn-primary` - Primary button with brand color ✅ **USED**
- `.btn-small` - Small button size ✅ **USED**

### Call-to-Action Buttons  
- `.cta` - Enhanced primary CTA with box shadow ✅ **USED**
- `.cta-mobile` - Responsive CTA that adapts across breakpoints ✅ **USED**

## Current Usage in Components

### Header Component (`/src/components/organisms/header.tsx`)
```html
<a href="#" className="btn btn-primary btn-small">Schedule Call</a>
```

### Hero Component (`/src/components/organisms/Hero.tsx`)
```html
<a className="cta cta-mobile">Book a Free Strategy Call</a>
```

### Recent Projects Component (`/src/components/organisms/RecentProjects.tsx`)
```html
<button className="cta cta-mobile">Check All Projects</button>
```

## Responsive Behavior

### Standard Buttons (`.btn`)
- Use responsive border radius mixin from variables
- Consistent padding and typography

### CTA Buttons (`.cta-mobile`)
- **Mobile**: 15px 30px padding, 16px font size
- **Tablet (601px+)**: 30px 60px padding, 18px font size  
- **Desktop (1024px+)**: 30px 90px padding, 20px font size

## SCSS Variables Used

The minimal button system uses these variables from `variables.scss`:
- `$primary-color` - Main brand color (#705af8)
- `$white`, `$black` - Base colors
- `$font-family`, `$font-weight-*` - Typography system
- `$spacing-*` - Consistent spacing values (10px, 15px, 30px, 60px, 90px)
- `$breakpoint-tablet`, `$breakpoint-desktop` - Responsive breakpoints
- Responsive border radius mixin

## What Was Removed

### Unused Button Classes (Cleaned Up)
The following classes were removed as they are not used anywhere in the application:

- ~~`.btn-secondary`~~ - Secondary button variant
- ~~`.btn-outline`~~ - Outline button variant  
- ~~`.btn-ghost`~~ - Minimal styling button
- ~~`.btn-success`~~ - Success actions
- ~~`.btn-danger`~~ - Destructive actions
- ~~`.btn-large`~~ - Large button size
- ~~`.btn-extra-large`~~ - Extra large button size
- ~~`.btn-full-width`~~ - Full width button
- ~~`.btn-disabled`~~ - Disabled state
- ~~`.btn-loading`~~ - Loading state with spinner
- ~~`.btn-with-icon`~~ - Buttons with icons
- ~~`.cta-secondary`~~ - Secondary CTA variant
- ~~`.cta-outline`~~ - CTA for dark backgrounds
- ~~Legacy `.button` styles~~ - Old compatibility layer

### Removed Files
- ~~`/src/styles/components/buttons.scss`~~ - Duplicate file
- ~~`/src/components/examples/ButtonExamples.tsx`~~ - Demo component

## Benefits of Minimal Approach

1. **Performance** - Smaller CSS bundle, faster loading
2. **Maintainability** - Only maintain styles that are actually used
3. **Clarity** - Clear purpose for every CSS class
4. **No dead code** - Every line serves a purpose
5. **Focused system** - Simple, easy to understand

## Adding New Button Styles

If you need additional button styles in the future:

1. **First check** if existing classes can be combined
2. **Add to button.scss** following the same pattern
3. **Update this documentation** to reflect the changes
4. **Keep it minimal** - only add what you actually need

## Performance Notes

- All hover effects use `transform: translateY()` for GPU acceleration
- CSS transitions are optimized for performance
- Responsive design uses mobile-first approach
- Minimal CSS footprint: ~75 lines vs. 320+ lines previously
