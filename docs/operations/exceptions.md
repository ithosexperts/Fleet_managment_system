# Standard Operating Procedure: Operational Exceptions & Escalations

## 1. Exception Classification & Severity Levels

| Severity | Definition | Operational Examples | Escalation Target |
| :---: | :--- | :--- | :--- |
| **`CRITICAL`** | Direct impact on safety, vehicle breakdown, or major delivery failure | Vehicle accident, catastrophic mechanical failure, severe security issue | Immediate telephone notification to Operations VP & roadside dispatch |
| **`HIGH`** | Significant SLA breach or interstate transit bottleneck | Delivery delay `> 30 minutes`, border customs hold | Dispatch manager route rerouting or customer contact notification |
| **`MEDIUM`** | Compliance deadline or dock queuing delay | PUC / Fitness certificate expiring within 14 days, loading delay `> 15 minutes` | Maintenance scheduler / Fleet supervisor |
| **`LOW`** | Informational operational variance | Early arrival, minor route detour | Logged in trip audit log |

---

## 2. Manager Exception Workflow
1. **Detection**:
   - Exceptions appear in the **TopHeader Alerts** drawer and in the **Attention Required** feed.
2. **Acknowledgement**:
   - Dispatch manager reviews exception context (time, location, driver, trip manifest).
   - Manager clicks **Acknowledge**, which records `acknowledged_by` and timestamp.
3. **Resolution**:
   - Manager records resolution notes (e.g. *"Assigned relief vehicle"*, *"Customer notified of rescheduled dock arrival"*).
   - Exception status updates to `RESOLVED`.
