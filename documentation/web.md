# 🖥️ TruckTracker — Web Manager Application Guide

## 1. Overview & Technology Stack

The Web application is the primary operations and dispatch command center for company managers, dispatchers, and fleet administrators.

| Component | Technology |
|---|---|
| **Framework** | React 19 + TypeScript 5.7 |
| **Build Tool** | Vite 6.1 (ESM, Fast HMR) |
| **Styling** | Custom Pure Vanilla CSS (Luxury Corporate Dark Design System) |
| **Interactive Mapping** | Leaflet.js 1.9 + OpenStreetMap CartoDB Dark |
| **Icons** | Lucide React |

---

## 2. Managerial Workflow & Navigation

Primary Navigation:
- **Dashboard**: High-level operational KPIs, active route cards, and Attention Required alerts.
- **Trips**: Complete list of planned, in-progress, delayed, and completed trips with filtering.
- **Active Trips**: Filtered real-time operational view of vehicles currently on the road.
- **Drivers**: Fleet driver registry, assigned vehicles, and availability status.
- **Vehicles**: Fleet vehicle registry, maintenance flags, and odometer tracking.
- **Destinations**: Pre-configured customer warehouses, retail stores, and depot coordinates.
- **Reports**: Daily, weekly, and monthly operational summaries with CSV and Excel export.
- **Settings & ERP**: System administration, driver/manager user access control, and SAP ONE Portal integration gateway.
- **Audit**: Comprehensive historical audit log tracking state modifications, cancellations, and user actions.

---

## 3. Key Operational Capabilities

### A. Manager KPI Command Dashboard
- Live database-calculated metrics: Today's Trips, Vehicles On Road, Completed Routes, Delayed Trips, Fleet Availability.
- Active fleet table detailing Trip ID, Driver, Vehicle Plate, Current Destination, Remaining Stops, and Status.
- **Attention Required Badge**: Surfaces delayed trips, unstarted overdue trips, missing proof photos, failed activities, and vehicles in maintenance.

### B. Multi-Stop Trip Builder
- Supports 1, 2, 3, 5, or 10+ destination stops per trip (`Base Depot → Stop 1 → Stop 2 → ... → Base Depot`).
- Intuitive drag-and-drop or sequential reordering prior to dispatch.
- Adding or deleting destination stops automatically re-indexes stop numbers (`stop_number: 1, 2, 3...`) with audit log preservation.

### C. Interactive Route Map & Ola Maps Route Visualizer
- **OSRM Road-Snapped Routing (`services/routing.ts`)**: Replaces simple straight lines with real-world Indian road network geometry fetched from Open Source Routing Machine with in-memory caching and haversine fallbacks.
- **Dual-Layer Neon Glow Corridor**: High-visibility polyline combining an outer 9px emerald glow (`#00d084`) and an inner 4.5px cyan highway core (`#0284c7`).
- **Floating Ola Maps Glassmorphism HUD**: Shows real road driving distance (km), estimated drive time (mins), and road-snapped corridor verification.
- **Interactive Drive Simulator**: Real-time cab simulation along the road polyline featuring:
  - Custom 3D cab marker with pulsing locator aura.
  - Realistic live speedometer gauge (`42 - 58 km/h`).
  - Interactive scrubbable progress bar (0–100%).
  - Playback speed multipliers (`1x`, `2x`, `4x`).
  - "Follow Cab" active camera centering toggle.
- **Turn-by-Turn Waypoints Drawer**: Collapsible sidebar listing destination stops with customer names, delivery counts, and one-click Google Maps navigation external links.
- **Multi-Theme Basemaps**: Instant toggle between **Ola Dark** (high-contrast night logistics), **Day Navigation** (clean street map), and **Satellite Hybrid** (aerial imagery).
- **Geofence Verification Circles**: Visual representation of destination arrival geofences (100–250m radius).

### D. Operational Reports & Exports
- Real-time aggregations calculated from the configured PostgreSQL or Microsoft SQL Server database:
  - Total trips, completed trips, delayed trips, cancelled trips.
  - Total delay duration (minutes) and average delay duration.
  - Average trip duration and on-time arrival percentage.
  - Vehicle fleet utilization and driver trip distribution.
  - Delay reason breakdowns (Traffic, Breakdown, Weather, Customer Unavailable, etc.).
- Instant one-click export to CSV.

### E. 100% Production Data Fidelity (Zero Mock Data)
- **Elimination of Mock Data**: The legacy `mockData.ts` and `mockStore` layers have been completely removed.
- All trips, vehicles, drivers, documents, and challans reflect the authoritative configured SQL database state.
- If no trips are assigned, the UI renders authentic empty states rather than fictitious fallback demo trucks.
- Offline resilience is handled purely via `offlineQueue.ts` (localStorage queue that replays idempotent transactions once reconnected).
