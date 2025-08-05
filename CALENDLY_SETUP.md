# Calendly Configuration

## Setup Instructions

1. **Update your Calendly URL** in `src/lib/calendly.ts`:
   ```typescript
   export const calendlyConfig: CalendlyConfig = {
     url: 'https://calendly.com/YOUR-USERNAME/YOUR-EVENT', // Update this
     defaultUtm: {
       utmSource: 'website',
       utmMedium: 'cta',
       utmCampaign: 'strategy_call'
     }
   };
   ```

2. **Replace `YOUR-USERNAME` and `YOUR-EVENT`** with your actual Calendly details.

## Common Calendly URLs

- Strategy Call: `https://calendly.com/your-username/strategy-call`
- Free Consultation: `https://calendly.com/your-username/free-consultation`
- Discovery Call: `https://calendly.com/your-username/discovery-call`

## UTM Tracking

The implementation automatically adds UTM parameters to track where calls are coming from:

- **Home Hero**: `utm_content=hero_home`
- **About Hero**: `utm_content=hero_about`
- **Services Hero**: `utm_content=hero_services`
- **Packages Hero**: `utm_content=hero_packages`
- **Package Cards**: `utm_content=package_[packagename]`
- **PreFooter**: `utm_content=prefooter`

## Usage in Components

### Hero Component
```tsx
<Hero 
  cta={{
    text: "Book a Free Strategy Call",
    type: "calendly",
    utmContent: "hero_home",
    utmTerm: "strategy_call"
  }}
/>
```

### Direct Button
```tsx
<CalendlyButton 
  utmContent="custom_location"
  utmTerm="strategy_call"
>
  Book Your Call
</CalendlyButton>
```

### Package Card
```tsx
<PackageCard 
  ctaType="calendly"
  utmContent="package_starter"
  // ... other props
/>
```

## Testing

1. After updating your Calendly URL, test the integration:
   - Click any "Book a Free Strategy Call" button
   - Verify the modal opens with your correct Calendly event
   - Check that UTM parameters are being added to the URL

2. Test on different devices to ensure responsive behavior

## Analytics

If you have Google Analytics set up, the integration will automatically track:
- `calendly_popup_opened` events
- UTM parameters for attribution tracking

## Customization

- **Button styles**: Edit `src/components/atoms/CalendlyButton/CalendlyButton.scss`
- **Modal appearance**: Calendly's modal inherits your site's color scheme
- **Loading states**: The button shows a loading spinner while Calendly loads
- **Error handling**: Falls back to opening Calendly in a new tab if the modal fails
