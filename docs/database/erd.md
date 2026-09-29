# Entity Relationship Diagram (ERD)

This diagram documents the complete relational data model of the TruckTracker database.

```mermaid
erDiagram
    users ||--o{ vehicles : "assigned driver"
    users ||--o{ drivers : "driver profile"
    users ||--o{ trips : "assigned driver"
    users ||--o{ trips : "created by"
    users ||--o{ delays : "reported by"
    users ||--o{ photos : "taken by"
    users ||--o{ trip_events : "logged by"
    users ||--o{ operational_exceptions : "assigned / acknowledged by"
    users ||--o{ audit_logs : "changed by"
    users ||--o{ fuel_transactions : "purchased by"

    vehicles ||--o{ trips : "dispatched vehicle"
    vehicles ||--o{ vehicle_documents : "compliance papers (RC, Insurance, Fitness, PUC)"
    vehicles ||--o{ maintenance_records : "service history & scheduled maintenance"
    vehicles ||--o{ fuel_transactions : "fuel transactions & efficiency logs"
    vehicles ||--o{ operational_exceptions : "affected vehicle"

    destinations ||--o{ trip_stops : "geofenced delivery location"

    trips ||--|{ trip_stops : "contains 1..N stops"
    trips ||--o{ delays : "trip route delays"
    trips ||--o{ photos : "trip proof photos"
    trips ||--o{ trip_events : "chronological event stream"
    trips ||--o{ operational_exceptions : "manifest exceptions"
    trips ||--o{ fuel_transactions : "trip refueling"

    trip_stops ||--o{ activities : "cargo operations (cartons, pallets)"
    trip_stops ||--o{ photos : "stop proof-of-delivery photos"
    trip_stops ||--o{ delays : "stop-specific delays"
    trip_stops ||--o{ trip_events : "stop arrival & departure events"
```

---

## Relationship Cardinality & Invariants

1. **`users` 1 → 0..1 `drivers`**:
   A driver user profile maps to exactly one extended driver record with unique employee payroll ID.
2. **`vehicles` 1 → 0..N `vehicle_documents`**:
   Each vehicle has multiple statutory compliance records (Registration Certificate, Commercial Insurance, RTO Fitness, and PUC) with tracked expiry dates.
3. **`vehicles` 1 → 0..N `maintenance_records`**:
   Complete chronological audit of preventive and corrective maintenance.
4. **`trips` 1 → 1..N `trip_stops`**:
   A trip manifest cannot exist without at least one scheduled stop. Deleting a trip cascades to all associated stops, activities, photos, and events.
5. **`destinations` 1 → 0..N `trip_stops`**:
   Destinations cannot be hard-deleted if referenced by active trips. Deactivation sets `is_active = 0` (soft delete) to protect historical manifest auditability.
