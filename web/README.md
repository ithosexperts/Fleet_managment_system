# 🖥️ TruckTracker Web Manager Application

> **Professional Logistics Command Center for Operations Managers, Dispatchers, and Fleet Admins.**

Built with **React 19 + TypeScript + Vite + Leaflet.js + Pure Vanilla CSS Design System**.

---

## 🏗️ Architecture & Features

The Web application is the primary desktop and tablet interface for company dispatch managers:

1. **Manager KPI Command Dashboard**:
   - Live metrics: Today's Trips, Active/In-Transit Vehicles, Completed Trips, Delayed Trips, Available Fleet.
   - Active fleet table with current destination, progress, status badges, and last known location.
   - Attention Required section: Delayed trips, unstarted overdue trips, missing photos, failed activities, and fleet maintenance alerts.

2. **Multi-Stop Trip Builder**:
   - Visual route builder supporting 1, 2, 3, 5, or 10+ destination stops (`Base → Stop 1 → Stop 2 → ... → Base`).
   - Add, edit, remove, and reorder destination stops prior to trip dispatch.
   - Planned arrival times and operational instructions.

3. **Interactive Route Map (Leaflet.js)**:
   - Visual map with base depot marker, numbered stop pins, geofence radius circles (100–250m), breadcrumb GPS events, and vehicle route line.

4. **Trip Inspection & Audit Center**:
   - Complete chronological event timeline (Trip Start, Arrivals, Deliveries, Departures, Delays, Return, Base Arrival, Completion).
   - Proof photos gallery with category tags, server timestamps, and GPS metadata.
   - Audit history log preserving original vs edited values, user IDs, timestamps, and reason.

5. **Operational Reports & Exports**:
   - Daily, Weekly, and Monthly operational summaries.
   - Total trips, delay durations, average trip duration, on-time arrival %, vehicle utilization.
   - One-click CSV and Excel export.

6. **SAP ONE Portal / Enterprise ERP Integration**:
   - Direct integration mapping for central operational records (*Trips, Stops, Proof of Delivery, Events, Delays*).
   - Enterprise cost center and shipment tracking linkage.

---

## ⚡ Quick Start

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
Manager Credentials: `manager@company.com` / `manager123`
