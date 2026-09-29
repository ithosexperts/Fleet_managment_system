# Standard Operating Procedure: Fleet Management & Compliance

## 1. Fleet Vehicle Onboarding
When onboarding a new commercial vehicle:
1. Navigate to **Vehicle Registry** in Manager View.
2. Enter official RTO registration plate (e.g. `DL01 TA 4920`), chassis model, and vehicle category.
3. Record external SAP/ERP asset identifiers (`fleet_unit_id`) and chassis number.
4. Upload initial compliance certificates (RC, Insurance Policy, Road Fitness, and PUC).

---

## 2. Compliance Document Lifecycle & Expiration Monitoring
Commercial transport mandates 5 primary compliance certificates:
1. **Registration Certificate (RC)**: Official vehicle registration issued by regional transport authority.
2. **Commercial Insurance Policy**: Active third-party and comprehensive transit liability coverage.
3. **Road Fitness Certificate**: Mechanical roadworthiness certification.
4. **Pollution Under Control (PUC)**: Environmental emission certification.
5. **National Goods Permit**: Interstate transport authorization.

### Expiry Status Taxonomy:
- **`VALID`**: Certificate expiry is greater than 30 days in the future.
- **`EXPIRING_SOON`**: Certificate expires within 30 days. Generates an operational exception alert for management.
- **`EXPIRED`**: Certificate has lapsed. Vehicle status must be transitioned to `MAINTENANCE` or `INACTIVE` until renewed.

---

## 3. Driver In-Cab Digital Vehicle Papers Access
Field drivers can access verified digital copies of all 5 compliance certificates directly from their mobile device:
1. Driver opens the **Current Trip** card in the Android App or Driver Web Cockpit.
2. Taps the **Vehicle Papers** action button.
3. A modal immediately displays active certificates with certificate numbers, issue/expiry dates, and direct links to view scanned originals.
4. Complies with digital document verification protocols for roadside RTO and police checkpoints.

---

## 4. Preventive Maintenance Workflows
1. Every vehicle tracks scheduled maintenance intervals (e.g. 10,000 KM oil and filter service; 45,000 KM major overhaul).
2. Once maintenance is completed at an authorized service workshop, record:
   - Service date and odometer reading.
   - Line items of replaced components.
   - Total invoice cost and workshop invoice number.
   - Next service due date and odometer threshold.

