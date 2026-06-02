# UI Design Guidelines

This file documents the established design language for the LLM Dashboard client. It exists to keep the UI consistent, not to constrain it — when the design needs to evolve, update this file.

## Aesthetic Direction: Mission Control Dark

A deliberately dark, dense, developer-focused interface modeled on a satellite operations console. Not a marketing surface, not a chat app — a **workbench for inspecting LLM behavior**.

Principles:

- **Dark by default.** The root `<html>` carries `class="dark"`. Light mode is not a target state.
- **Density over whitespace.** Panels sit shoulder-to-shoulder at a fixed 1232px container. There is room to breathe, not room to waste.
- **Color carries meaning, not decoration.** Indigo = active/action. Green = success/healthy. Red = destructive. The rest is mid-tone navy.
- **Atmosphere through low-opacity layers.** Almost no element uses a solid color fill; backgrounds are 5–20% alpha overlays. This is what makes the panels feel like glass on a dark surface rather than cardboard boxes.
- **No drop shadows, no glow.** Elevation is communicated by border opacity and stacking, not by `box-shadow`. The one allowed glow is the subtle `--color-space-accent-glow` for active states.
- **Function-shaped, not brand-shaped.** The product is the models and their output. UI chrome should recede.

## Color System

Two layered systems live in [styles/globals.css](styles/globals.css). **Use the Deep Space tokens for product UI**; the shadcn-style variables are kept for primitives and may be migrated later.

### Deep Space palette (authoritative for product UI)

| Token                       | Value                       | Use                                 |
| --------------------------- | --------------------------- | ----------------------------------- |
| `--color-space-background`  | `#0a0a1a`                   | Page background, gradient anchor    |
| `--color-space-sidebar`     | `#16213e`                   | Left rail, navigation shell         |
| `--color-space-panel`       | `#16213e`                   | Content panels (matches sidebar)    |
| `--color-space-input-bg`    | `#1a1a2e`                   | Text inputs, form fields            |
| `--color-space-accent`      | `#6061f5`                   | Primary action, active state, focus |
| `--color-space-accent-glow` | `rgba(96, 97, 245, 0.3)`    | Active ring, hover halo             |
| `--color-space-text`        | `#e0e0e0`                   | Body copy                           |
| `--color-space-muted`       | `#6b7280`                   | Secondary copy, meta                |
| `--color-space-border`      | `rgba(255, 255, 255, 0.03)` | Default dividers                    |

### Status colors (ad-hoc, not in CSS vars yet)

These are repeated in inline styles across modules. Promote them to CSS variables when adding a third use site:

| Role             | Background                  | Text      |
| ---------------- | --------------------------- | --------- |
| Active / success | `rgba(34, 197, 94, 0.2)`    | `#22c55e` |
| Indigo / brand   | `rgba(132, 99, 255, 0.2)`   | `#8463ff` |
| Neutral chip     | `rgba(148, 163, 184, 0.1)`  | `#94a3b8` |
| Destructive      | `bg-red-500/600` (Tailwind) | white     |

### Border colors used inline (not in vars)

- `#1f2033` — chat panel borders (slightly warmer than space-border)
- `#1e293a` — settings panel borders
- `#1f2738` — header nav pill background
- `#242a41` — chat sidebar border
- `#0f1219` — header nav inner background

When a border color is used in three or more places, lift it into `--color-space-border-*` and consume it via `style={{ borderColor: 'var(--color-space-border-panel)' }}`.

## Backgrounds

The page is not a flat color. The chat module uses:

```css
background: linear-gradient(180deg, #0a0a1a 0%, #12101f 100%);
```

The dashboard uses the page background default. **Reuse the vertical gradient on full-bleed dark surfaces** (modals, drawers, the chat viewport). Flat color is fine for inset panels (`#10162f`).

## Typography

**Current state:** the app loads no custom font — it falls through to the system UI stack. This works for body text but is bland for a product that wants to feel "designed."

**Recommended adoption** (to be wired via `<link>` in [src/index.html](src/index.html) and `font-*` tokens in `globals.css`):

- **Display / brand:** [Sora](https://fonts.google.com/specimen/Sora) — geometric, slightly futuristic, good for the "EVALUATION ENGINE" wordmark in the header.
- **Body / UI:** [Geist](https://vercel.com/font) — modern, technical, broad weight range.
- **Mono (code, reasoning, model ids):** [JetBrains Mono](https://www.jetbrains.com/lp/mono/) — industry standard for dev tools, and `MessageBubble` / `ReasonBlock` already ask for `font-mono` semantics.

Sizes in use:

| Use               | Class                     | Pixels |
| ----------------- | ------------------------- | ------ |
| Page title (rare) | `text-2xl font-bold`      | 24     |
| Panel header      | `text-base font-semibold` | 16     |
| Card title        | `text-lg font-semibold`   | 18     |
| Body              | `text-sm`                 | 14     |
| Meta / micro      | `text-xs`                 | 12     |
| Reasoning / code  | `font-mono text-xs`       | 12     |

Tracking: headers use `tracking-wide` or `tracking-tight` deliberately. Body uses default tracking.

## Spacing & Layout

- **Container:** `max-w-[1232px] mx-auto` is the established content width. Keep new pages inside it.
- **Panel split:** `818px` left + `flex-1` right is the settings/chat template. Reuse it for two-pane layouts.
- **Page padding:** `p-5` or `p-6` on the outer container. `p-2.5` on tight rows.
- **Vertical rhythm in lists:** `space-y-3` for cards, `space-y-4` for major sections, `space-y-2` for compact lists.
- **Gaps between siblings:** `gap-2`, `gap-3`, `gap-5` — the three allowed values. `gap-4` is fine for grids.

## Components

### Buttons

Use the shadcn `<Button>` primitive from [src/components/ui/button.tsx](src/components/ui/button.tsx) with `variant` and `size`. **Do not invent new button styles inline.** When you need a non-standard button (e.g. the chat input's circular send/stop), use raw classes — but keep the same paddings (`p-2`), radius (`rounded-lg`), and color logic (indigo active, red destructive, muted when disabled).

### Cards & Panels

Two patterns coexist:

1. **shadcn `Card`** — for the dashboard (light surface, default tokens). Use when the panel is on the light/standard surface.
2. **Deep Space panel** — `rounded-xl border border-[#1f2033]` + `style={{ backgroundColor: '#10162f' }}`. Use for settings, chat, and any product feature. This is the dominant panel in the app.

When starting a new module, default to the Deep Space panel unless the surface is explicitly a "tool surface" like the dashboard's debug view.

### Inputs

`<Input>` from [src/components/ui/input.tsx](src/components/ui/input.tsx) is the shadcn primitive. For multiline chat input, build a custom `textarea` container — see [src/modules/ai-chat/components/ChatInput.tsx](src/modules/ai-chat/components/ChatInput.tsx) for the reference implementation. Container: `bg-space-input-bg border border-space-border rounded-lg`.

### Selects

`<Select>` from [src/components/ui/select.tsx](src/components/ui/select.tsx) for dropdowns. The dashboard's model picker uses a raw `<select>` because it doesn't need Radix's portal/a11y machinery — that's an acceptable shortcut for the test panel, not for product UI.

### Toasts

Use `emitToast` from [src/components/ui/toaster.tsx](src/components/ui/toaster.tsx) outside of React components (e.g. in axios interceptors, mutation callbacks). Use `useToast().addToast` inside components. Variants: `default | success | error | info`.

### Icons

[Lucide React](https://lucide.dev/) exclusively. Stroke icons only, default size `w-4 h-4` for inline UI, `w-5 h-5` for header icons, `w-3 h-3` for status indicators.

## Borders & Elevation

- **Default border:** `border` (1px) in `--color-space-border` color family. Never thicker.
- **Active/selected ring:** `ring-1 ring-purple-500/50` or `border-indigo-500/30` + matching background `bg-indigo-500/20`.
- **No `shadow-*` classes** in product UI. The only allowed shadow is on the shadcn `Card` primitive, and that primitive is used in light-surface contexts only.
- **No backdrop-blur** unless the layer is genuinely stacked over imagery. The dark theme is flat, not glassy.

## Motion

The motion language is **subtle pulse, not flourish**:

- `animate-pulse` on streaming dots (3 dots with `animation-delay-0/150/300`).
- `animate-spin` on `<Loader2>` for loading states.
- `transition-colors` on hover states.
- `animate-in` / `slide-in-from-top-full` on toast appearance (radix animation classes).
- Scroll-into-view (`behavior: 'smooth'`) for chat auto-scroll.

**Do not add:** parallax, scroll-triggered reveals, framer-motion flourishes, hover scale transforms, or any motion that takes longer than 200ms. This is a workbench, not a portfolio site.

## Patterns

### Inline `style` props vs Tailwind utilities

The codebase mixes both. Conventions:

- **Use Tailwind** for spacing, flex, grid, responsive, state variants, and standard utilities.
- **Use inline `style={{...}}`** for the Deep Space tokens that aren't yet in Tailwind (panel backgrounds, specific border colors, gradient backgrounds, fixed widths). This is the migration path — once a token is consumed in 3+ places, promote it to a CSS variable and (later) a Tailwind theme key.
- **Never inline a value that has a Tailwind equivalent** (e.g. don't write `style={{ padding: '20px' }}` when `p-5` works).

### Header navigation

Nav lives in [src/components/layout/header.tsx](src/components/layout/header.tsx) as a `navItems` array. To add a route:

1. Add the route in [src/routes/router.tsx](src/routes/router.tsx).
2. Add the nav item in `navItems` with `{ name, path, icon }`.

The nav pill's active state is driven by `data-[status=active]` from TanStack Router's `<Link>`.

## Anti-patterns

Things to **avoid** in this codebase:

- **Solid white/light surfaces** in product UI. The dashboard's light cards are an exception for the debug surface; everything else is dark.
- **Drop shadows on dark surfaces.** They produce muddy gray blobs on `#0a0a1a`.
- **Purple-to-blue gradients on white.** This is the AI-slop cliche. If you reach for `bg-gradient-to-r from-purple-500 to-blue-500`, stop.
- **Inter, Roboto, system-ui for headings.** The brand wordmark should be Sora (or another distinctive display face); body should be Geist once adopted.
- **Emoji as UI icons.** Use Lucide.
- **Animations longer than 200ms.** Stagger with `animation-delay` instead of duration.
- **Centered hero copy.** This is a workbench, not a landing page.
- **Modal-on-modal stacking.** Use the `useUiStore` `activeModal` slot if a second-level dialog is needed.
- **Hard-coded model names or LLM endpoints in components.** The dashboard page does this for the test harness — that's the only place it should appear.

## Quick reference: building a new page

```tsx
// 1. Outer container
<div className="flex h-full p-6 gap-5 max-w-[1232px] mx-auto">
  // 2. Deep Space panel
  <div
    className="h-full flex flex-col rounded-xl"
    style={{ backgroundColor: '#10162f', border: '1px solid #1e293a' }}
  >
    // 3. Panel header
    <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#1e293a' }}>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(132, 99, 255, 0.2)' }}
        >
          <Settings2 className="w-4 h-4" style={{ color: '#8463ff' }} />
        </div>
        <span className="text-white font-semibold text-base">Panel title</span>
      </div>
    </div>
    // 4. Content
    <div className="flex-1 p-5 overflow-auto space-y-4">{/* ... */}</div>
  </div>
</div>
```

That template is the established baseline. Imitate it; don't redesign it.
