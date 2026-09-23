# 📱 TruckTracker Android Driver Application

> **Native Android Application for Field Logistics Drivers and Vehicle Operations.**

Built with **Kotlin + Jetpack Compose + Android Architecture Components + Room + Retrofit + CameraX + Google Play Location Services**.

---

## 🏗️ Architecture Overview

The Android application connects directly to the shared TruckTracker Express backend via HTTPS/REST, acting as the primary field operational client for drivers.

```text
ANDROID DRIVER APP
│
├── UI Layer (Jetpack Compose)
│   └── 20 Functional Operational Screens & Dialogs
│
├── Domain / State Layer
│   ├── Trip State Machine
│   ├── Geofence Verification (100–250m Haversine)
│   └── CameraX Photo Proof Metadata Tagging
│
├── Local Persistence (Room Database & EncryptedSharedPreferences)
│   ├── Offline Event Queue (UUID Idempotency Keys)
│   ├── Offline Photo Queue
│   └── Secure JWT Token & Driver Session Storage
│
└── Network Layer (Retrofit + OkHttp)
    ├── ConnectivityManager Network State Monitor
    ├── AuthInterceptor (Bearer Token)
    └── Background-Safe SyncManager (Automatic Queue Drain)
```

---

## 📋 The 20 Driver Screens & Operational States

1. **Splash / Session Loader**: Validates stored JWT session and checks network connectivity.
2. **Login Screen**: Secure authentication against the shared backend (`/api/auth/login`).
3. **Driver Home**: Active vehicle display, progress summary ("2 of 4 stops completed"), next destination, and primary action.
4. **Today's Trips**: Dispatched route assignments for the driver.
5. **Trip Details**: Complete multi-stop trip overview (`Base → Stop 1 → Stop 2 → ... → Base`).
6. **Stop Details**: Specific customer contact, address, expected cargo, and planned arrival.
7. **Arrival & Geofence Verification**: Live FusedLocation check against the destination's 100–250m radius.
8. **Activity Completion Screen**: Cargo delivery/pickup signoff, quantity confirmation, and proof check.
9. **Camera Viewfinder**: CameraX hardware capture with viewfinder, flash, and orientation lock.
10. **Photo Review Screen**: Preview captured proof photo, select category (Delivery Proof, Damage, etc.), and confirm.
11. **Delay Report Dialog**: Reason selection (Traffic, Breakdown, Weather, Customer Unavailable, etc.) and notes.
12. **Active Delay Banner**: Persistent visual state with elapsed time and "Resolve Delay" action.
13. **Return Journey Screen**: Trigger departure from final stop back to company base.
14. **Base Arrival Screen**: Record arrival at company depot gate.
15. **Trip Completion Summary**: Statistical summary of stops visited, operational duration, and delays.
16. **Trip History**: Completed historical trips for the driver.
17. **Driver Profile**: Driver name, employee ID, assigned truck plate, and sign-out.
18. **Offline Queue Status**: Pending events counter with "Saved — waiting for network" and Force Sync button.
19. **Error / GPS Unavailable Screen**: Clean recoverable error states with retry controls; coordinates are never fabricated.
20. **Runtime Permission Requester**: Android runtime permission handler for Fine Location and Camera.

---

## ⚙️ Building & Running

### Prerequisites
- Android Studio Ladybug / Meerkat (or Android SDK 34)
- JDK 17
- Gradle 8.7+

### Build Debug APK
```bash
cd android
./gradlew assembleDebug
```
The resulting APK is generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Run on Connected Device / Emulator
```bash
./gradlew installDebug
```

### Backend Host Configuration
- **Android Emulator**: Uses `http://10.0.2.2:5000/` (pre-configured in `PreferenceManager.kt`).
- **Physical Device**: Connect to your office/development Wi-Fi network and update the backend IP in the app settings or via `PreferenceManager.saveBaseUrl("http://<YOUR_LOCAL_IP>:5000/")`.
