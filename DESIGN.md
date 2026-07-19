---
name: FrontendPilot AI Design System
description: Premium dark-mode developer tool design system representing autonomous quality loops.
colors:
  primary: "#8b8cff"
  primary-bright: "#b2b3ff"
  neutral-bg: "#08090d"
  neutral-surface: "#12141c"
  success: "#6ee7b7"
  warning: "#fbbf24"
  danger: "#fb7185"
  explorer-cyan: "#06b6d4"
  mapper-blue: "#3b82f6"
  analyzer-amber: "#f59e0b"
  repair-green: "#10b981"
  verifier-emerald: "#34d399"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(24px, 4vw, 36px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.6
rounded:
  sm: "10px"
  md: "16px"
  lg: "24px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-bright}"
    textColor: "#0c0d12"
    rounded: "{rounded.sm}"
    padding: "12px 17px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary-bright}"
    rounded: "{rounded.sm}"
    padding: "12px 17px"
---

# Design System: FrontendPilot AI

## 1. Overview

**Creative North Star: "The Command Deck"**

The Command Deck is a dark, precise, and surgical design language tailored for modern developers, QA engineers, and hackathon presenters. It takes aesthetic cues from tools like Warp, Raycast, Linear, and Cursor to establish immediate credibility. By prioritizing visual flow and data hierarchy, the interface guides attention progressively through the autonomous agent loop.

This system rejects flat, uninspired corporate spreadsheets and the generic SaaS cream/parchment defaults. Instead, it utilizes absolute deep dark fields, custom neon gradients, and responsive glowing active borders that pulse in real-time as the agent works.

**Key Characteristics:**
*   **Deep Contrast Fields**: Pitch black background elements paired with translucent surface overlays to create focus.
*   **Stage-Specific Accents**: Color-coded branding representing each pipeline step (cyan, blue, amber, green, emerald).
*   **Active Sweep & Ambient Glows**: Real-time scanner sweep animations over screenshots and subtle backing light shapes to suggest background lifecycle processes.
*   **Surgical Diffs**: Multi-line changes rendered as drop-in patches with color-coded code blocks.

## 2. Colors

A high-contrast dark palette with functional colors representing stage states and process states.

### Primary
- **Signal Purple** (#8b8cff / oklch(65% 0.17 280)): The core brand identifier. Used for major CTAs, active loader tracks, and system breadcrumbs.
- **Signal Bright** (#b2b3ff / oklch(75% 0.12 280)): The high-contrast accent variant for hover states, focused input selections, and prominent text.

### Neutral
- **Deep Void** (#08090d): The main page background color.
- **Surface Translucent** (rgba(18, 20, 28, 0.84)): The color of core container cards and workspace components.
- **Slate Text** (#f2f4f8): High-contrast text color for display headings and active options.
- **Secondary Muted** (#a8adbb): Text color for general descriptions and supporting paragraph layouts.

### Named Rules
**The Stage Identity Rule.** Each agent stage must exclusively use its assigned branding accent (Explorer uses Cyan `#06b6d4`, Source Mapper uses Blue `#3b82f6`, Analyzer uses Amber `#f59e0b`, Repair uses Green `#10b981`, and Verifier uses Emerald `#34d399`) for all active borders, inline tags, and state badges.

## 3. Typography

**Display Font:** Inter, sans-serif
**Body Font:** Inter, sans-serif
**Mono Font:** SFMono-Regular, Consolas, Monaco, monospace

Typography prioritizes fast reading and high confidence. Headings are set with tight letter-spacing to feel impactful, while body sections use wide line heights.

### Hierarchy
- **Display** (800, clamp(24px, 4vw, 36px), 1.15): Used for main page headers and target issues. Has a letter-spacing floor of (-0.04em).
- **Headline** (700, 22px, 1.25): Used for stage canvas titles and focus headings.
- **Body** (500, 14px, 1.6): Used for descriptive logs and fact cards. Line length is capped at (75ch) for legibility.
- **Label / Mono** (700, 11px, 1.4): Monospace snippets used for filenames, console outputs, and AST node locations.

## 4. Elevation

The system is flat at rest but uses ambient backing lights and glowing borders to convey focus and active processing.

### Shadow Vocabulary
- **Tactile Hover Lift** (0 12px 40px rgba(0,0,0,0.4)): Applied on hover to cards to make them feel responsive.
- **Ambient Floor Light** (radial-gradient(circle, rgba(94, 89, 215, 0.08) 0%, transparent 70%)): Floating backing gradients to lift major workspace headers.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Glowing borders and hover offsets are applied dynamically as a response to interactive selections or active pipeline execution.

## 5. Components

### Buttons
- **Shape:** Soft tactical corners (10px radius).
- **Primary:** Neon signal background (#b2b3ff) with dark text (#0c0d12).
- **Hover:** Slight vertical shift (-2px) with a soft radial drop shadow.

### Cards / Containers
- **Shape:** Rounded boundaries (16px radius).
- **Background:** Semi-transparent surface tint (rgba(18, 20, 28, 0.84)) with a 1px border.
- **Focus glow:** Border shifts to the active stage color during pipeline inspection.

### Inputs / Fields
- **Style:** Flat dark background with a 1px border.
- **Focus:** Border transitions to active brand blue with a 2px offset ring.

## 6. Do's and Don'ts

### Do:
- **Do** wrap code diff modifications in distinct search/replace blocks using green backgrounds for insertions and red backgrounds for deletions.
- **Do** show active browser screenshot mockups with scanning sweeps during the Explorer stage.
- **Do** allow users to click and select different stages in the StageRail sidebar to inspect logs manually.

### Don't:
- **Don't** use border-left stripe accents greater than 1px as decoration on cards.
- **Don't** use rounded radii greater than 24px on cards or visualizer containers.
- **Don't** use decorative abstract geometric grid backgrounds unless they serve as a blueprint canvas.
