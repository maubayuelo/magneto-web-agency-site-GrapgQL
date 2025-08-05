# Calendly Configuration Guide

## Setup Instructions

To configure your Calendly integration, follow these steps:

### 1. Update Your Calendly URL

Edit the file `src/lib/calendly.ts` and replace the placeholder URL with your actual Calendly URL:

```typescript
// Replace this URL with your actual Calendly URL
export const calendlyConfig: CalendlyConfig = {
  url: 'https://calendly.com/YOUR-USERNAME/YOUR-EVENT-TYPE', // ← Update this
  defaultUtm: {
    utmSource: 'website',
    utmMedium: 'cta',
    utmCampaign: 'strategy_call'
  }
};
```

### 2. How to Get Your Calendly URL

1. Go to [calendly.com](https://calendly.com) and sign in
2. Navigate to your event types
3. Click on the event you want to use (e.g., "30 Minute Meeting" or "Strategy Call")
4. Copy the link that looks like: `https://calendly.com/your-username/your-event-type`

### 3. Test the Integration

After updating the URL:

1. Run your development server: `npm run dev`
2. Click any "Book a Free Strategy Call" button
3. Verify that your Calendly popup opens correctly

### 4. UTM Tracking

The system automatically adds UTM parameters to track where bookings come from:

- `utm_source=website`
- `utm_medium=cta`
- `utm_campaign=strategy_call`
- `utm_content` varies by location (e.g., `hero_home`, `package_starter`)

You can view these in your Calendly analytics or connect them to Google Analytics.

### 5. Customization Options

#### Button Variants
```tsx
<CalendlyButton variant="primary">Primary Button</CalendlyButton>
<CalendlyButton variant="secondary">Secondary Button</CalendlyButton>
<CalendlyButton variant="outline">Outline Button</CalendlyButton>
```

#### Custom UTM Content
```tsx
<CalendlyButton 
  utmContent="custom_location"
  utmTerm="custom_term"
>
  Custom Tracking
</CalendlyButton>
```

#### Custom Calendly URL
```tsx
<CalendlyButton customUrl="https://calendly.com/your-username/different-event">
  Different Event Type
</CalendlyButton>
```

### 6. Fallback Behavior

If Calendly fails to load, the system will automatically fall back to opening your Calendly page in a new tab, ensuring users can still book calls.

### 7. Analytics Integration

The integration automatically tracks events if you have Google Analytics installed:

- `calendly_popup_opened`: When a user clicks a Calendly button
- Event category: `engagement`
- Event label: Based on `utmContent`

### 8. Troubleshooting

**Calendly not opening?**
- Check your Calendly URL is correct
- Ensure your Calendly event is published and public
- Check browser console for errors

**Buttons not working?**
- Verify you're using the `CalendlyButton` component
- Check that the component is imported correctly
- Ensure you're not blocking popups in your browser

### 9. Current Integration Locations

Calendly buttons are currently integrated in:

- **Home page hero**: "Book a Free Strategy Call"
- **About page hero**: "Book a Free Strategy Call" 
- **About page bottom**: "Book a Free Strategy Call"
- **Services page hero**: "Book a Free Strategy Call"
- **Packages page hero**: "Book a Free Strategy Call"
- **Package cards**: Each package has a Calendly CTA
- **PreFooter**: "Request Free Quote"

All buttons automatically track their location for analytics.
