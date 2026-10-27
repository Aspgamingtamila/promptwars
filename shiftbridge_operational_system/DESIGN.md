---
name: ShiftBridge Operational System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#3e4947'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a61'
  primary: '#005f57'
  on-primary: '#ffffff'
  primary-container: '#0d7a70'
  on-primary-container: '#acfff3'
  inverse-primary: '#7dd6ca'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#824500'
  on-tertiary: '#ffffff'
  tertiary-container: '#a65900'
  on-tertiary-container: '#ffede1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#99f3e6'
  primary-fixed-dim: '#7dd6ca'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.03em
  data-tabular:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 1.5rem
  margin-sm: 1rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system drives a mission-critical workforce coordination platform spanning dual enterprise sectors: higher education & schools, and non-clinical hospital support operations (facilities management, patient transport, dietary services, and environmental sanitization). 

The emotional tone balances high-velocity operational command with calm, humanistic reassurance. The interface rejects sterile healthcare-blue defaults and cold enterprise tropes in favor of an authoritative, warm editorial dashboard. Information architecture must feel immediate, grounded, and legible under high-stress conditions without overwhelming dispatchers or field leads with decorative noise.

The design movement combines **Contemporary Editorial Workspace** and **Refined Utilitarianism**:
- **Structured Surface Hierarchy**: Warm tinted off-white canvases paired with deep slate-ink typography.
- **Intentional Chromatic Cues**: High-contrast, state-driven functional accents rather than arbitrary brand floods.
- **Operational Tactility**: Clear structural outlines, deliberate 1px division hairlines, and legible numerical sequencing designed for shift rosters, handovers, and live coverage maps.

## Colors

The palette relies on a balanced foundation of warm architectural neutrals, decisive deep-teal anchors, and targeted role-based accents.

### Core Foundation
- **Canvas Base**: `#F8FAF9` (Main backdrop, reducing eye fatigue during 12-hour shifts)
- **Canvas Subdued / Recessed**: `#F1F5F3` (Filter bars, split panes, table headers)
- **Surface Pure**: `#FFFFFF` (Operational cards, modal dialogs, flyout sheets)
- **Primary Deep Teal**: `#0D7A70` (Primary interactions, active navigation, positive commitment)
- **Primary Active / Hover**: `#095750` (Deepened anchor state for actionable elements)
- **Primary Tint Surface**: `#E6F4F2` (Selected row background, primary soft chip fills)

### Text & Contrast Hierarchy
- **Text Ink Primary**: `#0F172A` (Headings, critical schedule metrics, primary text)
- **Text Slate Secondary**: `#334155` (Field labels, timestamps, location metadata)
- **Text Muted / Subdued**: `#64748B` (Inactive states, table column captions, breadcrumbs)

### Sector Modes & Functional Status
- **Education / Campus Sector Accent**: Slate Indigo (`#4338CA`, soft fill `#EEF2FF`) used for academic terms, residence hall tracking, and campus facility shifts.
- **Hospital Support Sector Accent**: Muted Seafoam Emerald (`#059669`, soft fill `#ECFDF5`) used strictly for logistics, linen routing, and sanitation wings.
- **Amber Attention (Urgent / Warning / Blocked)**: `#D97706` (Border / Text), `#FEF3C7` (Fill)
- **Critical Alert / Overdue**: `#DC2626` (Border / Text), `#FEF2F2` (Fill)
- **Resolved / Done**: `#0D7A70` or `#16A34A` (Border / Text), `#F0FDF4` (Fill)
- **Neutral / Draft / Scheduled**: `#475569` (Border / Text), `#F1F5F9` (Fill)
- **Overnight Shift Flag**: Deep Night Violet (`#4C1D95`, soft fill `#F5F3FF`)
- **Hairline Dividing Borders**: `#E2E8F0` / `#E4E9E6`

## Typography

The type system prioritizes instantaneous roster scanning, dense shift table alignment, and tabular clarity across timezones and schedule slots.

- **Typeface Selection**: `Plus Jakarta Sans` across display, body, and label roles for its balance of geometric structure, wide counters, and distinct numeral forms (essential for time stamping like `06:30 - 15:00`).
- **Tabular Figures**: All data displays, shift counts, timestamps, and roster rosters must enable `font-variant-numeric: tabular-nums` to eliminate jitter across auto-refreshing tables.
- **Hierarchy Rules**: 
  - Restrain `display-lg` to global capacity metrics and shift overview totals.
  - Apply `label-sm` with slight uppercase tracking (`0.03em`) strictly for status chips, building wings, and operational tags.
  - Maintain `body-md` (14px) as the default operational density standard for records, lists, and form controls.

## Layout & Spacing

The layout is built on a rigorous 8-point base increment, pairing a fluid responsive grid with standardized side utility drawers.

### Grid Construction
- **Desktop (>= 1280px)**: 12-column layout with 24px (`1.5rem`) gutters and 40px (`2.5rem`) outer canvas margins. Features a persistent 260px operational side rail for facility/campus switcher and active dispatch queues.
- **Tablet (768px - 1279px)**: 8-column layout with 16px (`1rem`) gutters and 24px (`1.5rem`) margins. Navigation collapses to an icon rail; multi-roster views shift from side-by-side to stacked panels.
- **Mobile (< 768px)**: 4-column layout with 12px gutters and 16px (`1rem`) margins. Schedule tables convert to unified vertical incident/shift cards.

### Spacing Principles
- Density is prioritized inside operational grids: row cell paddings default to 12px vertical and 16px horizontal to prevent artificial scroll sprawl.
- High-level metric panels and section groups employ `space-xl` (`2rem`) separation to visually bracket critical status buckets without heavy dividers.

## Elevation & Depth

Visual hierarchy uses physical stacking with tinted, low-opacity shadows and sharp border separation. Diffuse glassmorphic effects are excluded to prevent illegibility across complex shifts.

### Elevation Levels
- **Level 0 (Flat Canvas)**: `#F8FAF9`. Zero elevation. Houses background work areas, table headers, and structural frames.
- **Level 1 (Card & Module Resting)**: Pure white `#FFFFFF` surface bordered by a crisp `1px solid #E2E8F0`. Shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Active Shifts & Interactive Hover)**: Shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`. Border shifts slightly darker (`#CBD5E1`) on hover.
- **Level 3 (Flyout Drawers, Shift Reassignment Popovers)**: Shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`. Outlined with `#CBD5E1`.
- **Level 4 (Modals & Escalation Overlays)**: Shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`. Accompanied by a 30% slate backdrop overlay (`#0F172A4D`).

## Shapes

The geometric framework favors controlled, stable corner radii that balance ergonomic comfort with data grid alignment.

- **Base Radius (`0.25rem` / 4px)**: Form fields, checkboxes, dense data table tags, and inline badges.
- **Medium Radius (`0.5rem` / 8px - `rounded-lg`)**: Primary action buttons, summary cards, split dropdown menus, and standard roster blocks.
- **Large Radius (`0.75rem` / 12px - `rounded-xl`)**: Global dashboard panels, modal containers, and slide-over assignment sheets.
- **Pill Radius (`9999px`)**: Reserved exclusively for lifecycle status indicators (e.g., `Checked In`, `Blocked`, `Resolved`) to differentiate status indicators from rectangular action triggers.

## Components

### Buttons
- **Primary Action**: Solid `#0D7A70` fill, white `#FFFFFF` text (`label-lg`), 8px radius. Height: 40px (desktop) / 44px (touch). Hover: `#095750`. Focus: 2px offset ring in `#0D7A70`.
- **Secondary Action**: White `#FFFFFF` fill, `#0F172A` text, bordered by `1px solid #CBD5E1`. Hover: `#F8FAF9` with text `#0F172A`.
- **Critical / Danger**: White `#FFFFFF` fill, `#DC2626` text, bordered by `1px solid #FCA5A5`. Hover: `#FEF2F2`.
- **Ghost Utility**: Transparent fill, `#475569` text. Hover: `#F1F5F3`.

### Status Badges (Pills)
All badges utilize 9999px corner rounding, height 24px, horizontal padding 10px, typography `label-sm` with an integrated 6px solid status dot:
- **Scheduled**: Background `#F1F5F9`, border `#CBD5E1`, text `#475569`, dot `#64748B`.
- **Checked In**: Background `#E6F4F2`, border `#99D5CF`, text `#095750`, dot `#0D7A70`.
- **In Progress**: Background `#EEF2FF`, border `#C7D2FE`, text `#3730A3`, dot `#4F46E5`.
- **Blocked**: Background `#FEF3C7`, border `#FDE68A`, text `#92400E`, dot `#D97706`.
- **Done / Resolved**: Background `#ECFDF5`, border `#A7F3D0`, text `#065F46`, dot `#059669`.
- **Overnight**: Background `#F5F3FF`, border `#DDD6FE`, text `#5B21B6`, dot `#7C3AED`.

### Cards & Dispatch Panels
- Background `#FFFFFF`, border `1px solid #E2E8F0`, corner radius 12px (`rounded-xl`).
- Internal layout separation uses 1px inset divider lines (`#F1F5F9`) rather than heavy nested boxes.
- Interactive shift cards display an active 3px accent bar along their left border indicating department (Slate Indigo for Campus, Seafoam Emerald for Hospital Support).

### Lists & Shift Rosters
- Alternating subtle rows: odd rows `#FFFFFF`, even rows `#FAFCFB`.
- Hover state: `#F1F7F6` with an instantaneous left indicator line.
- Header row: `#F1F5F3`, text uppercase `label-sm` in `#64748B`, height 36px, `border-b: 1px solid #E2E8F0`.

### Form Inputs & Checkboxes
- **Input Fields**: Height 40px, background `#FFFFFF`, border `1px solid #CBD5E1`, radius 6px, text `body-md` in `#0F172A`. Placeholder `#94A3B8`. Focus state: border `#0D7A70`, box-shadow `0 0 0 3px rgba(13, 122, 112, 0.15)`.
- **Checkboxes**: 18px × 18px square, 4px corner radius. Unchecked: `1.5px solid #94A3B8`. Checked: solid `#0D7A70` with crisp white check mark icon.

### Operational Callout Strips
- Integrated alert banner for unassigned shifts or protocol changes. Background `#FFFBEB`, border-left `4px solid #D97706`, padding 12px 16px, text `#92400E` (`body-md`), with dismiss and rapid assignment triggers.