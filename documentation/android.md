# 📱 TruckTracker — Android Application Guide

## 1. Overview & Technology Stack

The TruckTracker Android application is a native client designed exclusively for company logistics drivers operating in the field.

| Component | Library / API | Rationale |
|---|---|---|
| **Language & Tooling** | Kotlin 2.0, Android SDK 34, AGP 8.5.2 | Modern concise Android development, SDK 34 compliance |
| **UI Framework** | Jetpack Compose & Material 3 | Declarative, reactive UI, no XML fragments, zero lag |
| **Local Persistence** | Android Room Database (SQLite) | Persistent offline queue storage for uninterrupted field operation |
| **Secure Storage** | EncryptedSharedPreferences (AES256) | Hardware Keystore-backed storage for JWT tokens and driver profiles |
| **Networking** | Retrofit 2.11 + OkHttp 4.12 | Typed REST client with dynamic server URL switching and retry policies |
| **Hardware Camera** | CameraX 1.3.4 (Lifecycle, View, Camera2) | Native viewfinder, aspect-ratio locked photo capture, JPEG compression |
| **Location Services** | Google Play Services Fused Location | High-accuracy GPS fixes, accuracy variance checks, Haversine geofence |
| **Network Monitoring** | Android `ConnectivityManager` | Reactive connection state flow, automatic offline queue draining |

---

## 2. Android Layered Architecture

```mermaid
graph TD
    subgraph UI["Jetpack Compose UI Layer (20 Operational Screens)"]
        Screens["Screens.kt<br/>(Login, Home, Active Route, Stop Action, Delay, Camera, Review)"]
        Theme["Theme & Design System<br/>(CharcoalBg #0E1013, SlateCard #242A35, Gold #C5A059)"]
        Components["Components.kt<br/>(PrimaryActionButton, StatusBadge, OfflineQueueBanner)"]
    end

    subgraph Domain["Repository & Synchronization Layer"]
        DriverRepo["DriverRepository.kt<br/>(Authentication, Active Trip, Event Dispatch, Local Caching)"]
        SyncManager["SyncManager.kt<br/>(Queue Drainer, Mutex Lock, Idempotency Handler)"]
        NetMonitor["NetworkMonitor.kt<br/>(ConnectivityManager Flow)"]
    end

    subgraph Data["Persistence & Networking Layer"]
        RoomDB[("Room Database<br/>(offline_events table)")]
        EncryptedPrefs["EncryptedSharedPreferences<br/>(JWT Token & Base URL)"]
        RetrofitClient["Retrofit API Client<br/>(TruckTrackerApiService)"]
    end

    subgraph Hardware["Device Hardware Services"]
        CameraMgr["CameraManager.kt<br/>(CameraX ImageCapture)"]
        LocationSvc["LocationService.kt<br/>(FusedLocationProviderClient & LocationUtils)"]
    end

    Screens --> DriverRepo
    Screens --> CameraMgr
    Screens --> LocationSvc
    Screens --> Theme
    Screens --> Components

    DriverRepo --> RoomDB
    DriverRepo --> EncryptedPrefs
    DriverRepo --> RetrofitClient
    DriverRepo --> NetMonitor

    SyncManager --> RoomDB
    SyncManager --> RetrofitClient
    SyncManager --> NetMonitor
```

---

## 3. Driver Stop Execution State Machine

```mermaid
stateDiagram-v2
    [*] --> Dispatched : Manager Dispatches Multi-Stop Route
    Dispatched --> EnRouteToStop : Driver Taps "START TRIP"
    
    state "Stop Lifecycle (Repeated for Stops 1..N)" as StopFlow {
        EnRouteToStop --> GeofenceCheck : Approaching Destination
        GeofenceCheck --> OutsideWarning : Distance > 250m
        OutsideWarning --> GeofenceCheck : Move closer
        GeofenceCheck --> ArrivedAtStop : Distance <= 250m
        
        ArrivedAtStop --> ActivityPending : Taps "ARRIVE AT STOP"
        
        state "Delay Handling" as DelayBranch {
            ActivityPending --> DelayReported : Traffic / Breakdown Occurred
            DelayReported --> DelayResolved : Driver Taps "RESOLVE DELAY"
            DelayResolved --> ActivityPending
        }
        
        state "Cargo Proof" as ProofBranch {
            ActivityPending --> CameraCapture : Photo Required (photo_required == 1)
            CameraCapture --> PhotoPreview : Capture Proof Photo
            PhotoPreview --> CameraCapture : Retake
            PhotoPreview --> ActivityCompleted : Photo Confirmed & Attached
        }

        ActivityPending --> ActivityCompleted : Optional Photo (photo_required == 0)
        ActivityCompleted --> DepartedStop : Driver Taps "DEPART STOP"
    }

    DepartedStop --> EnRouteToStop : More Destination Stops Remaining
    DepartedStop --> ReturningToBase : Final Destination Stop Departed
    
    ReturningToBase --> ArrivedAtBase : Driver Taps "ARRIVE AT BASE"
    ArrivedAtBase --> Completed : Driver Taps "COMPLETE TRIP"
    Completed --> [*]
```

---

## 4. Geofence & GPS Verification Flow

```mermaid
flowchart TD
    Start([Driver Taps 'ARRIVE AT STOP']) --> GetLoc[Request FusedLocation PRIORITY_HIGH_ACCURACY]
    GetLoc --> CheckGPS{GPS Available & Enabled?}
    
    CheckGPS -- No --> ErrGPS[Record 'GPS UNAVAILABLE' with NULL coordinates<br/>Display warning to driver]
    CheckGPS -- Yes --> ReadCoord[Obtain Current Lat, Lng, and Accuracy]
    
    ReadCoord --> CheckAcc{Accuracy > 300m?}
    CheckAcc -- Yes --> FlagPoor[Flag isAccuracyPoor = true<br/>Log accuracy variance faithfully]
    CheckAcc -- No --> GoodAcc[Accuracy Verified Valid]
    
    FlagPoor --> CalcDist[Calculate Haversine Distance to Destination]
    GoodAcc --> CalcDist
    
    CalcDist --> CheckRadius{Distance <= Destination Geofence Radius?}
    CheckRadius -- No --> RejectArrival[Reject Arrival or Show Warning Banner<br/>'Outside Destination Area - Distance: X meters']
    CheckRadius -- Yes --> AllowArrival[Verify Geofence Check = PASSED<br/>Transmit STOP_ARRIVE event to Backend]
    
    AllowArrival --> ServerCheck[Backend Authoritative Validation]
    ServerCheck --> UpdateDB[(Update trip_stops status = 'ARRIVED'<br/>Record actual_arrival_time)]
```

---

## 5. The 20 Driver Screens & States

1. **Splash Screen & Session Loader**: Checks local `EncryptedSharedPreferences` for cached JWT token. Automatically routes to Home if active, or Login if expired.
2. **Login Screen & Server Config**: Sign in via email and password. Includes an on-device server configuration panel allowing drivers and technicians to switch between LAN, Emulator, and Production HTTPS.
3. **Driver Home Screen**: Displays active vehicle registration plate, today's route progress summary ("2 of 4 stops completed"), and next action button.
4. **Today's Trips Screen**: Lists all scheduled and dispatched routes assigned to the driver.
5. **Trip Details Screen**: Overview of the full ordered multi-stop sequence (`BASE → STOP 1 → STOP 2 → ... → BASE`).
6. **Stop Details Screen**: Customer address, contact person, delivery instructions, cargo quantity, and required proof indicator.
7. **Arrival & Geofence Screen**: Live location check against destination coordinates. Displays distance and arrival verification status.
8. **Activity Execution Screen**: Cargo signoff, quantity confirmation, and photo proof verification.
9. **Camera Screen**: Full-screen CameraX viewfinder with touch-to-capture and orientation lock.
10. **Photo Review Screen**: Preview captured proof photo, select category (*Delivery Proof*, *Damage*, *Signature*), and confirm.
11. **Delay Report Screen**: Select standard delay reason (*Traffic Congestion*, *Mechanical Breakdown*, *Adverse Weather*, *Customer Unavailable*, *Accident*) with optional notes.
12. **Active Delay Banner**: Persistent warning banner displaying elapsed delay timer and a high-visibility "Resolve Delay" action.
13. **Return Journey Screen**: Trigger return journey departure once the final destination stop is completed.
14. **Base Arrival Screen**: Record arrival back at the company headquarters/depot gate.
15. **Trip Completion Summary**: Operational summary showing stops completed, total travel duration, delay minutes, and attached photos.
16. **Trip History Screen**: Chronological archive of past completed routes.
17. **Driver Profile Screen**: Displays driver name, employee ID, assigned truck, and sign-out action.
18. **Offline Queue Screen**: Real-time counter of queued offline events with manual synchronization button.
19. **Error / GPS Unavailable Screen**: Clean recoverable error states with retry controls; coordinates are never fabricated.
20. **Runtime Permissions Handler**: Android runtime permission prompts for Fine Location, Coarse Location, and Camera.

---

## 6. Offline Queue & Idempotency Guarantees

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver
    participant App as Android UI
    participant Room as Room SQLite DB
    participant Net as Network Monitor
    participant API as Server API

    Driver->>App: Executes Action (e.g. Arrive, Complete, Depart)
    App->>Net: Check connectivity status
    alt Device is Offline
        Net-->>App: Offline
        App->>Room: INSERT INTO offline_events (UUID, payload, timestamp, PENDING)
        App-->>Driver: Display "Saved — 1 event(s) waiting for network"
    else Device is Online
        Net-->>App: Online
        App->>API: POST /api/trips/:id/events (with idempotency_key)
        API-->>App: 200 OK
        App-->>Driver: Action Confirmed
    end

    Note over Net,API: Network Restored Later
    Net->>App: onAvailable() Triggered
    App->>Room: Query all PENDING events ordered by timestamp
    loop Drain Each Event Sequentially
        App->>API: POST /api/trips/:id/events (Payload + idempotency_key)
        API->>API: Deduplication check on idempotency_key
        API-->>App: 200 OK
        App->>Room: DELETE FROM offline_events WHERE id = :id
    end
    App-->>Driver: Offline banner clears (0 pending events)
```

---

## 7. In-Cab Digital Vehicle Papers & Automated CI/CD

### A. Digital Vehicle Papers Access
Field drivers can view verified digital copies of their vehicle's statutory papers (Registration Certificate, Commercial Insurance, Road Fitness, PUC, and National Permit) directly from the mobile app. This allows drivers to immediately present verified credentials during police and RTO roadside checks.

### B. Automated GitHub Actions Build & In-App Sync
- `.github/workflows/deploy.yml` compiles `TruckTracker-Driver-v1.1.0-debug.apk` on every push to `main`.
- The backend serves `GET /api/app-version` containing current release metadata and download URLs.
- The mobile application checks this endpoint to alert drivers when a new release is available.

