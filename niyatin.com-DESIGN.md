# Design System Inspired by Niyatin

## 1. Visual Theme & Atmosphere

Niyatin's design embodies a spiritual yet practical aesthetic rooted in Indonesian Islamic culture. The system balances warmth with restraint, using a grounded earth-tone palette anchored by deep forest greens and warm golds. The typography is clean and modern, lending accessibility and clarity to devotional content. The overall mood is meditative and encouraging—inviting users into a journey of spiritual habit formation without judgment. There's a quiet confidence in the design: calm guidance for building better daily practices through intention (niyah) and consistency. Visual hierarchy emphasizes progress and achievement while maintaining a sense of cultural authenticity through thoughtful color and spacing choices.

**Key Characteristics**
- Earthy, warm color foundation with teal-green accents representing renewal and growth
- Generous whitespace and breathing room between sections
- Soft shadows and elevated cards create depth without harshness
- Typography emphasizes readability and hierarchy through consistent font families and scale
- Indonesian cultural authenticity expressed through color choices and language integration
- Accessibility-first approach with high contrast and clear interactive targets
- Spiritual, contemplative mood balanced with modern, clean interaction patterns

## 2. Color Palette & Roles

### Primary
- **Primary Brand** (`#1F5F4A`): Core interactive element, buttons, and primary CTAs. Deep forest green evoking growth and spiritual grounding.
- **Primary Light** (`#5B8C5A`): Secondary button states, hover effects, and progress indicators. Lighter teal-green for accessibility and visual interest.

### Accent Colors
- **Gold Accent** (`#C9A961`): Premium highlights, badges, early-bird labels, and secondary accents. Conveys value and importance.
- **Dark Brown** (`#1F1B12`): Primary text, headings, and dominant UI text. Warm, grounded neutral for readability.

### Interactive
- **Button Surface Light** (`rgba(91, 140, 90, 0.3)`): Secondary button background with transparency, used for non-primary actions.
- **Button Surface Dark** (`rgba(20, 63, 49, 0.4)`): Primary button background with transparency, used for main CTAs and confirmations.

### Neutral Scale
- **Cream Off-White** (`#FAF8F3`): Warm white for subtle backgrounds and card fill layers.
- **Light Cream** (`#F0EBE0`): Secondary background, form containers, and light surface areas.
- **Off-Gray** (`#E5E7EB`): Borders, dividers, and subtle separation lines.
- **Medium Gray** (`#A89D80`): Secondary text and de-emphasized content.
- **Dark Gray** (`#888780`): Tertiary text and caption support.
- **Charcoal** (`#5F5E5A`): Deep text alternative to pure black.
- **Pure White** (`#FFFFFF`): Card backgrounds, elevated surfaces, and text on colored backgrounds.

### Surface & Borders
- **Gray 300** (`#E5E7EB`): Primary border stroke, form outlines, and divider lines.
- **Brown Surface** (`#332F26`): Subtle background variations and section separation.
- **Muted Brown** (`#4A4439`): Alternative neutral surface for card variations.

### Shadow Colors
- Shadow colors are expressed through rgba values integrated with elevation levels (see section 6).

## 3. Typography Rules

### Font Family
- **Primary Font:** Plus Jakarta Sans (via `__Plus_Jakarta_Sans_646807`), sans-serif fallback stack: `system-ui, -apple-system, sans-serif`
- **Secondary Font:** Plus Jakarta Sans (same family for consistency across all typographic roles)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display / H1 | Plus Jakarta Sans | 34px | 500 | 35.7px | 0px | Page hero headings, large statements |
| Heading / H2 | Plus Jakarta Sans | 18px | 500 | 22.5px | 0px | Section headings, card titles |
| Body | Plus Jakarta Sans | 14px | 500 | 17.5px | 0px | Primary body text, descriptions |
| Button | Plus Jakarta Sans | 16px | 400 | 24px | 0px | All button labels and CTAs |
| Link | Plus Jakarta Sans | 11px | 500 | 16.5px | 0px | Inline links, navigation items |
| Caption | Plus Jakarta Sans | 10px | 500 | 15px | 0px | Small labels, badge text, metadata |
| List Item | Plus Jakarta Sans | 11px | 400 | 17.875px | 0px | Bullet and numbered list content |

### Principles
- Single font family (Plus Jakarta Sans) throughout ensures visual cohesion and reduces cognitive load
- Weight hierarchy: 500 for headings and important text, 400 for body and buttons
- Line height scales proportionally with size, maintaining 1.05–1.6× multiplier for readability
- Body text sized at `14px` with `17.5px` line height ensures comfortable reading for extended spiritual content
- Button text uses `16px` with heavier line height (`24px`) to accommodate multi-line scenarios
- Captions and metadata use `10px` with careful line height to remain legible at small sizes

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background:** `rgba(20, 63, 49, 0.4)` (semi-transparent dark teal)
- **Text Color:** `#FFFFFF`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `16px 24px` (inferred from CTA patterns)
- **Border Radius:** `8px`
- **Border:** `0px solid transparent`
- **Box Shadow:** `rgba(31, 95, 74, 0.5) 0px 10px 25px -8px`
- **Line Height:** `24px`
- **Min Height:** `56px` (accessible touch target)
- **Hover State:** Background opacity increases to `rgba(20, 63, 49, 0.6)`, shadow becomes `rgba(31, 95, 74, 0.8) 0px 14px 28px -14px`

#### Secondary Button
- **Background:** `rgba(91, 140, 90, 0.3)` (semi-transparent light teal)
- **Text Color:** `#FFFFFF`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `16px 24px`
- **Border Radius:** `8px`
- **Border:** `0px solid transparent`
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
- **Line Height:** `24px`
- **Min Height:** `56px`
- **Hover State:** Background opacity increases to `rgba(91, 140, 90, 0.5)`

#### Ghost Button
- **Background:** `transparent`
- **Text Color:** `#1F1B12`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `12px 16px`
- **Border Radius:** `8px`
- **Border:** `1px solid #E5E7EB`
- **Box Shadow:** `none`
- **Line Height:** `24px`
- **Hover State:** Background becomes `#FAF8F3`, border becomes `#D0C9B3`

### Cards & Containers

#### Standard Card
- **Background:** `#FFFFFF`
- **Border:** `1px solid #E5E7EB`
- **Border Radius:** `12px`
- **Padding:** `24px`
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
- **Margin Bottom:** `24px`

#### Elevated Card (Progress/Stats)
- **Background:** `#FFFFFF`
- **Border:** `2px solid #1F1B12`
- **Border Radius:** `16px`
- **Padding:** `24px`
- **Box Shadow:** `rgba(31, 95, 74, 0.5) 0px 10px 25px -8px`
- **Margin Bottom:** `32px`

#### Teal Stat Card (Active/Highlight)
- **Background:** `#1F5F4A`
- **Text Color:** `#FFFFFF`
- **Border Radius:** `12px`
- **Padding:** `20px`
- **Box Shadow:** `rgba(31, 95, 74, 0.5) 0px 10px 25px -8px`
- **Font Size:** `14px` (body)

### Inputs & Forms

#### Text Input
- **Background:** `#FAF8F3`
- **Border:** `1px solid #E5E7EB`
- **Border Radius:** `8px`
- **Padding:** `12px 16px`
- **Font Size:** `14px`
- **Font Color:** `#1F1B12`
- **Line Height:** `17.5px`
- **Min Height:** `44px` (accessible touch target)
- **Focus State:** Border becomes `#1F5F4A`, background remains `#FAF8F3`, box shadow `rgba(31, 95, 74, 0.5) 0px 0px 0px 3px`

#### Checkbox / Radio
- **Accent Color:** `#1F5F4A`
- **Background (Unchecked):** `#FFFFFF`
- **Border:** `1px solid #E5E7EB`
- **Border Radius:** `4px` (checkbox), `999px` (radio)
- **Size:** `20px × 20px`
- **Checked Background:** `#1F5F4A`
- **Checked Border:** `#1F5F4A`

### Navigation

#### Header Navigation
- **Background:** `#FFFFFF`
- **Text Color:** `#1F1B12`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Height:** `64px`
- **Padding:** `16px 24px`
- **Border Bottom:** `1px solid #E5E7EB`
- **Link Hover:** Text color becomes `#1F5F4A`

#### Badge / Label
- **Background:** `#C9A961`
- **Text Color:** `#FFFFFF`
- **Font Size:** `10px`
- **Font Weight:** `500`
- **Padding:** `4px 12px`
- **Border Radius:** `12px`
- **Line Height:** `15px`
- **Use Case:** Early bird badges, streak indicators, status labels

## 5. Layout Principles

### Spacing System

**Base Unit:** `8px`

**Spacing Scale:**
- **xs:** `4px` – micro spacing within components (button icon gaps)
- **sm:** `8px` – small gap between related elements
- **md:** `12px` – standard padding for small containers
- **lg:** `16px` – padding for form inputs and standard containers
- **xl:** `20px` – section margin, moderate vertical rhythm
- **2xl:** `24px` – card padding, strong section separation
- **3xl:** `32px` – large margin between major sections
- **4xl:** `40px` – section spacing
- **5xl:** `48px` – significant section breaks
- **10xl:** `84px` – hero section spacing
- **12xl:** `96px` – full page section separation

**Usage Context:**
- Micro spacing (`4px`): Icon separation within buttons
- Small (`8px`): Internal form group gaps, badge spacing
- Standard (`12px–16px`): Form inputs, nested card elements
- Section (`20px–24px`): Between feature blocks, card padding
- Major (`32px–96px`): Between major sections, page rhythm

### Grid & Container

- **Max Width:** `1200px` (assumed from typical web layout patterns)
- **Column Strategy:** 12-column grid with `24px` gutter
- **Container Padding:** `24px` on desktop, `16px` on tablet, `12px` on mobile
- **Section Pattern:** Full-width sections with centered max-width containers; alternating background colors (cream, white) for visual rhythm

### Whitespace Philosophy

Generous whitespace is central to Niyatin's contemplative atmosphere. Sections breathe with `48px–96px` margins between major content blocks. Cards and containers use consistent `24px` padding to create internal breathing room. The design avoids visual clutter, allowing spiritual content to feel intentional and unhurried. Vertical rhythm is prioritized over horizontal density.

### Border Radius Scale

- **xs:** `2px` – subtle rounding for form elements (not commonly used)
- **sm:** `4px` – minor components, image thumbnails
- **md:** `8px` – buttons, inputs, small cards
- **lg:** `12px` – standard cards, moderate containers
- **xl:** `16px` – elevated cards, featured containers
- **full:** `9999px` – badges, pills, rounded links

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| **None (Flat)** | `box-shadow: none` | Ghost buttons, transparent overlays, minimalist UI states |
| **Subtle (sm)** | `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px` | Secondary cards, inactive button states, light elevation |
| **Medium (md)** | `rgba(31, 95, 74, 0.5) 0px 10px 25px -8px` | Primary buttons, elevated cards, featured content |
| **Strong (lg)** | `rgba(0, 0, 0, 0.25) 0px 25px 50px -12px` | Modals, dropdowns, overlaid surfaces |
| **Heavy (xl)** | `rgba(0, 0, 74, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px` | Floating action buttons, stacked modals |

**Shadow Philosophy:** Shadows are subtle and warm, using teal-tinted shadows (`rgba(31, 95, 74, 0.5)`) for primary elevation to reinforce brand identity. Larger shadows are rarely deployed; the design favors restraint and clarity over dramatic depth. Shadows communicate hierarchy and interactivity without visual noise. The primary shadow accent color references the brand's teal (`#1F5F4A`), creating visual cohesion between spatial depth and brand presence.

## 7. Do's and Don'ts

### Do
- Use the teal-green (`#1F5F4A`) for all primary interactive elements and CTAs
- Maintain generous whitespace (`24px–48px`) between major content sections
- Deploy Plus Jakarta Sans consistently across all text roles; weight shifts (400/500) manage hierarchy
- Apply semi-transparent button backgrounds (`rgba(...)`) to create depth without solid fills
- Include accessible touch targets minimum `44px` height for all interactive elements
- Use warm gold (`#C9A961`) sparingly for badges, highlights, and premium labels
- Implement teal-tinted shadows (`rgba(31, 95, 74, ...)`) for primary elevation states
- Embrace the cream and off-white palette (`#FAF8F3`, `#F0EBE0`) for warm backgrounds
- Test contrast ratios to ensure WCAG AA compliance for all text pairs
- Maintain consistent `12px` border radius for standard cards and containers

### Don't
- Avoid pure black (`#000000`) for text; use `#1F1B12` (warm brown) as primary text color
- Don't use solid, opaque button backgrounds; maintain transparency for visual refinement
- Avoid excessive color saturation; the palette is intentionally warm and muted
- Don't apply harsh drop shadows; use subtle, warm-tinted shadows with small blur
- Avoid clustering sections without breathing room; minimum `24px` margin between major blocks
- Don't override Plus Jakarta Sans for body or button text; consistency drives usability
- Avoid high-contrast accent colors that compete with teal and gold; the palette is curated
- Don't create interactive elements smaller than `44px` in any dimension
- Avoid pure white (`#FFFFFF`) for primary text backgrounds; use cream tones for reduced eye strain
- Don't underestimate the importance of line height; maintain 1.2–1.6× multiplier for readability

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| **Mobile** | `320px–639px` | Single column, `12px` padding, `14px` heading, stacked cards, bottom navigation |
| **Tablet** | `640px–1023px` | Two columns, `16px` padding, `18px` heading, side-by-side cards where appropriate, top navigation |
| **Desktop** | `1024px–1919px` | Three+ columns, `24px` padding, full hero width, multi-column layouts, fixed navigation |
| **Large Desktop** | `1920px+` | Max-width container `1200px`, centered layout, expanded whitespace |

### Touch Targets

- **Minimum Touch Height:** `44px` (vertical)
- **Minimum Touch Width:** `44px` (horizontal)
- **Recommended Spacing Between Targets:** `8px`
- **Button Padding:** `12px–16px` vertical, `16px–24px` horizontal to achieve accessibility
- **Form Input Height:** `44px` minimum
- **Icon Size:** `24px–32px` for interactive icons
- **Link Line Height:** Maintain `16.5px–24px` for clickable text areas

### Collapsing Strategy

- **Hero Section:** Full viewport height on desktop; 60% on tablet; 100% on mobile (shorter hero, more content visibility)
- **Multi-Column Layouts:** Desktop (3 col) → Tablet (2 col) → Mobile (1 col stack)
- **Navigation:** Top horizontal nav (desktop/tablet) → Hamburger menu (mobile)
- **Padding:** `24px` desktop → `16px` tablet → `12px` mobile
- **Font Sizes:** Hold typography scale constant; increase line height on smaller screens
- **Card Grids:** `12px` gap (desktop) → `12px` gap (tablet) → `8px` gap (mobile)
- **Spacing Between Sections:** `96px` desktop → `48px` tablet → `32px` mobile
- **Buttons:** Full-width on mobile, auto-width with min `120px` on desktop
- **Images:** Responsive `width: 100%; max-width: 100%;` with maintained aspect ratio

## 9. Agent Prompt Guide

### Quick Color Reference

Use these mappings for rapid implementation:

- **Primary CTA / Button:** Teal-Dark (`#1F5F4A`)
- **Secondary Button:** Teal-Light (`#5B8C5A`)
- **Accent / Badge:** Gold (`#C9A961`)
- **Primary Text:** Brown (`#1F1B12`)
- **Body Text:** Brown (`#1F1B12`)
- **Heading Text:** Brown (`#1F1B12`)
- **Background (Primary):** White (`#FFFFFF`)
- **Background (Secondary):** Cream (`#F0EBE0`)
- **Background (Tertiary):** Light Cream (`#FAF8F3`)
- **Border / Divider:** Gray (`#E5E7EB`)
- **Secondary Text:** Medium Gray (`#A89D80`)
- **Disabled Text:** Dark Gray (`#888780`)
- **Surface Variation:** Muted Brown (`#4A4439`)
- **Card Highlight (Stat):** Teal (`#1F5F4A`)
- **Button Shadow:** `rgba(31, 95, 74, 0.5) 0px 10px 25px -8px`

### Iteration Guide

Follow these 10 rules to implement Niyatin's design accurately:

1. **Always use Plus Jakarta Sans** with 400 weight for buttons, 500 weight for headings; never substitute fonts unless explicitly required.

2. **Button backgrounds must be semi-transparent** (`rgba(...)`) with warm teal base; avoid solid fills. Primary: `rgba(20, 63, 49, 0.4)`, Secondary: `rgba(91, 140, 90, 0.3)`.

3. **Primary text is warm brown** (`#1F1B12`), never pure black. Apply this to all headings, body copy, and interactive text unless explicitly on teal backgrounds.

4. **Maintain minimum `44px` height** for all clickable elements (buttons, inputs, links). Add vertical padding if needed; don't reduce size.

5. **Shadows are teal-tinted and subtle**: use `rgba(31, 95, 74, 0.5) 0px 10px 25px -8px` for primary elevation. Avoid harsh, dark shadows.

6. **Spacing scale is 8px-based**: use multiples like `8px`, `16px`, `24px`, `32px`, `48px`, `96px`. Never arbitrary values unless specified.

7. **Cards use 12px border radius** minimum; elevated/featured cards use `16px`. Buttons use `8px` radius.

8. **Line heights scale 1.05–1.6× the font size**: `14px` body = `17.5px` line height; `16px` button = `24px` line height. Never compress line height below 1.2×.

9. **Whitespace is intentional and generous**: sections separated by `24px–96px` margins depending on content. Avoid cramped layouts; breathing room reinforces spiritual tone.

10. **Gold (`#C9A961`) is reserved for badges, highlights, and premium labels**; use sparingly. Don't apply to body text or secondary buttons; keep visual hierarchy clear.