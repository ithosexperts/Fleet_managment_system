# Standard Operating Procedure: Dispatch Operations

## 1. Dispatch Workflow Overview
The dispatch workflow tracks delivery manifests from initial planning to completion and post-route audit.

```
[1. Manifest Creation] ──> [2. Driver Notification] ──> [3. Route Departure]
                                                               │
                                                               ▼
[6. Post-Route Audit]  <── [5. Base Return Sign-Off] <── [4. Stop Executions]
                                                            (POD & Geofences)
```

---

## 2. Dispatch Creation Guidelines
1. **Manifest Initiation**:
   - Access **Dispatch Command** in Manager view.
   - Click **Create Dispatch Manifest**.
2. **Vehicle & Driver Selection**:
   - Only vehicles with status `AVAILABLE` should be selected for new dispatches.
   - Active driver must hold verified licenses and compliance files.
3. **Stop Sequencing**:
   - Add delivery stops in geographic sequence to minimize deadhead mileage.
   - Specify planned arrival times within SLA windows.

---

## 3. Driver Execution Workflow
1. **Departure Confirmation**:
   - Driver reviews assigned manifest on mobile terminal.
   - Driver clicks **Start Trip**, submitting odometer reading and departure location.
2. **Geofence Checkpoint**:
   - Upon approaching within the geofence perimeter (default 150m), the app triggers automatic arrival confirmation.
   - Driver records proof-of-delivery photos and recipient signature.
3. **Delay Reporting**:
   - If congestion or dock queues exceed 15 minutes, driver submits a delay report specifying root cause.

---

## 4. Delivery Deletion Safeguards & Audit Integrity
To prevent accidental data loss and protect financial audit trails:
- **Irreversible Deletion Safeguard**: Any delivery or consignment that is `IN_PROGRESS`, `DELAYED`, or `COMPLETED` cannot be deleted from the system.
- **Safe Edit Mode**: Dispatchers can edit trip notes, destination addresses, contact numbers, or cargo details via the **Edit Delivery** action, but the core execution history remains permanently locked.
- **Unassigned/Draft Orders**: Only unassigned orders in `PLANNED` or `DRAFT` status that have not been dispatched can be removed.

---

## 5. Multi-Select Schedule Filtering
The Schedule Board includes advanced multi-variable filtering:
- **Checkbox Dropdowns**: Filter concurrently across multiple trip statuses (`PLANNED`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`), multiple drivers, and vehicle types.
- **Selection Count Badges**: Pill badges display the number of active filters with 1-click clear-all capability.
- **Smart Edge Detection**: Dropdowns automatically flip leftward near browser or viewport borders to prevent menu clipping.

