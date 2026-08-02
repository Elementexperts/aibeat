# AIBeat Design System

## Direction

AIBeat uses a dark, editorial technology visual system. The design should feel premium, fast, credible, and founder-friendly without inventing traffic, subscriber, rating, or partner claims.

## Tokens

- Background: `#07080B`
- Elevated background: `#0D0F14`
- Strong surface: `#13161D`
- Card: `rgba(255, 255, 255, 0.035)`
- Text: `#F7F8FA`
- Secondary text: `#A7ADBA`
- Muted text: `#747B8A`
- Border: `rgba(255, 255, 255, 0.08)`
- Strong border: `rgba(255, 255, 255, 0.14)`
- Primary gradient: `linear-gradient(135deg, #8B5CF6 0%, #3B82F6 52%, #22D3EE 100%)`

## Typography

The project uses editorial serif, interface sans, and mono font stacks configured in Tailwind. Remote CSS font imports are intentionally avoided so production builds do not depend on Google Fonts network access.

## Components

- `site-shell`: standard max-width container.
- `premium-card`: reusable dark card with subtle elevation.
- `glass-card`: blurred translucent surface.
- `gradient-button`: primary CTA treatment.
- `gradient-text`: hero/accent text treatment.
- Header theme preview: the top navigation includes a local-only dark/white preview switch for visual QA. It stores the selected view in browser local storage and does not expose secrets or change server rendering.

## Motion

Ambient motion is limited to the hero orbit and discovery strip. Reduced-motion users receive near-instant nonessential animation.

## Accessibility

The dark system uses high-contrast text, visible focus states, semantic links/buttons, and reduced-motion support. Existing forms keep labels and server validation.
