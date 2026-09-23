# Standard Operating Procedure: Performance Reporting & Auditing

## 1. Reporting Metrics Overview
The TruckTracker reporting module provides consolidated operational analytics across three primary scopes:
1. **Daily Operations**: Exact delivery checkpoint counts, arrival accuracy, and bottleneck Pareto distributions for a selected operational date.
2. **Weekly Performance (7 Days)**: Rolling 7-day throughput comparison, SLA on-time percentages, and driver roster completion rates.
3. **Monthly Audit (30 Days)**: Cumulative fleet utilization, total kilometers logged, and maintenance downtime tracking.

---

## 2. Metric Calculations
- **On-Time SLA Rate (%)**:
  $$\text{On-Time \%} = \frac{\text{Completed Stops marked ON\_TIME or EARLY}}{\text{Total Completed Stops}} \times 100$$
  - Threshold **$\ge 90\%$**: Optimal (contractual performance met)
  - Threshold **$75\% - 89\%$**: Acceptable
  - Threshold **$< 75\%$**: Attention Required (investigate delay root causes)
- **Total Delay Duration**: Sum of recorded delay minutes across completed and active manifests for the period.
- **Corridor Pareto Distribution**: Aggregation of delay minutes grouped by root cause category (`Traffic Bottleneck`, `Dock Unloading Queue`, `Border Checkpost`).

---

## 3. Dual-Series Delay Attribution & Root Cause Analysis

TruckTracker v1.1.0 provides automated attribution to distinguish between delays originating from operational management versus driver transit events:

### A. Management Delays (`MANAGEMENT`)
Delays originating from terminal operations, customer warehouses, administrative processes, or asset preparation:
- **Dock & Bay Congestion**: Loading bay queues, unloading turnaround delays, forklift unavailability.
- **Dispatch Documentation**: Gate pass processing, E-Way Bill generation/verification, invoice discrepancies.
- **Customer Site Readiness**: Customer warehouse closed, security clearance delays, offload staging not ready.
- **Fleet Asset Allocation**: Vehicle unassigned, unscheduled preventive maintenance, late depot release.

### B. Driver Transit Delays (`DRIVER`)
Delays occurring during actual transit operations:
- **Expressway Traffic & Congestion**: Corridor bottlenecks, roadwork detours, toll plaza queues.
- **Weather Disruptions**: Severe monsoon rains, visibility reduction, waterlogging.
- **Driver Rest & Route Deviation**: Unauthorized stops, driver fatigue intervals, navigation errors.

### C. Visualized Trendlines & Analysis
- **Dual-Series SVG Chart**: Interactive comparison of Management vs. Driver minutes over 3-hour time blocks (Daily) or rolling days (Weekly/Monthly).
- **Attribution Percentages**: Dynamic progress bar indicating exact ratio (e.g., 62% Management vs. 38% Driver).
- **Pareto Incident Breakdown**: Ranked frequency and cumulative duration for each distinct cause.

---

## 4. CSV Export Procedure
1. Navigate to **Performance Analytics** in Manager View.
2. Select target operational date or audit period.
3. Click **Export Operational CSV**.
4. The server returns a structured CSV file formatted for ERP/TMS spreadsheet ingestion.

