WORKSTATION B — FRONTEND OWNER

Your scope is everything under /frontend in the repository. You own:

1. PROJECT SETUP
   - Next.js 14 with App Router and TypeScript
   - Tailwind CSS configured with custom theme
   - ESLint + Prettier
   - TanStack Query for server state
   - Zustand for client state (selected hour, active scenario)

   Color palette:
   - Background: #0b1120 (slate-950)
   - Surfaces: #111827 (slate-900)
   - Surface elevated: #1a2540 (slate-800)
   - Borders: #1f2d45
   - Primary: #38bdf8 (cyan-400) — active states, key metrics
   - Success: #34d399 (emerald-400) — safe, optimal
   - Warning: #fbbf24 (amber-400) — approaching limit
   - Danger: #fb7185 (rose-400) — constraint violation
   - Purple: #c084fc — hydrogen channel
   - Text primary: #e2e8f0 (slate-200)
   - Text secondary / muted: #64748b (slate-500)

   Typography:
   - Inter — all UI text, labels, buttons
   - JetBrains Mono — all numbers, values, units, timestamps

   Design principles (applied from demo review):
   - NO decorative effects: no scan-lines, no glow/text-shadow, no backdrop glows
   - NO display/sci-fi fonts (Orbitron, Rajdhani, etc.)
   - Color carries semantic meaning only (green = safe, amber = warn, red = crit)
   - Uppercase only for short category labels (10px, font-weight 600, letter-spacing 0.08em)
   - City/place names in normal case
   - Animations limited to: flow lines on map, alert blink. Nothing else animates unless
     the user triggered it (panel slide-in, bar chart on scenario switch).
   - Use the existing demo.html (frontend/demo.html) as the visual reference —
     it shows the correct level of restraint.

2. API CLIENT (lib/api/)
   File: frontend/lib/api/client.ts

   Build a typed API client from shared/api-contract.yaml. Use openapi-typescript
   to auto-generate TypeScript types from the OpenAPI spec.

   The client should:
   - Auto-retry on network errors (3 attempts, exponential backoff)
   - Show loading states for slow requests (>500ms)
   - Cache GET requests via TanStack Query
   - Have a base URL configurable via env var (NEXT_PUBLIC_API_URL)
   - Default to http://localhost:8000 in development
   - Have a "mock mode" flag that hits /api/mock endpoints instead of real ones
     (this lets you develop the full UI before backend is ready)

3. MAIN DASHBOARD PAGE (app/page.tsx)

   Single-page layout, designed for 1920×1080 displays but responsive down
   to 1280×720. Grid: 4 rows — topbar (48px) / main row (flex) / forecast strip (160px) / constraint panel (104px).

   a) TOP STATUS BAR (header)
      - Plant name "Paks NPP" + subtitle "Thermal Optimizer" in Inter
      - Reactor status: 6 dots (4 for Paks I, 2 for Paks II), colored by state
        ok=emerald, warn=amber, off=#2d3748
      - Alert count badge (rose, with blinking dot)
      - Scenario switcher: three buttons "☀ Summer afternoon" / "❄ Winter morning" / "⚠ Heatwave crisis"
        active button: background surface-elevated, cyan text, subtle cyan border
      - Clock in JetBrains Mono, right-aligned, "HH:MM:SS CET"

   b) MAP VIEW (left column, 38% width)
      - MapLibre GL map centered on Hungary, dark basemap
      - Markers for: Paks NPP (cyan), Budapest (purple), Dunaújváros (cyan), Szekszárd (emerald)
      - Animated flow lines from Paks to each city, stroke-width proportional to heat MW
        (stroke-dasharray animated, not glow)
      - Danube river highlighted in #0e4f6b, color shifts toward rose as temperature approaches 30°C
      - Click on a city → updates city detail card (top-right of map panel)
      - City card: name, heat delivered, distance, pipeline loss %, demand coverage %
      - Bottom strip: Danube temp progress bar (blue→amber gradient), current value vs 30°C limit

   c) ALLOCATION TIMELINE (center column, 37% width)
      - 48-hour stacked bar chart
      - Each hour = one bar, gap 1.5px between bars
      - Bar segments bottom-to-top: electricity (cyan), heat (emerald), hydrogen (purple), Danube cooling (#2d3f5a)
      - Current hour: 1.5px cyan outline, no other highlight
      - Hover: tooltip (surface-elevated, 1px border) showing MW per channel in JetBrains Mono
      - Click: slides in Explanation Panel, outlines selected bar
      - X-axis: 00:00 / 06:00 / 12:00 / 18:00 / +24h / 06:00 / 12:00 / 18:00 / +48h
      - Legend below: colored 8px squares + "Electricity / Heat / Hydrogen / Danube cooling"

   d) LIVE METRICS PANEL (right column, 25% width)
      - Revenue rate: large JetBrains Mono number in cyan, "€/hr" label in muted
      - Delta vs baseline: green (▲ +X%) or red (▼ −X%)
      - Thermal efficiency: label + percentage + 4px progress bar in emerald
      - 2×2 stat grid: Today's revenue / H₂ produced / Heat delivered / Electricity out
      - Active constraints summary: 3 rows with colored dot, name, margin value

   e) FORECAST STRIP (full width, 160px)
      Three side-by-side area charts, each with:
      - Header: label (10px uppercase) + current value (JetBrains Mono, colored by status)
      - SVG area chart: gradient fill (color → transparent), 1.5px polyline
      - Vertical marker at "now" (hour 24 of 48)
      - Horizontal dashed rose line for hard limits (30°C on Danube, 0 on price)
      Charts: "Electricity price forecast" / "Danube temperature" / "Heat demand"

   f) CONSTRAINT PANEL (full width, 104px)
      - Header row: "Safety constraints" label
      - 6-column grid of constraint cells, each:
        name (9px uppercase muted), current value (15px JetBrains Mono, colored by status),
        limit (9px muted), 3px progress bar, status dot (top-right corner)
      - Status colors: emerald=ok, amber=warn, rose=crit (crit dot blinks)

4. EXPLANATION PANEL COMPONENT
   File: frontend/components/ExplanationPanel.tsx

   Slides in from right (320px wide) when user clicks a timeline bar.
   Transition: transform translateX, 220ms ease.

   Content:
   - Header: "HH:00 – HH+1:00" in cyan JetBrains Mono + subtitle (e.g. "H₂ at max · Danube 0.3°C below limit")
   - Optimization gain: savings box with emerald border/background tint, "+€XX,XXX" large, subtitle "vs full electricity output"
   - Hour allocation: horizontal bar chart (4 rows: Electricity/Heat/Hydrogen/Danube), MW values right-aligned
   - Binding constraints: rose-tinted rows showing name and current/limit values
   - Marginal revenue: same horizontal bar layout, values in €/MWh (red if negative)

   No LLM output. All text is composed from structured data fields.

5. SCENARIO COMPARISON UI
   File: frontend/app/scenario/page.tsx

   Operator can override inputs and see how the plan changes:
   - Sliders for: price multiplier, Danube limit, demand multiplier
   - Reactor on/off toggles
   - "Recompute" button → calls POST /api/scenario
   - Side-by-side comparison: baseline plan vs scenario plan (two timeline charts)
   - Revenue delta prominently displayed in large JetBrains Mono

6. THREE DEMO SCENARIO PRESETS

   Scenario switcher in the top bar with three buttons:
   - "Summer afternoon" — negative electricity prices (−18 €/MWh), 26°C Danube,
     optimizer shifts output to hydrogen + heat
   - "Winter morning" — peak demand, 4°C Danube, max electricity + heat, high revenue
   - "Heatwave crisis" — Danube at 29.4°C (approaching 30°C limit), reduced thermal output,
     optimizer redirects to hydrogen

   Each scenario loads predefined inputs from /api/mock/scenario/{name}
   and updates: timeline bars, metrics panel, constraint states, forecast charts, Danube strip.

7. DATA VISUALIZATION GUIDELINES

   - All numbers have units (MW, €, °C, t, m³/h, Hz)
   - Use Intl.NumberFormat for thousands separators
   - All charts in dark mode only (no light theme needed)
   - Animations: panel slide-in 220ms ease, bar transition on scenario change 300ms ease.
     Nothing else animates continuously except flow lines and alert blink.
   - Loading states: skeleton screens (surface-elevated rectangles), never spinners
   - Empty states: short muted label, not blank space
   - Error states: clear message + "Retry" button

8. VISUAL REFERENCE

   frontend/demo.html is a working single-file prototype of the full dashboard.
   It demonstrates the correct aesthetic, layout proportions, component behavior,
   and interaction patterns. Use it as the ground truth for visual decisions.
   When in doubt about spacing, font sizes, or color usage — match the demo.

9. DEPLOYMENT
   - Deploy to Vercel
   - Set NEXT_PUBLIC_API_URL to the Railway backend URL
   - Test the live deployment 6+ hours before demo

ACCEPTANCE CRITERIA:
- Dashboard renders correctly on 1920×1080 and 1366×768
- All three demo scenarios load and display correct data
- Map shows correct geography with all 4 markers
- Timeline chart smoothly handles 48 bars × 4 segments
- Explanation panel opens within 200ms of clicking an hour
- No console errors in production build
- Lighthouse performance score >85
- Live demo URL deployed at least 6 hours before pitch

COMMIT MESSAGE FORMAT:
feat(dashboard): add allocation timeline chart
feat(map): wire up city markers with click handlers
fix(api-client): handle network timeout
style(forecast-strip): improve chart aesthetics

WHEN BLOCKED:
- Backend not ready? Use mock mode (NEXT_PUBLIC_USE_MOCK=true). Mock
  endpoints return realistic data for all three scenarios.
- API contract unclear? Read shared/api-contract.yaml. If still unclear,
  ask in the shared notes file before changing assumptions.
- Need a new endpoint? Open an issue and propose it in shared/notes.md.
  Don't add backend code yourself.

HOUR-BY-HOUR PLAN:
H0-3:   Repo setup, Next.js + Tailwind + theme, layout shell, top bar
H3-8:   API client setup, mock mode working with hardcoded JSON
        (do not wait for backend)
H8-14:  Map view with markers and flow lines, Recharts timeline chart
        with mock data
H14-20: Live metrics panel, forecast strip with three charts
H20-26: Explanation panel, hour-click interaction, slide-in animation
H26-32: Scenario page with override sliders, comparison view
H32-38: Constraint panel, polish interactions, fix responsive issues
H38-44: Switch from mock mode to real backend, fix integration issues
H44-48: Visual polish, deploy to Vercel, demo rehearsal support
