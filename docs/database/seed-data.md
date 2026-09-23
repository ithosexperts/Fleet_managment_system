# Database Seed Dataset Specification

## 1. Overview
The seed dataset located at [`server/src/seed.ts`](file:///u:/tracktracker/server/src/seed.ts) provisions a realistic commercial freight network across the Delhi-NCR distribution corridor.

---

## 2. Default Access Credentials

All seed accounts use standard bcrypt password hashes (work factor 10):

| Role | Name | Email | Password | Phone | Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Executive** | Vikram Singhania | `director@company.com` | `director123` | `+91 99999 00001` | Executive oversight & SLA compliance audits |
| **Manager** | Sunil Mehta | `manager@company.com` | `manager123` | `+91 98100 11223` | Dispatch command, fleet registry, CSV exports |
| **Driver 1** | Rahul Sharma | `rahul@company.com` | `driver123` | `+91 98101 44556` | Senior commercial route driver |
| **Driver 2** | Amit Verma | `amit@company.com` | `driver123` | `+91 98102 77889` | Express delivery route driver |
| **Driver 3** | Rajesh Kumar | `rajesh@company.com` | `driver123` | `+91 98103 99001` | Heavy articulated trailer driver |

---

## 3. Seeded Commercial Vehicles

| Registration Number | Vehicle Type | Model | Driver | Status | Telematics & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`DL01 TA 4920`** | Refrigerated Express | Tata Ultra T.7 (14ft) | Rahul Sharma | `ON_TRIP` | Fitted with thermal cargo sensors & GPS telematics |
| **`UP16 BT 9845`** | Medium Freight | Ashok Leyland Ecomet Star 1115 | Amit Verma | `AVAILABLE` | Noida-NCR intercity permit active |
| **`DL1L AA 3180`** | Heavy Freight | BharatBenz 1617R (24ft Container) | Rajesh Kumar | `ON_TRIP` | Multi-axle container truck for heavy cargo |
| **`UP14 EX 7621`** | City Box Hauler | Mahindra Furio 12 | Unassigned | `MAINTENANCE` | Brake rotor replacement at Ghaziabad workshop |

---

## 4. Seeded Facilities & Geofences

| Facility Name | Address | Latitude | Longitude | Radius (m) |
| :--- | :--- | :---: | :---: | :---: |
| **Company North Central Depot** | Okhla Industrial Area Phase-III, New Delhi | `28.5355` | `77.2680` | `200` |
| **Lajpat Nagar Central Transit Hub** | Ring Road Commercial Complex, New Delhi | `28.5677` | `77.2433` | `150` |
| **Mayur Vihar Distribution Facility**| Pocket 1, Mayur Vihar, East Delhi | `28.6015` | `77.2940` | `150` |
| **Ghazipur Border Freight Terminal** | Delhi-UP Border Highway Junction | `28.6240` | `77.3310` | `200` |
| **Noida Sector 18 Logistics Bay** | Sector 18 Commercial Lane, Noida | `28.5708` | `77.3260` | `150` |
| **Noida Sector 62 Electronic City Hub**| Block C, Sector 62, Noida | `28.6280` | `77.3680` | `250` |
| **Ecotech-III Logistics Park** | Industrial Area, Greater Noida | `28.4744` | `77.5040` | `250` |
| **Connaught Place Transit Depot** | Barakhamba Road Annex, New Delhi | `28.6315` | `77.2167` | `150` |
