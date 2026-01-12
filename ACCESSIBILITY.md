# Accessibility Features

This document outlines the accessibility features implemented in the AILesson platform to ensure compliance with WCAG 2.1 Level AA standards.

## Overview

The AILesson platform is designed to be accessible to all users, including those with disabilities. We follow Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.

## Key Accessibility Features

### 1. Semantic HTML and ARIA Labels

All components use proper semantic HTML elements and ARIA attributes:

- **Semantic Structure**: Proper use of `<header>`, `<main>`, `<nav>`, `<section>`, `<article>` elements
- **ARIA Labels**: All interactive elements have descriptive `aria-label` attributes
- **ARIA Roles**: Appropriate roles for custom components (e.g., `role="radiogroup"`, `role="checkbox"`)
- **ARIA States**: Dynamic state communication with `aria-checked`, `aria-expanded`, `aria-busy`
- **ARIA Live Regions**: Error messages and status updates use `aria-live="polite"` or `role="alert"`

#### Examples:
```tsx
// Skip to main content link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Proper heading hierarchy
<h1>Dashboard</h1>
<h2>Statistics</h2>
<h3>Wisdom Coins</h3>

// ARIA labels for icons
<span role="img" aria-label="Settings icon">⚙️</span>
```

### 2. Keyboard Navigation

Full keyboard navigation support throughout the application:

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Focus Management**: Visible focus indicators on all focusable elements
- **Focus Trapping**: Modal dialogs and menus trap focus appropriately
- **Keyboard Shortcuts**:
  - `Escape`: Close modals and menus
  - `Enter`: Submit forms and activate buttons
  - `Arrow Keys`: Navigate through options in quizzes and lists
  - `Tab/Shift+Tab`: Navigate between interactive elements

#### Custom Hooks:
- `useKeyboardNavigation`: Handles keyboard shortcuts
- `useFocusTrap`: Manages focus within modals
- `useRovingTabIndex`: Implements roving tabindex for lists

#### Examples:
```tsx
// Keyboard navigation in quiz options
<button
  role="radio"
  aria-checked={selected}
  onKeyDown={(e) => {
    if (e.key === 'ArrowDown') navigateToNext();
    if (e.key === 'ArrowUp') navigateToPrevious();
    if (e.key === 'Enter' || e.key === ' ') selectOption();
  }}
>
  Option
</button>
```

### 3. Reduced Motion Support

Respects user's motion preferences:

- **Media Query Detection**: Detects `prefers-reduced-motion: reduce`
- **Disabled Animations**: All animations disabled when reduced motion is preferred
- **Static Alternatives**: 3D components show static fallbacks
- **CSS Transitions**: Reduced to minimal duration (0.01ms)

#### Implementation:
```tsx
// useReducedMotion hook
const prefersReducedMotion = useReducedMotion();

// Conditional rendering
{prefersReducedMotion ? (
  <StaticCard {...props} />
) : (
  <Card3D {...props} />
)}
```

#### CSS:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 4. Screen Reader Support

Optimized for screen reader users:

- **Alt Text**: All images and icons have descriptive alt text
- **Hidden Decorative Elements**: Decorative elements marked with `aria-hidden="true"`
- **Screen Reader Only Text**: Important context provided via `.sr-only` class
- **Form Labels**: All form inputs have associated labels
- **Error Messages**: Errors announced via `role="alert"` or `aria-live`

#### Examples:
```tsx
// Screen reader only description
<span id="email-description" className="sr-only">
  Enter your email address to sign in
</span>
<input aria-describedby="email-description" />

// Hidden decorative icon
<div className="icon" aria-hidden="true">✓</div>
```

### 5. Color Contrast

Meets WCAG AA color contrast requirements:

- **Text Contrast**: Minimum 4.5:1 ratio for normal text
- **Large Text**: Minimum 3:1 ratio for large text (18pt+)
- **Interactive Elements**: Sufficient contrast for buttons and links
- **Focus Indicators**: High contrast focus outlines (2px solid)

### 6. Form Accessibility

All forms are fully accessible:

- **Labels**: Every input has an associated label
- **Required Fields**: Marked with `aria-required="true"`
- **Error Handling**: Errors announced and associated with fields
- **Autocomplete**: Appropriate autocomplete attributes
- **Field Descriptions**: Additional context via `aria-describedby`

#### Example:
```tsx
<label htmlFor="email">Email address</label>
<input
  id="email"
  type="email"
  autoComplete="email"
  required
  aria-required="true"
  aria-describedby="email-description"
  aria-invalid={hasError}
/>
<span id="email-description" className="sr-only">
  Enter your email address
</span>
{error && (
  <div role="alert" aria-live="polite">
    {error}
  </div>
)}
```

### 7. Mobile Accessibility

Touch-friendly and mobile accessible:

- **Touch Targets**: Minimum 44x44px touch targets
- **Zoom Support**: Supports pinch-to-zoom
- **Orientation**: Works in both portrait and landscape
- **Haptic Feedback**: Vibration feedback on touch devices

## Testing

### Manual Testing Checklist

- [ ] Navigate entire site using only keyboard
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify color contrast with tools
- [ ] Test with reduced motion enabled
- [ ] Test on mobile devices
- [ ] Test with browser zoom at 200%
- [ ] Verify focus indicators are visible

### Automated Testing

Run accessibility tests:
```bash
npm run test:a11y
```

### Browser Extensions

Recommended testing tools:
- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Chrome DevTools accessibility audit

## Known Limitations

1. **3D Components**: Some 3D features may not be fully accessible to screen reader users. Static alternatives are provided when reduced motion is enabled.

2. **Complex Interactions**: Some complex quiz interactions may require additional keyboard shortcuts documentation.

## Future Improvements

- [ ] Add comprehensive keyboard shortcuts documentation
- [ ] Implement high contrast mode
- [ ] Add text-to-speech for lesson content
- [ ] Improve screen reader announcements for dynamic content
- [ ] Add customizable font sizes
- [ ] Implement dyslexia-friendly font option

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

## Contact

For accessibility issues or suggestions, please contact the development team or file an issue in the project repository.
