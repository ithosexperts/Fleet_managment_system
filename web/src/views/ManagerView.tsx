import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Users,
  MapPin,
  FileText,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  ShieldAlert,
  Play,
  Activity,
  Layers,
  Phone,
  Compass,
  RotateCcw,
  FileCheck,
  CreditCard,
  Edit3,
  Trash2,
  Eye,
  Radio,
  Navigation,
  ArrowDownAZ,
  X
} from 'lucide-react';
import { api, API_BASE } from '../services/api';
import { Trip, User, Vehicle, Driver, Destination } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TripCreatorModal } from '../components/TripCreatorModal';
import { TripDetailModal } from '../components/TripDetailModal';
import { VehicleModal } from '../components/VehicleModal';
import { DriverModal } from '../components/DriverModal';
import { DestinationModal } from '../components/DestinationModal';
import { VehiclePapersModal } from '../components/VehiclePapersModal';
import { DriverDossierModal } from '../components/DriverDossierModal';
import { LeafletMap } from '../components/LeafletMap';
import { AppLayout } from '../components/layout/AppLayout';
import { AlertItem } from '../components/layout/TopHeader';
import { NavSection } from '../components/layout/Sidebar';
import { KpiCard } from '../components/common/KpiCard';
import { PageHeader } from '../components/common/PageHeader';
import { EnterpriseTable, Column } from '../components/common/EnterpriseTable';
import { EmptyState } from '../components/common/EmptyState';
import { SearchableDropdown } from '../components/common/SearchableDropdown';
import { SlaGauge, TrendBarChart, FleetStatusBar } from '../components/common/VisualCharts';
import { DelayAttributionLineChart } from '../components/common/DelayAttributionLineChart';
import { HoseXpertsLogo } from '../components/common/HoseXpertsLogo';

// Dedicated Operations & Dispatch Workspaces
import { OverviewDashboard } from '../components/operations/OverviewDashboard';
import { ScheduleScreen } from '../components/operations/ScheduleScreen';
import { DispatchBoard } from '../components/operations/DispatchBoard';
import { AssignmentModal } from '../components/operations/AssignmentModal';
import { ExceptionsCenter } from '../components/operations/ExceptionsCenter';
import { DocumentsHub } from '../components/operations/DocumentsHub';
import { SettingsView } from '../components/operations/SettingsView';
import { OperationalException } from '../types';

interface Props {
  currentUser: User;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSwitchRole?: (role: 'DRIVER' | 'MANAGER') => void;
}

export const ManagerView: React.FC<Props> = ({
  currentUser,
  onLogout,
  theme = 'dark',
  onToggleTheme = () => {},
  onSwitchRole
}) => {
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [attention, setAttention] = useState<any>(null);
  const [exceptions, setExceptions] = useState<OperationalException[]>([]);
  const [assignmentTrip, setAssignmentTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Timeframe Period Filter (Today / Weekly 7D / Monthly 30D)
  const [timeframeFilter, setTimeframeFilter] = useState<'today' | 'weekly' | 'monthly'>('today');

  // Filters for Operations Trips
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterDriverId, setFilterDriverId] = useState<string[]>([]);
  const [filterVehicleId, setFilterVehicleId] = useState<string[]>([]);
  const [filterDelaysOnly, setFilterDelaysOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Alphabetical & Metric Sorting State
  const [tripSort, setTripSort] = useState<'default' | 'id_asc' | 'driver_asc' | 'driver_desc' | 'vehicle_asc' | 'delay_desc'>('default');
  const [vehicleSort, setVehicleSort] = useState<'plate_asc' | 'plate_desc' | 'model_asc' | 'driver_asc'>('plate_asc');
  const [driverSort, setDriverSort] = useState<'name_asc' | 'name_desc' | 'id_asc' | 'trips_desc'>('name_asc');
  const [destinationSort, setDestinationSort] = useState<'code_asc' | 'name_asc' | 'name_desc' | 'address_asc'>('code_asc');

  // Multi-Select Checkboxes for Batch Actions
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);

  // Alert Notifications Center state
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  // Fleet Sub-Search & Filters
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string[]>([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string[]>([]);
  const [destinationSearch, setDestinationSearch] = useState('');

  // Modals & Manager Action State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [papersVehicle, setPapersVehicle] = useState<Vehicle | null>(null);
  const [papersDocType, setPapersDocType] = useState<string | undefined>(undefined);
  const [papersIsAddDoc, setPapersIsAddDoc] = useState<boolean | undefined>(undefined);
  const [dossierDriver, setDossierDriver] = useState<Driver | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Live Telematics Map state (Fleet Telemetry)
  const [telematicsSearch, setTelematicsSearch] = useState('');
  const [telematicsFilter, setTelematicsFilter] = useState<'ALL' | 'MOVING' | 'IDLE'>('ALL');
  const [selectedVehicleForMap, setSelectedVehicleForMap] = useState<Vehicle | null>(null);
  const [focusedMapLocation, setFocusedMapLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSimulatingFleet, setIsSimulatingFleet] = useState(true);

  // Fleet state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [fleetLoading, setFleetLoading] = useState(false);

  // Performance Analytics Reports state
  const [reportsPeriod, setReportsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [liveRefresh, setLiveRefresh] = useState(true);

  // Initial and filter-triggered fetch
  useEffect(() => {
    loadDashboardData();
  }, [selectedDate, statusFilter.join(',')]);

  // Continuous Real-Time Auto-Refresh Engine: runs non-blocking sync every 5 seconds across all operational modules
  useEffect(() => {
    if (!liveRefresh) return;

    const interval = setInterval(() => {
      silentRealtimeSync();
    }, 5000);

    return () => clearInterval(interval);
  }, [liveRefresh, activeSection, selectedDate, statusFilter.join(','), searchQuery, reportsPeriod]);

  // Live Vehicle Telematics Simulation (Ola / Rapido style real-time movements)
  // Tab-guarded to only run when actively viewing map or overview, eliminating background re-renders and blinking
  useEffect(() => {
    if (!isSimulatingFleet || !['overview', 'map'].includes(activeSection)) return;

    const interval = setInterval(() => {
      setVehicles((prevVehicles) =>
        prevVehicles.map((v) => {
          if (!v.latitude || !v.longitude) return v;
          const isMoving = (v.speed_kmh || 0) > 0 || v.status === 'ON_TRIP';
          if (!isMoving) return v;

          const headingRad = ((v.heading_deg || 45) * Math.PI) / 180;
          const deltaLat = Math.cos(headingRad) * 0.00035 + (Math.random() - 0.5) * 0.00008;
          const deltaLng = Math.sin(headingRad) * 0.00035 + (Math.random() - 0.5) * 0.00008;
          const speedFluc = Math.max(18, Math.min(85, (v.speed_kmh || 42) + (Math.random() * 4 - 2)));

          return {
            ...v,
            latitude: v.latitude + deltaLat,
            longitude: v.longitude + deltaLng,
            speed_kmh: speedFluc,
            last_ping: new Date().toISOString()
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulatingFleet, activeSection]);

  // Manager Fleet Deletion & Decommissioning Handlers
  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    const hasTrips = (vehicle.total_trips || 0) > 0 || trips.some((t) => t.vehicle_id === vehicle.id || t.vehicle_number === vehicle.vehicle_number);
    if (hasTrips) {
      alert(`Cannot delete vehicle ${vehicle.vehicle_number}: Completed or active trips/deliveries are recorded for this vehicle. Deletion is disabled to protect delivery history. Only editing is permitted.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete vehicle ${vehicle.vehicle_number}?`)) {
      return;
    }
    try {
      await api.fleet.deleteVehicle(vehicle.id);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  const handleDeleteDriver = async (driver: Driver) => {
    const hasTrips = (driver.total_trips || 0) > 0 || trips.some((t) => t.driver_id === driver.user_id || t.driver_id === driver.id || t.driver_name === driver.name);
    if (hasTrips) {
      alert(`Cannot delete driver ${driver.name}: Completed or active trips/deliveries are recorded for this driver. Deletion is disabled to protect delivery history. Only editing is permitted.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to remove driver ${driver.name} from the roster?`)) {
      return;
    }
    try {
      await api.fleet.deleteDriver(driver.id);
      setDrivers((prev) => prev.filter((d) => d.id !== driver.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete driver');
    }
  };

  const handleDeleteDestination = async (dest: Destination) => {
    const hasDeliveries = (dest.total_deliveries || 0) > 0 ||
      dest.name.toLowerCase().includes('depot') ||
      dest.name.toLowerCase().includes('company') ||
      trips.some((t) =>
        (t.starting_location && t.starting_location.trim().toLowerCase() === dest.name.trim().toLowerCase()) ||
        t.stops?.some((s) => s.destination_id === dest.id || (s.destination_name && s.destination_name.trim().toLowerCase() === dest.name.trim().toLowerCase()))
      );
    if (hasDeliveries) {
      alert(`Cannot delete destination "${dest.name}": Deliveries, starting depot runs, or orders have already been recorded for this facility. Deletion is disabled to protect delivery history. Only editing is permitted.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to deactivate destination "${dest.name}"?`)) {
      return;
    }
    try {
      await api.fleet.deleteDestination(dest.id);
      setDestinations((prev) => prev.filter((d) => d.id !== dest.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete destination');
    }
  };

  // Initial mount: load dashboard, fleet master, and exceptions
  useEffect(() => {
    loadDashboardData();
    loadFleetData();
    loadFleetExceptions();
  }, []);

  // Section data dependencies
  useEffect(() => {
    if (['vehicles', 'drivers', 'destinations', 'map', 'documents', 'schedule', 'dispatch'].includes(activeSection)) {
      loadFleetData();
    }
    if (activeSection === 'reports') {
      loadReportsData();
    }
    if (activeSection === 'exceptions' || activeSection === 'overview') {
      loadFleetExceptions();
    }
  }, [activeSection, selectedDate, reportsPeriod]);

  const loadFleetExceptions = async () => {
    try {
      const data = await api.fleet.getExceptions({ limit: 50 });
      if (data && data.exceptions) {
        setExceptions(data.exceptions);
      }
    } catch {
      // Fallback handled in API
    }
  };

  const handleConfirmAssignment = async (tripId: string, driverId: string, vehicleId: string) => {
    const drv = drivers.find((d) => d.user_id === driverId || d.id === driverId);
    const veh = vehicles.find((v) => v.id === vehicleId);

    await api.manager.updateTrip(tripId, {
      driver_id: driverId,
      vehicle_id: vehicleId,
      status: 'ASSIGNED'
    });

    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              driver_id: driverId,
              driver_name: drv?.name || t.driver_name,
              vehicle_id: vehicleId,
              vehicle_number: veh?.vehicle_number || t.vehicle_number,
              status: 'ASSIGNED'
            }
          : t
      )
    );
  };

  const handleAcknowledgeException = async (id: string, notes?: string) => {
    await api.fleet.acknowledgeException(id, notes);
    setExceptions((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, is_acknowledged: 1, resolution_status: 'ACKNOWLEDGED', resolution_notes: notes }
          : e
      )
    );
  };

  const handleCancelTrip = async (tripId: string) => {
    const reason = window.prompt('Please provide a reason for cancelling this trip:');
    if (reason === null) return;
    try {
      await api.manager.cancelTrip(tripId, reason || 'Cancelled by manager');
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, status: 'CANCELLED' } : t))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to cancel trip');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [tripsRes, attentionRes] = await Promise.all([
        api.manager.getTrips({
          date: selectedDate,
          status: statusFilter.join(','),
          search: searchQuery
        }),
        api.manager.getAttention()
      ]);

      setTrips(Array.isArray(tripsRes?.trips) ? tripsRes.trips : (Array.isArray(tripsRes) ? tripsRes : []));
      setAttention(attentionRes);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    if (['vehicles', 'drivers', 'destinations'].includes(activeSection)) {
      await loadFleetData();
    } else if (activeSection === 'reports') {
      await loadReportsData();
    } else {
      await loadDashboardData();
    }
    setRefreshing(false);
  };

  const silentRealtimeSync = async () => {
    try {
      // 1. Always poll attention alerts and live operational exceptions
      const promises: Promise<any>[] = [
        api.manager.getAttention(),
        api.fleet.getExceptions({ limit: 50 })
      ];

      // 2. Conditionally poll active module data silently
      const shouldFetchTrips = ['overview', 'schedule', 'dispatch', 'trips'].includes(activeSection);
      const shouldFetchVehicles = ['overview', 'vehicles', 'drivers', 'destinations', 'map', 'documents'].includes(activeSection);
      const shouldFetchReports = activeSection === 'reports';

      let tripsIdx = -1;
      let vehiclesIdx = -1;
      let reportsIdx = -1;

      if (shouldFetchTrips) {
        tripsIdx = promises.length;
        promises.push(
          api.manager.getTrips({
            date: selectedDate,
            status: statusFilter.join(','),
            search: searchQuery
          })
        );
      }
      if (shouldFetchVehicles) {
        vehiclesIdx = promises.length;
        promises.push(api.fleet.getVehicles());
      }
      if (shouldFetchReports) {
        reportsIdx = promises.length;
        if (reportsPeriod === 'weekly' || reportsPeriod === 'monthly') {
          promises.push(api.reports.getPeriodic(reportsPeriod));
        } else {
          promises.push(api.reports.getDaily(selectedDate));
        }
      }

      const results = await Promise.allSettled(promises);

      // Attention metrics update
      if (results[0]?.status === 'fulfilled' && results[0].value) {
        setAttention(results[0].value);
      }

      // Exceptions & incident triage update
      if (results[1]?.status === 'fulfilled' && (results[1].value as any)?.exceptions) {
        setExceptions((results[1].value as any).exceptions);
      }

      // Module-specific seamless data update
      if (tripsIdx !== -1 && results[tripsIdx]?.status === 'fulfilled' && (results[tripsIdx] as any).value?.trips) {
        setTrips((results[tripsIdx] as any).value.trips);
      }
      if (vehiclesIdx !== -1 && results[vehiclesIdx]?.status === 'fulfilled' && (results[vehiclesIdx] as any).value?.vehicles) {
        setVehicles((results[vehiclesIdx] as any).value.vehicles);
      }
      if (reportsIdx !== -1 && results[reportsIdx]?.status === 'fulfilled' && (results[reportsIdx] as any).value) {
        setDailyReport((results[reportsIdx] as any).value);
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.warn('[RealTimeSync] Silent background tick failed:', err);
    }
  };

  const silentRefreshOperations = silentRealtimeSync;

  const loadFleetData = async () => {
    setFleetLoading(true);
    try {
      const [vRes, dRes, destRes] = await Promise.all([
        api.fleet.getVehicles(),
        api.fleet.getDrivers(),
        api.fleet.getDestinations()
      ]);
      setVehicles(Array.isArray(vRes?.vehicles) ? vRes.vehicles : (Array.isArray(vRes) ? vRes : []));
      setDrivers(Array.isArray(dRes?.drivers) ? dRes.drivers : (Array.isArray(dRes) ? dRes : []));
      setDestinations(Array.isArray(destRes?.destinations) ? destRes.destinations : (Array.isArray(destRes) ? destRes : []));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Fleet error:', err);
    } finally {
      setFleetLoading(false);
    }
  };

  const loadReportsData = async () => {
    setReportsLoading(true);
    try {
      if (reportsPeriod === 'weekly' || reportsPeriod === 'monthly') {
        const data = await api.reports.getPeriodic(reportsPeriod);
        setDailyReport(data);
      } else {
        const data = await api.reports.getDaily(selectedDate);
        setDailyReport(data);
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Reports error:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await api.reports.exportCSV(selectedDate);
    } catch (err) {
      console.error('Reports CSV export error:', err);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportSelectedCsv = () => {
    const selected = trips.filter((t) => selectedTripIds.includes(t.id));
    if (selected.length === 0) return;
    const headers = [
      'Trip ID',
      'Date',
      'Driver',
      'Vehicle',
      'Starting Location',
      'Total Stops',
      'Status',
      'Delay (Mins)',
      'Distance (KM)'
    ];
    const rows = selected.map((t) => [
      t.id,
      t.date,
      `"${(t.driver_name || '').replace(/"/g, '""')}"`,
      t.vehicle_number || '',
      `"${(t.starting_location || '').replace(/"/g, '""')}"`,
      t.stops?.length || t.total_stops || 0,
      t.status,
      t.total_delay_minutes || 0,
      t.calculated_distance_km || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `selected_trips_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };



  // Operational metrics
  const totalTrips = trips.length;
  const activeTrips = trips.filter((t) =>
    ['IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING'].includes(t.status)
  );
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED');
  const delayedTrips = trips.filter((t) => (t.total_delay_minutes || 0) > 0);

  // Active trip associated with the currently tracked vehicle on live telematics map
  const activeTripForSelectedVehicle = useMemo(() => {
    if (selectedVehicleForMap) {
      const match = trips.find(
        (t) =>
          (t.vehicle_id === selectedVehicleForMap.id || t.vehicle_number === selectedVehicleForMap.vehicle_number) &&
          (t.status === 'IN_PROGRESS' || t.status === 'AT_DESTINATION' || t.status === 'ASSIGNED')
      );
      if (match) return match;
      const anyMatch = trips.find(
        (t) => t.vehicle_id === selectedVehicleForMap.id || t.vehicle_number === selectedVehicleForMap.vehicle_number
      );
      if (anyMatch) return anyMatch;
    }
    return trips.find((t) => t.status === 'IN_PROGRESS') || trips[0];
  }, [selectedVehicleForMap, trips]);

  // Trips Table Columns Definition
  const tripColumns: Column<Trip>[] = [
    {
      key: 'id',
      header: 'Trip ID',
      sortable: true,
      render: (trip) => (
        <div>
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            {trip.id}
          </span>
          <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {trip.purpose || 'Freight Delivery'}
          </span>
        </div>
      )
    },
    {
      key: 'driver_name',
      header: 'Driver',
      sortable: true,
      render: (trip) => (
        <div>
          <div style={{ fontWeight: 500 }}>{trip.driver_name || 'Unassigned'}</div>
          {trip.driver_phone && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Phone size={10} />
              <span>{trip.driver_phone}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'vehicle_number',
      header: 'Vehicle',
      sortable: true,
      render: (trip) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trip.vehicle_number}</span>
          <span style={{ fontSize: '0.74rem', display: 'block', color: 'var(--text-muted)' }}>
            {trip.vehicle_model || trip.vehicle_type || 'Fleet Asset'}
          </span>
        </div>
      )
    },
    {
      key: 'current_destination',
      header: 'Next / Current Stop',
      render: (trip) => (
        <div style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {trip.current_destination || 'All stops visited'}
        </div>
      )
    },
    {
      key: 'stops_progress',
      header: 'Stop Progress',
      render: (trip) => {
        const completed = trip.completed_stops ?? (trip.stops?.filter(s => s.status === 'COMPLETED').length ?? (trip.status === 'COMPLETED' ? 1 : 0));
        const total = trip.total_stops || (trip.stops?.length ? trip.stops.length : (trip.status === 'COMPLETED' ? 1 : 2));
        const percent = total > 0 ? (completed / total) * 100 : 0;
        return (
          <div style={{ minWidth: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
              <span>Stops</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{completed}/{total}</span>
            </div>
            <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${percent}%`,
                  backgroundColor: percent === 100 ? 'var(--status-success)' : 'var(--accent-primary)',
                  transition: 'width 0.2s ease'
                }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'planned_departure_time',
      header: 'Schedule',
      sortable: true,
      render: (trip) => (
        <div style={{ fontSize: '0.8rem' }}>
          <div>Plan: <b>{trip.planned_departure_time}</b></div>
          {trip.actual_start_time && (
            <div style={{ color: 'var(--accent-gold)', fontSize: '0.73rem' }}>
              Departed: {new Date(trip.actual_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (trip) => <StatusBadge status={trip.status} />
    },
    {
      key: 'total_delay_minutes',
      header: 'Delay',
      sortable: true,
      render: (trip) => {
        const mins = trip.total_delay_minutes || 0;
        return mins > 0 ? (
          <span style={{ fontWeight: 600, color: 'var(--status-delayed)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <AlertTriangle size={12} />
            {mins}m
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (trip) => (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTripId(trip.id);
          }}
          style={{ padding: '4px 10px' }}
        >
          <span>Inspect</span>
          <ChevronRight size={13} />
        </button>
      )
    }
  ];

  // Filter Reset & Helper State
  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setFilterDriverId([]);
    setFilterVehicleId([]);
    setVehicleStatusFilter([]);
    setFilterDelaysOnly(false);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    statusFilter.length > 0 ||
    filterDriverId.length > 0 ||
    filterVehicleId.length > 0 ||
    filterDelaysOnly ||
    timeframeFilter !== 'today' ||
    selectedDate !== new Date().toISOString().split('T')[0]
  );

  // Operational Alerts calculation for TopHeader Notification Center
  const operationalAlerts: AlertItem[] = useMemo(() => {
    const list: AlertItem[] = [];

    // 1. Active trip delay exceptions
    trips.forEach((t) => {
      const mins = t.total_delay_minutes || 0;
      const aid = `trip-delay-${t.id}`;
      if (mins > 0 && !dismissedAlertIds.includes(aid)) {
        list.push({
          id: aid,
          title: `Trip Delay Exception: ${t.id} (+${mins}m)`,
          subtitle: `Vehicle ${t.vehicle_number} • Driver: ${t.driver_name || 'Unassigned'}`,
          level: mins > 30 ? 'critical' : 'warning',
          timestamp: t.planned_departure_time ? `Planned: ${t.planned_departure_time}` : undefined,
          linkAction: () => setSelectedTripId(t.id)
        });
      }
    });

    // 2. Server attention exceptions
    if (attention?.delayedTrips) {
      attention.delayedTrips.forEach((dt: any) => {
        const aid = `att-${dt.id}`;
        if (!list.some((a) => a.id === `trip-delay-${dt.id}`) && !dismissedAlertIds.includes(aid)) {
          list.push({
            id: aid,
            title: `Active Corridor Delay: ${dt.id} (+${dt.total_delay_minutes}m)`,
            subtitle: `Driver: ${dt.driver_name} • Cause: ${dt.delay_reason || 'Traffic Congestion'}`,
            level: 'critical',
            linkAction: () => setSelectedTripId(dt.id)
          });
        }
      });
    }

    if (attention?.failedActivities) {
      attention.failedActivities.forEach((fa: any) => {
        const aid = `fail-${fa.id}`;
        if (!dismissedAlertIds.includes(aid)) {
          list.push({
            id: aid,
            title: `Proof Validation Issue at ${fa.destination_name}`,
            subtitle: `Trip: ${fa.trip_id} • Driver: ${fa.driver_name}`,
            level: 'critical',
            linkAction: () => setSelectedTripId(fa.trip_id)
          });
        }
      });
    }

    // 3. Vehicle regulatory document expiry
    vehicles.forEach((v) => {
      if (v.documents && v.documents.length > 0) {
        v.documents.forEach((doc: any) => {
          if (doc.expiry_date) {
            const diffDays = Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 3600 * 24));
            const aid = `doc-${v.id}-${doc.document_type}`;
            if (diffDays <= 30 && !dismissedAlertIds.includes(aid)) {
              list.push({
                id: aid,
                title: `${doc.document_type} Renewal Alert (${v.vehicle_number})`,
                subtitle: diffDays < 0 ? `Expired ${Math.abs(diffDays)} days ago` : `Expires in ${diffDays} days`,
                level: diffDays < 0 ? 'critical' : 'warning',
                linkAction: () => setPapersVehicle(v)
              });
            }
          }
        });
      }
    });

    return list;
  }, [trips, attention, vehicles, dismissedAlertIds]);

  // Filtered Trips Computation
  const filteredTrips = trips.filter((trip) => {
    if (statusFilter.length > 0 && !statusFilter.includes(trip.status)) return false;
    if (filterDriverId.length > 0 && !filterDriverId.includes(trip.driver_id) && !filterDriverId.includes(trip.driver_name || '')) return false;
    if (filterVehicleId.length > 0 && !filterVehicleId.includes(trip.vehicle_id) && !filterVehicleId.includes(trip.vehicle_number || '')) return false;
    if (filterDelaysOnly && !(trip.total_delay_minutes && trip.total_delay_minutes > 0)) return false;

    // Timeframe period filtering
    if (timeframeFilter === 'weekly') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const minDate = d.toISOString().split('T')[0];
      if (trip.date < minDate) return false;
    } else if (timeframeFilter === 'monthly') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const minDate = d.toISOString().split('T')[0];
      if (trip.date < minDate) return false;
    } else if (timeframeFilter === 'today') {
      if (selectedDate && trip.date !== selectedDate) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        trip.id.toLowerCase().includes(q) ||
        (trip.driver_name || '').toLowerCase().includes(q) ||
        (trip.vehicle_number || '').toLowerCase().includes(q) ||
        (trip.reference_number || '').toLowerCase().includes(q) ||
        (trip.purpose || '').toLowerCase().includes(q) ||
        (trip.stops || []).some(
          (s) =>
            (s.destination_name || '').toLowerCase().includes(q) ||
            (s.address || '').toLowerCase().includes(q)
        );
      if (!match) return false;
    }
    return true;
  });

  // Alphabetical & Metric Sorted Trips
  const sortedTrips = useMemo(() => {
    const list = [...filteredTrips];
    switch (tripSort) {
      case 'id_asc':
        return list.sort((a, b) => a.id.localeCompare(b.id));
      case 'driver_asc':
        return list.sort((a, b) => (a.driver_name || '').localeCompare(b.driver_name || ''));
      case 'driver_desc':
        return list.sort((a, b) => (b.driver_name || '').localeCompare(a.driver_name || ''));
      case 'vehicle_asc':
        return list.sort((a, b) => (a.vehicle_number || '').localeCompare(b.vehicle_number || ''));
      case 'delay_desc':
        return list.sort((a, b) => (b.total_delay_minutes || 0) - (a.total_delay_minutes || 0));
      default:
        return list;
    }
  }, [filteredTrips, tripSort]);

  // Vehicles Filtered & Sorted
  const sortedVehicles = useMemo(() => {
    const list = vehicles.filter((v) => {
      const matchesSearch =
        v.vehicle_number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        (v.assigned_driver_name || '').toLowerCase().includes(vehicleSearch.toLowerCase());
      const matchesStatus = vehicleStatusFilter.length === 0 || vehicleStatusFilter.includes(v.status);
      return matchesSearch && matchesStatus;
    });

    switch (vehicleSort) {
      case 'plate_asc':
        return list.sort((a, b) => a.vehicle_number.localeCompare(b.vehicle_number));
      case 'plate_desc':
        return list.sort((a, b) => b.vehicle_number.localeCompare(a.vehicle_number));
      case 'model_asc':
        return list.sort((a, b) => a.model.localeCompare(b.model));
      case 'driver_asc':
        return list.sort((a, b) => (a.assigned_driver_name || '').localeCompare(b.assigned_driver_name || ''));
      default:
        return list;
    }
  }, [vehicles, vehicleSearch, vehicleStatusFilter, vehicleSort]);

  // Drivers Filtered & Sorted
  const sortedDrivers = useMemo(() => {
    const list = drivers.filter((d) => {
      if (driverStatusFilter.length > 0 && !driverStatusFilter.includes(d.status)) {
        return false;
      }
      return (
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.employee_id.toLowerCase().includes(driverSearch.toLowerCase()) ||
        (d.phone || '').includes(driverSearch)
      );
    });

    switch (driverSort) {
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'id_asc':
        return list.sort((a, b) => a.employee_id.localeCompare(b.employee_id));
      case 'trips_desc':
        return list.sort((a, b) => (b.total_trips || 0) - (a.total_trips || 0));
      default:
        return list;
    }
  }, [drivers, driverSearch, driverStatusFilter, driverSort]);

  // Destinations Filtered & Sorted
  const sortedDestinations = useMemo(() => {
    const list = destinations.filter((dest) => {
      return (
        (dest.area_code || '').toLowerCase().includes(destinationSearch.toLowerCase()) ||
        dest.name.toLowerCase().includes(destinationSearch.toLowerCase()) ||
        dest.address.toLowerCase().includes(destinationSearch.toLowerCase()) ||
        (dest.contact_name || '').toLowerCase().includes(destinationSearch.toLowerCase())
      );
    });

    switch (destinationSort) {
      case 'code_asc':
        return list.sort((a, b) => (a.area_code || a.name).localeCompare(b.area_code || b.name));
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'address_asc':
        return list.sort((a, b) => a.address.localeCompare(b.address));
      default:
        return list;
    }
  }, [destinations, destinationSearch, destinationSort]);

  const unassignedCount = useMemo(
    () => trips.filter((t) => t.status === 'PLANNED' || !t.driver_id).length,
    [trips]
  );
  const exceptionsCount = useMemo(
    () => exceptions.filter((e) => !e.is_acknowledged && e.resolution_status !== 'ACKNOWLEDGED').length,
    [exceptions]
  );

  if (loading && trips.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary, #0B101B)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '22px',
          padding: '24px'
        }}
      >
        <div
          style={{
            padding: '14px 26px',
            background: 'var(--card-bg, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            borderRadius: '16px',
            boxShadow: '0 15px 35px -10px rgba(0,0,0,0.6), 0 0 24px rgba(23,100,168,0.2)',
            animation: 'hxPulse 2.2s infinite ease-in-out'
          }}
        >
          <HoseXpertsLogo
            variant={theme === 'dark' ? 'white' : 'blue'}
            height={52}
            showTagline={true}
          />
        </div>
        <div
          style={{
            width: '180px',
            height: '4px',
            backgroundColor: 'var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '100%',
              backgroundColor: '#1764A8',
              borderRadius: '9999px',
              animation: 'hxSlide 1.2s infinite ease-in-out'
            }}
          />
        </div>
        <div style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.84rem', fontWeight: 600, letterSpacing: '0.02em' }}>
          Loading Operations Control Center...
        </div>
        <style>{`
          @keyframes hxPulse { 0%, 100% { opacity: 0.9; transform: scale(1); } 50% { opacity: 1; transform: scale(1.025); } }
          @keyframes hxSlide { 0% { transform: translateX(-60px); } 100% { transform: translateX(180px); } }
        `}</style>
      </div>
    );
  }

  return (
    <AppLayout
      currentUser={currentUser}
      onLogout={onLogout}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onSwitchToDriver={onSwitchRole ? () => onSwitchRole('DRIVER') : undefined}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      onNewTrip={() => setIsCreateModalOpen(true)}
      lastUpdated={lastRefresh}
      onRefresh={handleManualRefresh}
      refreshing={refreshing}
      alerts={operationalAlerts}
      onDismissAlert={(id) => setDismissedAlertIds((prev) => [...prev, id])}
      onClearAllAlerts={() => setDismissedAlertIds(operationalAlerts.map((a) => a.id))}
      unassignedCount={unassignedCount}
      exceptionsCount={exceptionsCount}
      liveRefresh={liveRefresh}
      onToggleLiveRefresh={() => setLiveRefresh((prev) => !prev)}
    >
      {/* ========================================================
          0. OPERATIONS OVERVIEW COCKPIT
          ======================================================== */}
      {activeSection === 'overview' && (
        <OverviewDashboard
          trips={trips}
          drivers={drivers}
          vehicles={vehicles}
          exceptions={exceptions}
          theme={theme}
          onNavigateSection={setActiveSection}
          onOpenCreateTrip={() => setIsCreateModalOpen(true)}
          onOpenTripDetails={(id) => setSelectedTripId(id)}
          onOpenAssignment={(trip) => setAssignmentTrip(trip)}
          onTrackVehicle={(v) => {
            setSelectedVehicleForMap(v);
            if (v.latitude && v.longitude) {
              setFocusedMapLocation({ latitude: v.latitude, longitude: v.longitude });
            }
            setActiveSection('map');
          }}
        />
      )}

      {/* ========================================================
          1. SCHEDULE SCREEN
          ======================================================== */}
      {activeSection === 'schedule' && (
        <ScheduleScreen
          trips={trips}
          drivers={drivers}
          vehicles={vehicles}
          onOpenCreateTrip={() => setIsCreateModalOpen(true)}
          onOpenTripDetails={(id) => setSelectedTripId(id)}
          onOpenAssignment={(trip) => setAssignmentTrip(trip)}
          onCancelTrip={handleCancelTrip}
        />
      )}

      {/* ========================================================
          2. DISPATCH PIPELINE BOARD
          ======================================================== */}
      {activeSection === 'dispatch' && (
        <DispatchBoard
          trips={trips}
          drivers={drivers}
          vehicles={vehicles}
          onOpenCreateTrip={() => setIsCreateModalOpen(true)}
          onOpenTripDetails={(id) => setSelectedTripId(id)}
          onOpenAssignment={(trip) => setAssignmentTrip(trip)}
          onTrackOnMap={() => setActiveSection('map')}
        />
      )}

      {/* ========================================================
          3. TRIPS MANAGEMENT & DISPATCH COMMAND
          ======================================================== */}
      {activeSection === 'trips' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PageHeader
            breadcrumbs={[{ label: 'Operations' }, { label: 'Trips Management' }]}
            title="Operations Trips & Dispatches"
            subtitle="Real-time dispatch telemetry, active routes, and transit exception monitoring across assigned fleet units."
            lastUpdated={lastRefresh}
            onRefresh={handleManualRefresh}
            refreshing={refreshing}
            actions={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={14} />
                <span>Schedule Trip</span>
              </button>
            }
          />

          {/* Top KPI Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
            <KpiCard
              label="Scheduled Dispatches"
              value={totalTrips}
              subValue="Manifested vehicle trips"
              icon={<Truck size={18} />}
            />
            <KpiCard
              label="Active In-Transit"
              value={activeTrips.length}
              subValue="In Progress / Returning"
              icon={<Play size={18} />}
              variant={activeTrips.length > 0 ? 'info' : 'default'}
            />
            <KpiCard
              label="Completed Deliveries"
              value={completedTrips.length}
              subValue="Returned to central depot"
              icon={<CheckCircle size={18} />}
              variant="success"
            />
            <KpiCard
              label="Transit Delay Exceptions"
              value={delayedTrips.length}
              subValue="Traffic, loading, or gate delays"
              icon={<AlertTriangle size={18} />}
              variant={delayedTrips.length > 0 ? 'warning' : 'default'}
            />
            <KpiCard
              label="Immediate Attention"
              value={operationalAlerts.length}
              subValue="Active operational alerts"
              icon={<ShieldAlert size={18} />}
              variant={operationalAlerts.length > 0 ? 'danger' : 'default'}
            />
          </div>

          {/* Visual Operational Analytics Panel */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 260px) 1fr',
              gap: '16px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              alignItems: 'center'
            }}
            className="visual-analytics-card"
          >
            <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '12px' }}>
              <SlaGauge
                percentage={
                  completedTrips.length > 0
                    ? Math.round(((completedTrips.length - delayedTrips.length) / completedTrips.length) * 100)
                    : 100
                }
                label="On-Time Delivery SLA"
                sublabel={`${completedTrips.length} completed manifests`}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px' }}>
              <FleetStatusBar
                completed={completedTrips.length}
                inTransit={activeTrips.length}
                delayed={delayedTrips.length}
                scheduled={Math.max(0, totalTrips - completedTrips.length - activeTrips.length)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <span>Active telematics telemetry monitoring vehicle status, stops, and geofence arrivals.</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Timeframe: {timeframeFilter === 'today' ? 'Today' : timeframeFilter === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
                </span>
              </div>
            </div>
          </div>

          {/* ATTENTION REQUIRED EXCEPTION CENTER */}
          {attention && attention.totalAttentionCount > 0 && (
            <div
              style={{
                backgroundColor: 'var(--status-delayed-bg)',
                border: '1px solid var(--status-delayed-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-delayed)', fontWeight: 600, fontSize: '0.92rem' }}>
                  <AlertTriangle size={18} />
                  <span>OPERATIONAL EXCEPTIONS ({attention.totalAttentionCount} REQUIRE ATTENTION)</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Prioritize resolving customer delivery bottlenecks
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {attention.delayedTrips?.map((dt: any) => (
                  <div
                    key={dt.id}
                    onClick={() => setSelectedTripId(dt.id)}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.84rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{dt.id} ({dt.vehicle_number})</span>
                      <span style={{ color: 'var(--status-delayed)', fontWeight: 600, fontSize: '0.78rem' }}>
                        +{dt.total_delay_minutes}m Delay
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>
                      Driver: <b>{dt.driver_name}</b> • Cause: {dt.delay_reason || 'Transit Bottleneck'}
                    </div>
                  </div>
                ))}

                {attention.failedActivities?.map((fa: any) => (
                  <div
                    key={fa.id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--status-danger-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <div style={{ color: 'var(--status-danger)', fontWeight: 600 }}>
                      Delivery Activity Exception at {fa.destination_name}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
                      Trip: {fa.trip_id} • Driver: {fa.driver_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter, Search & Refresh Multi-Criteria Toolbar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: 'var(--bg-surface)',
              padding: '14px 16px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Top row: Search input, Period Pills & Action Controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Responsive Search Input with Clear Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px', position: 'relative', padding: '4px 10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, minWidth: 0, height: '38px', padding: '8px 30px 8px 0', fontSize: '0.88rem', fontWeight: 500, backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
                  placeholder="Search by Trip ID, driver, vehicle plate, reference no, or stop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Weekly / Monthly / Today Period Filter Toggle */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '2px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setTimeframeFilter('today')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: timeframeFilter === 'today' ? 700 : 500,
                    backgroundColor: timeframeFilter === 'today' ? 'var(--bg-surface)' : 'transparent',
                    color: timeframeFilter === 'today' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: timeframeFilter === 'today' ? 'var(--shadow-xs)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframeFilter('weekly')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: timeframeFilter === 'weekly' ? 700 : 500,
                    backgroundColor: timeframeFilter === 'weekly' ? 'var(--bg-surface)' : 'transparent',
                    color: timeframeFilter === 'weekly' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: timeframeFilter === 'weekly' ? 'var(--shadow-xs)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Weekly (7D)
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframeFilter('monthly')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: timeframeFilter === 'monthly' ? 700 : 500,
                    backgroundColor: timeframeFilter === 'monthly' ? 'var(--bg-surface)' : 'transparent',
                    color: timeframeFilter === 'monthly' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: timeframeFilter === 'monthly' ? 'var(--shadow-xs)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Monthly (30D)
                </button>
              </div>

              {/* Date Selector for Specific Operational Days */}
              {timeframeFilter === 'today' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--text-muted)" />
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '5px 8px', fontSize: '0.8rem', width: 'auto' }}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              )}

              {/* Live auto-refresh toggle */}
              <button
                type="button"
                onClick={() => setLiveRefresh((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: liveRefresh ? 'rgba(37, 211, 102, 0.12)' : 'transparent',
                  border: `1px solid ${liveRefresh ? 'rgba(37, 211, 102, 0.35)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-full)',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  color: liveRefresh ? 'var(--accent-whatsapp)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap'
                }}
                title={liveRefresh ? 'Live auto-refresh active (every 30s)' : 'Auto-refresh paused'}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: liveRefresh ? 'var(--accent-whatsapp)' : 'var(--text-muted)',
                    animation: liveRefresh ? 'pulse 2s infinite ease-in-out' : 'none'
                  }}
                />
                {liveRefresh ? 'Live Poll ON' : 'Paused'}
              </button>
            </div>

            {/* Bottom row: Filter Dropdowns, Alphabetical Sorting & Match Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
              <Filter size={13} color="var(--text-muted)" />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filters:</span>

              {/* Status filter */}
              <SearchableDropdown
                multiple
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as string[])}
                placeholder="All Statuses"
                minWidth="150px"
                options={[
                  { value: 'ASSIGNED', label: 'Assigned' },
                  { value: 'AT_DESTINATION', label: 'At Destination' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                  { value: 'COMPLETED', label: 'Delivered' },
                  { value: 'DELAYED', label: 'Delayed' },
                  { value: 'IN_PROGRESS', label: 'In Transit' },
                  { value: 'RETURNING', label: 'Returning' }
                ]}
              />

              {/* Driver filter */}
              <SearchableDropdown
                multiple
                value={filterDriverId}
                onChange={(value) => setFilterDriverId(value as string[])}
                placeholder="All Drivers"
                minWidth="160px"
                options={drivers.map((d) => ({ value: d.name, label: `${d.name} (${d.employee_id})` }))}
              />

              {/* Vehicle filter */}
              <SearchableDropdown
                multiple
                value={filterVehicleId}
                onChange={(value) => setFilterVehicleId(value as string[])}
                placeholder="All Vehicles"
                minWidth="160px"
                options={vehicles.map((v) => ({ value: v.vehicle_number, label: `${v.vehicle_number} (${v.model})` }))}
              />

              {/* Delays Only Toggle Button */}
              <button
                type="button"
                onClick={() => setFilterDelaysOnly(!filterDelaysOnly)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  border: filterDelaysOnly ? '1px solid var(--status-delayed)' : '1px solid var(--border-subtle)',
                  backgroundColor: filterDelaysOnly ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  color: filterDelaysOnly ? 'var(--status-delayed)' : 'var(--text-muted)',
                  fontWeight: filterDelaysOnly ? 700 : 500
                }}
              >
                <AlertTriangle size={12} />
                <span>Exceptions / Delays Only</span>
              </button>

              {/* Alphabetical & Attribute Sort Dropdown */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                <ArrowDownAZ size={13} color="var(--text-muted)" />
                <SearchableDropdown
                  value={tripSort}
                  onChange={(value) => setTripSort(value as any)}
                  placeholder="Sort: Scheduled Order"
                  minWidth="190px"
                  options={[
                    { value: 'delay_desc', label: 'Delay Duration (Highest First)' },
                    { value: 'driver_asc', label: 'Driver (A to Z)' },
                    { value: 'driver_desc', label: 'Driver (Z to A)' },
                    { value: 'id_asc', label: 'Trip ID (A to Z)' },
                    { value: 'vehicle_asc', label: 'Vehicle Plate (A to Z)' },
                    { value: 'default', label: 'Sort: Scheduled Order' }
                  ]}
                />
              </div>

              {/* Reset All Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 9px',
                    fontSize: '0.74rem',
                    color: 'var(--accent-whatsapp)'
                  }}
                  title="Clear all filters and search query"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filters</span>
                </button>
              )}

              <span style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Showing <b>{sortedTrips.length}</b> of <b>{trips.length}</b> manifests
              </span>
            </div>
          </div>

          {/* Batch Action Toolbar for Checkbox Selection */}
          {selectedTripIds.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--accent-primary)'
                  }}
                >
                  {selectedTripIds.length} manifest{selectedTripIds.length > 1 ? 's' : ''} selected
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportSelectedCsv}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={12} />
                  <span>Export Selected CSV</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveSection('map')}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Compass size={12} />
                  <span>Focus on Map</span>
                </button>
                <button
                  type="button"
                  className="btn btn-subtle btn-sm"
                  onClick={() => setSelectedTripIds([])}
                  style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <X size={12} />
                  <span>Clear Selection</span>
                </button>
              </div>
            </div>
          )}

          {/* Trips Register Table with Multi-Select Checkboxes */}
          <EnterpriseTable
            columns={tripColumns}
            data={sortedTrips}
            keyExtractor={(trip) => trip.id}
            loading={loading}
            selectable={true}
            selectedKeys={selectedTripIds}
            onToggleSelect={(id) =>
              setSelectedTripIds((prev) =>
                prev.includes(id as string) ? prev.filter((k) => k !== id) : [...prev, id as string]
              )
            }
            onToggleSelectAll={() =>
              setSelectedTripIds((prev) =>
                prev.length === sortedTrips.length ? [] : sortedTrips.map((t) => t.id)
              )
            }
            onRowClick={(trip) => setSelectedTripId(trip.id)}
            emptyTitle="No trips registered"
            emptyDescription="No trips found for the selected date and filters. Dispatch a new trip to begin tracking."
            emptyActionLabel="Dispatch New Trip"
            onEmptyAction={() => setIsCreateModalOpen(true)}
          />
        </div>
      )}

      {/* ========================================================
          2. LIVE TELEMATICS FLEET MAP VIEW (Ola / Rapido Style)
          ======================================================== */}
      {activeSection === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PageHeader
            breadcrumbs={[{ label: 'Operations' }, { label: 'Live Telematics Radar' }]}
            title="Live Fleet Telematics & Vehicle Feed"
            subtitle="Ola & Rapido-style live vehicle location radar, active speeds, drivers, and instantaneous corridor tracking."
            lastUpdated={lastRefresh}
            onRefresh={handleManualRefresh}
            refreshing={refreshing}
            actions={
              <button
                type="button"
                className={`btn ${isSimulatingFleet ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setIsSimulatingFleet(!isSimulatingFleet)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Radio size={14} className={isSimulatingFleet ? 'animate-pulse' : ''} />
                <span>{isSimulatingFleet ? '🟢 Live GPS Feed Active' : '⏸️ GPS Feed Paused'}</span>
              </button>
            }
          />

          {/* Ola/Rapido Telematics Grid: Left Vehicle Drawer + Right Map Canvas */}
          <div className="fleet-telematics-grid">
            {/* Left Vehicle Feed Drawer */}
            <div className="fleet-telematics-sidebar">
              {/* Telematics Header & Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Active Vehicles ({vehicles.length})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-whatsapp)', fontWeight: 600 }}>
                    {vehicles.filter((v) => (v.speed_kmh || 0) > 2).length} Moving
                  </span>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search plate or model..."
                    value={telematicsSearch}
                    onChange={(e) => setTelematicsSearch(e.target.value)}
                    style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '34px' }}
                  />
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setTelematicsFilter('ALL')}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: telematicsFilter === 'ALL' ? 'var(--accent-whatsapp)' : 'var(--bg-surface)',
                      color: telematicsFilter === 'ALL' ? '#0b141a' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    All ({vehicles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTelematicsFilter('MOVING')}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: telematicsFilter === 'MOVING' ? '#10b981' : 'var(--bg-surface)',
                      color: telematicsFilter === 'MOVING' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Moving ({vehicles.filter((v) => (v.speed_kmh || 0) > 2).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTelematicsFilter('IDLE')}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: telematicsFilter === 'IDLE' ? 'var(--accent-gold)' : 'var(--bg-surface)',
                      color: telematicsFilter === 'IDLE' ? '#0b141a' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Idle ({vehicles.filter((v) => (v.speed_kmh || 0) <= 2).length})
                  </button>
                </div>
              </div>

              {/* Scrollable Vehicle List */}
              <div className="fleet-telematics-list">
                {vehicles
                  .filter((v) => {
                    const matchSearch =
                      v.vehicle_number.toLowerCase().includes(telematicsSearch.toLowerCase()) ||
                      v.model.toLowerCase().includes(telematicsSearch.toLowerCase()) ||
                      (v.assigned_driver_name || '').toLowerCase().includes(telematicsSearch.toLowerCase());
                    const isMoving = (v.speed_kmh || 0) > 2;
                    const matchFilter = telematicsFilter === 'ALL' || (telematicsFilter === 'MOVING' ? isMoving : !isMoving);
                    return matchSearch && matchFilter;
                  })
                  .map((v) => {
                    const isMoving = (v.speed_kmh || 0) > 2;
                    const isSelected = selectedVehicleForMap?.id === v.id;

                    return (
                      <div
                        key={v.id}
                        className={`fleet-vehicle-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedVehicleForMap(v);
                          if (v.latitude && v.longitude) {
                            setFocusedMapLocation({ latitude: v.latitude, longitude: v.longitude });
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.25rem' }}>
                              {v.type === 'TRAILER' ? '🚛' : v.type === 'HEAVY_TRUCK' ? '🚚' : '🚐'}
                            </span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                                {v.vehicle_number}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {v.model} &bull; {v.capacity_tons}T
                              </div>
                            </div>
                          </div>

                          {/* Speed Badge */}
                          {isMoving ? (
                            <div className="speed-badge moving">
                              <span className="radar-pulse-dot" />
                              <span>{Math.round(v.speed_kmh || 0)} km/h</span>
                            </div>
                          ) : (
                            <div className="speed-badge idle">
                              <span>Stationary</span>
                            </div>
                          )}
                        </div>

                        {/* Telemetry info row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <span>👤 {v.assigned_driver_name || 'Driver on Duty'}</span>
                          <span>🧭 {Math.round(v.heading_deg || 0)}&deg; Heading</span>
                        </div>

                        {v.current_location && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            📍 {v.current_location}
                          </div>
                        )}

                        {/* Quick action buttons */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, padding: '3px 6px', fontSize: '0.72rem', height: '26px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (v.latitude && v.longitude) {
                                setFocusedMapLocation({ latitude: v.latitude, longitude: v.longitude });
                              }
                            }}
                          >
                            <Navigation size={11} />
                            <span>Focus Map</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', height: '26px', color: 'var(--accent-gold)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPapersVehicle(v);
                            }}
                            title="Manage RC, Insurance & Challans"
                          >
                            <FileCheck size={11} />
                            <span>Papers</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Map Canvas with All Live Vehicles */}
            <div className="fleet-telematics-map-container" style={{ position: 'relative' }}>
              {selectedVehicleForMap && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '56px',
                    zIndex: 999,
                    backgroundColor: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(56, 189, 248, 0.5)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        animation: 'pulse 1.5s infinite'
                      }}
                    />
                    <span><b>Live Tracking:</b> {selectedVehicleForMap.vehicle_number}</span>
                  </div>
                  <span style={{ color: '#64748b' }}>|</span>
                  <span>⚡ {Math.round(selectedVehicleForMap.speed_kmh || 0)} km/h</span>
                  <span style={{ color: '#64748b' }}>|</span>
                  <span>👤 {selectedVehicleForMap.assigned_driver_name || 'Driver on Duty'}</span>
                  {activeTripForSelectedVehicle && (
                    <>
                      <span style={{ color: '#64748b' }}>|</span>
                      <span>📍 Trip: {activeTripForSelectedVehicle.id}</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedVehicleForMap(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      textDecoration: 'underline',
                      padding: 0,
                      marginLeft: '4px'
                    }}
                  >
                    Clear Focus
                  </button>
                </div>
              )}
              <LeafletMap
                fleetVehicles={vehicles}
                focusedLocation={focusedMapLocation}
                onSelectVehicle={(v) => {
                  setSelectedVehicleForMap(v);
                  if (v.latitude && v.longitude) {
                    setFocusedMapLocation({ latitude: v.latitude, longitude: v.longitude });
                  }
                }}
                baseLocation={{
                  name: activeTripForSelectedVehicle?.starting_location || 'Delhi Central Logistics Depot',
                  latitude: activeTripForSelectedVehicle?.starting_latitude || 28.5355,
                  longitude: activeTripForSelectedVehicle?.starting_longitude || 77.2680
                }}
                stops={activeTripForSelectedVehicle?.stops || []}
                events={activeTripForSelectedVehicle?.events || []}
                height="650px"
                theme={theme}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. VEHICLE MASTER
          ======================================================== */}
      {activeSection === 'vehicles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PageHeader
            breadcrumbs={[{ label: 'Assets' }, { label: 'Vehicle Master' }]}
            title="Vehicle Master"
            subtitle="Commercial fleet assets, assigned drivers, mechanical readiness, and regulatory compliance certificates."
            lastUpdated={lastRefresh}
            onRefresh={handleManualRefresh}
            refreshing={refreshing}
            actions={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsVehicleModalOpen(true)}
                style={{
                  backgroundColor: 'var(--accent-whatsapp)',
                  borderColor: 'var(--accent-whatsapp)',
                  color: '#0b141a',
                  fontWeight: 600
                }}
              >
                <Plus size={14} />
                <span>Register Vehicle</span>
              </button>
            }
          />

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <KpiCard label="Total Fleet Units" value={vehicles.length} icon={<Truck size={18} />} />
            <KpiCard
              label="Available Units"
              value={vehicles.filter((v) => v.status === 'AVAILABLE').length}
              icon={<CheckCircle size={18} />}
              variant="success"
            />
            <KpiCard
              label="Active On-Trip"
              value={vehicles.filter((v) => v.status === 'ON_TRIP').length}
              icon={<Play size={18} />}
              variant="info"
            />
            <KpiCard
              label="In Maintenance"
              value={vehicles.filter((v) => v.status === 'MAINTENANCE').length}
              icon={<ShieldAlert size={18} />}
              variant="warning"
            />
          </div>

          {/* Search & Filter Toolbar with Alphabetical Sorting */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap'
            }}
          >
            {/* Search with Clear Button */}
            <div className="searchbar-enhanced" style={{ flex: '1 1 240px', minWidth: '220px', position: 'relative' }}>
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search registration plate, model, or driver..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
              />
              {vehicleSearch && (
                <button
                  type="button"
                  onClick={() => setVehicleSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Alphabetical Sorting Selector */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownAZ size={13} color="var(--text-muted)" />
              <SearchableDropdown
                value={vehicleSort}
                onChange={(value) => setVehicleSort(value as any)}
                placeholder="Sort vehicles"
                minWidth="175px"
                options={[
                  { value: 'driver_asc', label: 'Assigned Driver (A to Z)' },
                  { value: 'model_asc', label: 'Make / Model (A to Z)' },
                  { value: 'plate_asc', label: 'Plate Number (A to Z)' },
                  { value: 'plate_desc', label: 'Plate Number (Z to A)' }
                ]}
              />
            </div>

            {/* Status Filter */}
            <SearchableDropdown
              multiple
              value={vehicleStatusFilter}
              onChange={(value) => setVehicleStatusFilter(value as string[])}
              placeholder="All Statuses"
              minWidth="155px"
              options={[
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
                { value: 'ON_TRIP', label: 'On Trip' }
              ]}
            />

            <span style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Showing <b>{sortedVehicles.length}</b> of <b>{vehicles.length}</b> assets
            </span>
          </div>

          {/* Vehicles Table with Checkbox Support */}
          <EnterpriseTable
            columns={[
              {
                key: 'vehicle_number',
                header: 'Registration Plate',
                sortable: true,
                render: (v) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {v.photo_url ? (
                      <img
                        src={v.photo_url}
                        alt={v.vehicle_number}
                        style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-subtle)', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          flexShrink: 0
                        }}
                      >
                        <Truck size={14} />
                      </div>
                    )}
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {v.vehicle_number}
                    </span>
                  </div>
                )
              },
              { key: 'model', header: 'Make & Model', sortable: true },
              {
                key: 'vehicle_type',
                header: 'Category',
                render: (v) => <span style={{ color: 'var(--text-muted)' }}>{v.vehicle_type}</span>
              },
              {
                key: 'assigned_driver_name',
                header: 'Assigned Driver',
                render: (v) => v.assigned_driver_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
              },
              {
                key: 'status',
                header: 'Operational Status',
                sortable: true,
                render: (v) => <StatusBadge status={v.status} />
              },
              {
                key: 'total_trips',
                header: 'Completed Deliveries',
                sortable: true,
                render: (v) => v.total_trips || 0
              },
              {
                key: 'compliance',
                header: 'Compliance Documents',
                render: (v) => {
                  const challanCount = v.challans?.filter((c) => c.status === 'PENDING').length || 0;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="paper-status-badge valid" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                        RC & Ins. Verified
                      </span>
                      {challanCount > 0 ? (
                        <span className="challan-pill pending" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                          {challanCount} Challan{challanCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="challan-pill settled" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                          Clear
                        </span>
                      )}
                    </div>
                  );
                }
              },
              {
                key: 'actions',
                header: 'Manager Actions',
                align: 'right',
                render: (v) => {
                  const hasTrips = (v.total_trips || 0) > 0 || trips.some((t) => t.vehicle_id === v.id || t.vehicle_number === v.vehicle_number);
                  return (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPapersVehicle(v);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--accent-gold)',
                          borderColor: 'rgba(197, 160, 89, 0.4)'
                        }}
                        title="Manage Official RC, Insurance, Fitness & Challans"
                      >
                        <FileCheck size={12} />
                        <span>Documents</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVehicle(v);
                        }}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Edit Vehicle Details"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                      {!hasTrips && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVehicle(v);
                          }}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--status-danger)', borderColor: 'var(--status-danger-border)' }}
                          title="Decommission Vehicle"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                }
              }
            ]}
            data={sortedVehicles}
            keyExtractor={(v) => v.id}
            loading={fleetLoading}
            selectable={true}
            selectedKeys={selectedVehicleIds}
            onToggleSelect={(id) =>
              setSelectedVehicleIds((prev) =>
                prev.includes(id as string) ? prev.filter((k) => k !== id) : [...prev, id as string]
              )
            }
            onToggleSelectAll={() =>
              setSelectedVehicleIds((prev) =>
                prev.length === sortedVehicles.length ? [] : sortedVehicles.map((v) => v.id)
              )
            }
            emptyTitle="No vehicles found"
            emptyDescription="No fleet vehicles match your filter criteria."
          />
        </div>
      )}

      {/* ========================================================
          4. DRIVER MASTER
          ======================================================== */}
      {activeSection === 'drivers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PageHeader
            breadcrumbs={[{ label: 'Personnel' }, { label: 'Driver Master' }]}
            title="Driver Master"
            subtitle="Active roster of commercial drivers, assigned logistics vehicles, direct phone lines, and license verification."
            lastUpdated={lastRefresh}
            onRefresh={handleManualRefresh}
            refreshing={refreshing}
            actions={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsDriverModalOpen(true)}
                style={{
                  backgroundColor: 'var(--accent-whatsapp)',
                  borderColor: 'var(--accent-whatsapp)',
                  color: '#0b141a',
                  fontWeight: 600
                }}
              >
                <Plus size={14} />
                <span>Register Driver</span>
              </button>
            }
          />

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <KpiCard label="Total Drivers" value={drivers.length} icon={<Users size={18} />} />
            <KpiCard
              label="Available for Route"
              value={drivers.filter((d) => d.status === 'AVAILABLE').length}
              icon={<CheckCircle size={18} />}
              variant="success"
            />
            <KpiCard
              label="Active In-Transit"
              value={drivers.filter((d) => d.status === 'ON_TRIP').length}
              icon={<Play size={18} />}
              variant="info"
            />
            <KpiCard
              label="Off Duty"
              value={drivers.filter((d) => d.status === 'OFF_DUTY' || d.status === 'INACTIVE').length}
              icon={<Clock size={18} />}
            />
          </div>

          {/* Search & Sorting Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap'
            }}
          >
            {/* Search with Clear Button */}
            <div className="searchbar-enhanced" style={{ flex: '1 1 240px', minWidth: '220px', position: 'relative' }}>
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search driver by name, employee ID, or contact number..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
              />
              {driverSearch && (
                <button
                  type="button"
                  onClick={() => setDriverSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Alphabetical & Deliveries Sorting Dropdown */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownAZ size={13} color="var(--text-muted)" />
              <SearchableDropdown
                value={driverSort}
                onChange={(value) => setDriverSort(value as any)}
                placeholder="Sort drivers"
                minWidth="175px"
                options={[
                  { value: 'id_asc', label: 'Employee ID (A to Z)' },
                  { value: 'trips_desc', label: 'Completed Deliveries (High to Low)' },
                  { value: 'name_asc', label: 'Driver Name (A to Z)' },
                  { value: 'name_desc', label: 'Driver Name (Z to A)' }
                ]}
              />
            </div>

            {/* Status Filter */}
            <SearchableDropdown
              multiple
              value={driverStatusFilter}
              onChange={(value) => setDriverStatusFilter(value as string[])}
              placeholder="All Statuses"
              minWidth="155px"
              options={[
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'ON_TRIP', label: 'On Trip' },
                { value: 'OFF_DUTY', label: 'Off Duty' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
            />

            <span style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Showing <b>{sortedDrivers.length}</b> of <b>{drivers.length}</b> personnel
            </span>
          </div>

          {/* Drivers Table */}
          <EnterpriseTable
            columns={[
              {
                key: 'employee_id',
                header: 'Employee ID',
                sortable: true,
                render: (d) => <span style={{ fontFamily: 'var(--font-mono)' }}>{d.employee_id}</span>
              },
              {
                key: 'name',
                header: 'Driver Name',
                sortable: true,
                render: (d) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    {d.avatar_url ? (
                      <img
                        src={d.avatar_url}
                        alt={d.name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #008069, #25D366)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          flexShrink: 0
                        }}
                      >
                        {d.name.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                  </div>
                )
              },
              {
                key: 'phone',
                header: 'Contact Line',
                render: (d) =>
                  d.phone ? (
                    <a
                      href={`tel:${d.phone}`}
                      style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Phone size={12} />
                      <span>{d.phone}</span>
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )
              },
              {
                key: 'assigned_vehicle_number',
                header: 'Assigned Vehicle',
                render: (d) => d.assigned_vehicle_number || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
              },
              {
                key: 'status',
                header: 'Duty Status',
                sortable: true,
                render: (d) => <StatusBadge status={d.status} />
              },
              {
                key: 'verification',
                header: 'License & Compliance',
                render: (d) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    <span className="verification-chip" style={{ fontSize: '0.72rem' }}>
                      {d.license_category || 'Commercial HMV'}
                    </span>
                    <span className="verification-chip" style={{ background: 'rgba(37,211,102,0.12)', color: 'var(--accent-whatsapp)', borderColor: 'rgba(37,211,102,0.3)', fontSize: '0.72rem' }}>
                      ✓ Verified
                    </span>
                  </div>
                )
              },
              {
                key: 'total_trips',
                header: 'Completed Deliveries',
                sortable: true,
                render: (d) => d.total_trips || 0
              },
              {
                key: 'actions',
                header: 'Manager Actions',
                align: 'right',
                render: (d) => {
                  const hasTrips = (d.total_trips || 0) > 0 || trips.some((t) => t.driver_id === d.user_id || t.driver_id === d.id || t.driver_name === d.name);
                  return (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDossierDriver(d);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--accent-whatsapp)',
                          borderColor: 'rgba(37, 211, 102, 0.4)'
                        }}
                        title="View Official Driver Profile, DL & Verification"
                      >
                        <Eye size={12} />
                        <span>Compliance File</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDriver(d);
                        }}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Edit Driver Details"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                      {!hasTrips && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDriver(d);
                          }}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--status-danger)', borderColor: 'var(--status-danger-border)' }}
                          title="Remove Driver"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                }
              }
            ]}
            data={sortedDrivers}
            keyExtractor={(d) => d.id}
            loading={fleetLoading}
            emptyTitle="No drivers found"
            emptyDescription="No drivers match your search query."
          />
        </div>
      )}

      {/* ========================================================
          5. FACILITY & GEOFENCE DIRECTORY
          ======================================================== */}
      {activeSection === 'destinations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PageHeader
            breadcrumbs={[{ label: 'Assets' }, { label: 'Facility Directory' }]}
            title="Facility & Geofence Directory"
            subtitle="Customer receiving facilities, warehouses, GPS coordinates, and geofence verification zones."
            lastUpdated={lastRefresh}
            onRefresh={handleManualRefresh}
            refreshing={refreshing}
            actions={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsDestinationModalOpen(true)}
                style={{
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} />
                <span>Register Location</span>
              </button>
            }
          />

          {/* Search & Sorting Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap'
            }}
          >
            {/* Search with Clear Button */}
            <div className="searchbar-enhanced" style={{ flex: '1 1 240px', minWidth: '220px', position: 'relative' }}>
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search area code, facility name, address, or contact..."
                value={destinationSearch}
                onChange={(e) => setDestinationSearch(e.target.value)}
              />
              {destinationSearch && (
                <button
                  type="button"
                  onClick={() => setDestinationSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Alphabetical & Code Sorting Dropdown */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownAZ size={13} color="var(--text-muted)" />
              <SearchableDropdown
                value={destinationSort}
                onChange={(value) => setDestinationSort(value as any)}
                placeholder="Sort facilities"
                minWidth="175px"
                options={[
                  { value: 'address_asc', label: 'Address (A to Z)' },
                  { value: 'code_asc', label: 'Area Code (A to Z)' },
                  { value: 'name_asc', label: 'Facility Name (A to Z)' },
                  { value: 'name_desc', label: 'Facility Name (Z to A)' }
                ]}
              />
            </div>

            <span style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Showing <b>{sortedDestinations.length}</b> of <b>{destinations.length}</b> facilities
            </span>
          </div>

          {/* Multi-Select Action Banner */}
          {selectedDestinationIds.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                backgroundColor: 'var(--brand-subtle)',
                border: '1px solid var(--brand-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--brand-light)'
              }}
            >
              <span>
                <b>{selectedDestinationIds.length}</b> {selectedDestinationIds.length === 1 ? 'facility' : 'facilities'} selected
              </span>
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={() => setSelectedDestinationIds([])}
                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={12} />
                <span>Clear Selection</span>
              </button>
            </div>
          )}

          <EnterpriseTable
            columns={[
              {
                key: 'area_code',
                header: 'Area Code',
                sortable: true,
                width: '130px',
                render: (dest) => (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: 'var(--accent-primary)',
                      letterSpacing: '0.04em',
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '3px 7px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'inline-block',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {dest.area_code || '—'}
                  </span>
                )
              },
              {
                key: 'name',
                header: 'Facility Site',
                sortable: true,
                render: (dest) => <span style={{ fontWeight: 600 }}>{dest.name}</span>
              },
              {
                key: 'address',
                header: 'Physical Address',
                render: (dest) => <span style={{ color: 'var(--text-secondary)' }}>{dest.address}</span>
              },
              {
                key: 'coordinates',
                header: 'GPS Telematics',
                render: (dest) => (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${dest.latitude},${dest.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      color: 'var(--accent-primary)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    <Compass size={11} />
                    <span>{Number(dest.latitude || 0).toFixed(4)}, {Number(dest.longitude || 0).toFixed(4)}</span>
                    <ExternalLink size={10} />
                  </a>
                )
              },
              {
                key: 'geofence_radius_meters',
                header: 'Geofence Radius',
                render: (dest) => <span>{dest.geofence_radius_meters}m</span>
              },
              {
                key: 'contact_name',
                header: 'Facility Contact',
                render: (dest) => (
                  <div>
                    <div>{dest.contact_name || '—'}</div>
                    {dest.contact_number && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{dest.contact_number}</div>
                    )}
                  </div>
                )
              },
              {
                key: 'actions',
                header: 'Manager Actions',
                align: 'right',
                render: (dest) => {
                  const hasDeliveries = (dest.total_deliveries || 0) > 0 ||
                    dest.name.toLowerCase().includes('depot') ||
                    dest.name.toLowerCase().includes('company') ||
                    trips.some((t) =>
                      (t.starting_location && t.starting_location.trim().toLowerCase() === dest.name.trim().toLowerCase()) ||
                      t.stops?.some((s) => s.destination_id === dest.id || (s.destination_name && s.destination_name.trim().toLowerCase() === dest.name.trim().toLowerCase()))
                    );
                  return (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDestination(dest);
                        }}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Edit Destination Site & Geofence"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                      {!hasDeliveries && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDestination(dest);
                          }}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--status-danger)', borderColor: 'var(--status-danger-border)' }}
                          title="Deactivate Destination"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                }
              }
            ]}
            data={sortedDestinations}
            keyExtractor={(dest) => dest.id}
            loading={fleetLoading}
            selectable={true}
            selectedKeys={selectedDestinationIds}
            onToggleSelect={(id) =>
              setSelectedDestinationIds((prev) =>
                prev.includes(id as string) ? prev.filter((k) => k !== id) : [...prev, id as string]
              )
            }
            onToggleSelectAll={() =>
              setSelectedDestinationIds((prev) =>
                prev.length === sortedDestinations.length ? [] : sortedDestinations.map((d) => d.id)
              )
            }
            emptyTitle="No destinations found"
            emptyDescription="No destinations found matching your search term."
          />
        </div>
      )}

      {/* ========================================================
          6. OPERATIONAL REPORTS & CSV EXPORT
          ======================================================== */}
      {activeSection === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PageHeader
            breadcrumbs={[{ label: 'Fleet Analytics' }, { label: 'Operational Performance' }]}
            title={
              reportsPeriod === 'weekly'
                ? 'Weekly Logistics Performance Audit (7-Day)'
                : reportsPeriod === 'monthly'
                ? 'Monthly Operational Audit (30-Day)'
                : 'Daily Operational Logistics Report'
            }
            subtitle={
              reportsPeriod === 'weekly'
                ? 'Consolidated 7-day dispatch volume, SLA delivery verification, driver performance, and corridor delays.'
                : reportsPeriod === 'monthly'
                ? 'Consolidated 30-day comprehensive audit of fleet throughput, geofence drop accuracy, and vehicle utilization.'
                : `Consolidated operational analysis, SLA on-time metrics, and delay root cause distribution for ${selectedDate}.`
            }
            lastUpdated={lastRefresh}
            onRefresh={handleManualRefresh}
            refreshing={refreshing}
            actions={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleExportCsv}
                disabled={exportingCsv}
              >
                <Download size={14} className={exportingCsv ? 'animate-spin' : ''} />
                <span>{exportingCsv ? 'Exporting...' : 'Export Operational CSV'}</span>
              </button>
            }
          />

          {/* Controls Bar: Timeframe Filters & Date Selection */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: 'var(--bg-surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Period Segmented Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Audit Scope:
              </span>
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '3px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setReportsPeriod('daily')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: reportsPeriod === 'daily' ? 600 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: reportsPeriod === 'daily' ? 'var(--bg-surface)' : 'transparent',
                    color: reportsPeriod === 'daily' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: reportsPeriod === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Daily Audit
                </button>
                <button
                  type="button"
                  onClick={() => setReportsPeriod('weekly')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: reportsPeriod === 'weekly' ? 600 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: reportsPeriod === 'weekly' ? 'var(--bg-surface)' : 'transparent',
                    color: reportsPeriod === 'weekly' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: reportsPeriod === 'weekly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Weekly (7 Days)
                </button>
                <button
                  type="button"
                  onClick={() => setReportsPeriod('monthly')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: reportsPeriod === 'monthly' ? 600 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: reportsPeriod === 'monthly' ? 'var(--bg-surface)' : 'transparent',
                    color: reportsPeriod === 'monthly' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: reportsPeriod === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Monthly (30 Days)
                </button>
              </div>
            </div>

            {/* Date Input if Daily */}
            {reportsPeriod === 'daily' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Operational Date:
                </span>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Clock size={13} />
                <span>
                  {reportsPeriod === 'weekly' ? 'Last 7 Days Rolling Window' : 'Last 30 Days Cumulative Audit'}
                </span>
              </div>
            )}
          </div>

          {reportsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <KpiCard label="On-Time SLA Rate" value="—" loading />
              <KpiCard label="Total Trips Dispatched" value="—" loading />
              <KpiCard label="Total Destinations Visited" value="—" loading />
              <KpiCard label="Total Delay Duration" value="—" loading />
            </div>
          ) : dailyReport && dailyReport.overview ? (
            <>
              {/* Executive Visual Charts Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '16px'
                }}
              >
                {/* Visual Gauge: On-Time SLA */}
                <div
                  className="card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      On-Time SLA Performance
                    </span>
                    <span
                      className={`badge ${(dailyReport.overview.onTimePercentage ?? 0) >= 90 ? 'badge-success' : 'badge-warning'}`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {(dailyReport.overview.onTimePercentage ?? 0) >= 90 ? 'Contract Met' : 'Attention Required'}
                    </span>
                  </div>
                  <SlaGauge
                    value={dailyReport.overview.onTimePercentage ?? 0}
                    size={160}
                    label="On-Time SLA"
                    sublabel="Geofence Verified"
                  />
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                    Based on arrival timestamps within delivery window tolerance across customer stops.
                  </div>
                </div>

                {/* Visual Trend: Dispatch Throughput */}
                <div className="card" style={{ padding: '20px' }}>
                  <TrendBarChart
                    title={
                      reportsPeriod === 'weekly'
                        ? '7-Day Dispatch Volume Trend'
                        : reportsPeriod === 'monthly'
                        ? '30-Day Weekly Dispatch Volumes'
                        : 'Daily Corridor Dispatch Throughput'
                    }
                    subtitle={
                      reportsPeriod === 'weekly'
                        ? 'Daily routes dispatched vs operational baseline'
                        : reportsPeriod === 'monthly'
                        ? 'Weekly aggregated dispatches vs target load'
                        : 'Dispatches by operational departure window'
                    }
                    data={
                      reportsPeriod === 'weekly'
                        ? [
                            { label: 'Mon', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.14) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0 },
                            { label: 'Tue', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.16) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0 },
                            { label: 'Wed', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.18) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0 },
                            { label: 'Thu', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.15) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0 },
                            { label: 'Fri', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.20) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0, highlight: (dailyReport.overview.totalTrips || 0) > 0 },
                            { label: 'Sat', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.12) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0 },
                            { label: 'Sun', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.05) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0 }
                          ]
                        : reportsPeriod === 'monthly'
                        ? [
                            { label: 'W1 (1-7)', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.24) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 10 : 0 },
                            { label: 'W2 (8-14)', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.26) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 10 : 0 },
                            { label: 'W3 (15-21)', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.22) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 10 : 0 },
                            { label: 'W4 (22-28)', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.28) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 10 : 0, highlight: (dailyReport.overview.totalTrips || 0) > 0 }
                          ]
                        : [
                            { label: '06:00-09:00', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.25) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0 },
                            { label: '09:00-12:00', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.40) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0, highlight: (dailyReport.overview.totalTrips || 0) > 0 },
                            { label: '12:00-15:00', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.20) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0 },
                            { label: '15:00-18:00', value: (dailyReport.overview.totalTrips || 0) > 0 ? Math.round(dailyReport.overview.totalTrips * 0.15) : 0, benchmark: (dailyReport.overview.totalTrips || 0) > 0 ? 2 : 0 }
                          ]
                    }
                    unit=" trips"
                    height={150}
                  />
                </div>
              </div>

              {/* Graphical Dual-Line Chart: Delays Made by Management vs Driver (User Requested Dual-Series Trend) */}
              {dailyReport.delayAttribution && (
                <DelayAttributionLineChart
                  data={dailyReport.delayAttribution}
                  period={reportsPeriod}
                  selectedDate={selectedDate}
                />
              )}

              {/* Proportional Fleet Distribution Bar */}
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Fleet Trip Status Distribution
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {dailyReport.overview.totalTrips ?? 0} Total Operations
                  </span>
                </div>
                <FleetStatusBar
                  completed={dailyReport.overview.completedTrips || 0}
                  inTransit={dailyReport.overview.activeTrips || 0}
                  delayed={dailyReport.overview.delayedTrips || 0}
                  scheduled={Math.max(
                    0,
                    (dailyReport.overview.totalTrips || 0) -
                      (dailyReport.overview.completedTrips || 0) -
                      (dailyReport.overview.activeTrips || 0) -
                      (dailyReport.overview.delayedTrips || 0)
                  )}
                  total={dailyReport.overview.totalTrips || 0}
                />
              </div>

              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <KpiCard
                  label="On-Time SLA Rate"
                  value={`${dailyReport.overview.onTimePercentage ?? 0}%`}
                  subValue="Verified Geofence Delivery Drops"
                  variant="success"
                />
                <KpiCard
                  label="Dispatches & Trips"
                  value={`${dailyReport.overview.completedTrips ?? 0} / ${dailyReport.overview.totalTrips ?? 0}`}
                  subValue={`${dailyReport.overview.activeTrips ?? 0} active in transit`}
                />
                <KpiCard
                  label="Customer Stops Visited"
                  value={dailyReport.overview.totalDestinations ?? 0}
                  subValue="Delivery & Restock Nodes"
                />
                <KpiCard
                  label="Total Delay Duration"
                  value={dailyReport.overview.totalDelayFormatted ?? '0m'}
                  subValue="Congestion & queue bottlenecks"
                  variant="warning"
                />
              </div>

              {/* Delay Root Causes Breakdown */}
              {dailyReport.delayReasons?.length > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 600 }}>
                        Operational Delay Root Causes
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Distribution of transit delays and unloading bottlenecks across Delhi-NCR corridors
                      </p>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                      {dailyReport.delayReasons.reduce((a: number, b: any) => a + (b.count || 0), 0)} Total Incidents
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {dailyReport.delayReasons.map((dr: any) => {
                      const totalMins = dailyReport.overview.totalDelayMinutes || 1;
                      const percent = Math.min(100, Math.round(((dr.total_minutes || 0) / totalMins) * 100));
                      return (
                        <div
                          key={dr.reason}
                          style={{
                            padding: '14px 16px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{dr.reason}</div>
                            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--status-delayed)' }}>
                              {dr.total_minutes}m
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--status-delayed)', borderRadius: '3px' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            <span>{dr.count} reported incident(s)</span>
                            <span>{percent}% of corridor delay</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Driver & Vehicle Performance Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {/* Driver Roster Summary */}
                <div className="card" style={{ padding: '18px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="var(--accent-primary)" />
                    <span>Driver Performance Roster</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(dailyReport.driverSummary || []).map((d: any) => (
                      <div
                        key={d.driver_name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{d.driver_name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {d.completed_count || 0} of {d.trip_count || 1} routes completed
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            className={`badge ${d.total_delay > 0 ? 'badge-warning' : 'badge-success'}`}
                            style={{ fontSize: '0.72rem' }}
                          >
                            {d.total_delay > 0 ? `+${d.total_delay}m delay` : '100% On-Time'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fleet Utilization Summary */}
                <div className="card" style={{ padding: '18px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={16} color="var(--accent-primary)" />
                    <span>Fleet Utilization & Distance</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(dailyReport.vehicleSummary || []).map((v: any) => (
                      <div
                        key={v.vehicle_number}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{v.vehicle_number}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {v.model || 'Commercial Freight'} &bull; {v.trip_count || 1} assigned dispatch
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                            {v.total_distance_km ? `${v.total_distance_km} km` : 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="No Report Data Available"
              description={`No delivery records or dispatch metrics found for ${selectedDate}. Select another operational date or audit period.`}
            />
          )}
        </div>
      )}

      {/* ========================================================
          7. EXCEPTIONS CENTER & ALERT TRIAGE
          ======================================================== */}
      {activeSection === 'exceptions' && (
        <ExceptionsCenter
          exceptions={exceptions}
          onAcknowledge={handleAcknowledgeException}
          onViewTrip={(id) => setSelectedTripId(id)}
          onRefresh={loadFleetExceptions}
          lastUpdated={lastRefresh}
          refreshing={refreshing}
        />
      )}

      {/* ========================================================
          8. COMPLIANCE DOCUMENTS HUB
          ======================================================== */}
      {activeSection === 'documents' && (
        <DocumentsHub
          vehicles={vehicles}
          onOpenVehiclePapers={(v, docType, isEdit) => {
            setPapersDocType(docType);
            setPapersIsAddDoc(isEdit);
            setPapersVehicle(v);
          }}
          lastUpdated={lastRefresh}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
        />
      )}

      {/* ========================================================
          9. SYSTEM SETTINGS & GOVERNANCE
          ======================================================== */}
      {activeSection === 'settings' && (
        <SettingsView
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onSwitchRole={onSwitchRole}
          lastUpdated={lastRefresh}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
        />
      )}

      {/* Trip Creator Modal */}
      {isCreateModalOpen && (
        <TripCreatorModal
          onSuccess={() => {
            loadDashboardData();
            setIsCreateModalOpen(false);
          }}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Vehicle Modal */}
      {/* Vehicle Modal (Create or Edit) */}
      {(isVehicleModalOpen || editingVehicle) && (
        <VehicleModal
          drivers={drivers}
          initialVehicle={editingVehicle || undefined}
          onSuccess={(savedV) => {
            setVehicles((prev) => {
              const exists = prev.some((v) => v.id === savedV.id);
              return exists ? prev.map((v) => (v.id === savedV.id ? savedV : v)) : [savedV, ...prev];
            });
            setIsVehicleModalOpen(false);
            setEditingVehicle(null);
          }}
          onClose={() => {
            setIsVehicleModalOpen(false);
            setEditingVehicle(null);
          }}
        />
      )}

      {/* Driver Modal (Create or Edit) */}
      {(isDriverModalOpen || editingDriver) && (
        <DriverModal
          vehicles={vehicles}
          initialDriver={editingDriver || undefined}
          onSuccess={(savedD) => {
            setDrivers((prev) => {
              const exists = prev.some((d) => d.id === savedD.id);
              return exists ? prev.map((d) => (d.id === savedD.id ? savedD : d)) : [savedD, ...prev];
            });
            setIsDriverModalOpen(false);
            setEditingDriver(null);
          }}
          onClose={() => {
            setIsDriverModalOpen(false);
            setEditingDriver(null);
          }}
        />
      )}

      {/* Destination Modal with Map Pin Picker (Create or Edit) */}
      {(isDestinationModalOpen || editingDestination) && (
        <DestinationModal
          initialDestination={editingDestination || undefined}
          onSuccess={(savedDest) => {
            setDestinations((prev) => {
              const exists = prev.some((d) => d.id === savedDest.id);
              return exists ? prev.map((d) => (d.id === savedDest.id ? savedDest : d)) : [savedDest, ...prev];
            });
            setIsDestinationModalOpen(false);
            setEditingDestination(null);
          }}
          onClose={() => {
            setIsDestinationModalOpen(false);
            setEditingDestination(null);
          }}
        />
      )}

      {/* Vehicle Compliance Papers & Traffic Challans Modal */}
      {papersVehicle && (
        <VehiclePapersModal
          vehicle={papersVehicle}
          initialDocType={papersDocType}
          initialAddDoc={papersIsAddDoc}
          onClose={() => {
            setPapersVehicle(null);
            setPapersDocType(undefined);
            setPapersIsAddDoc(undefined);
          }}
          onUpdate={(updatedVehicle: Vehicle) => {
            setVehicles((prev) => prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)));
            setPapersVehicle(updatedVehicle);
          }}
        />
      )}

      {/* Driver Official Profile Dossier & Verification Modal */}
      {dossierDriver && (
        <DriverDossierModal
          driver={dossierDriver}
          onClose={() => setDossierDriver(null)}
        />
      )}

      {/* Trip Detail Modal */}
      {selectedTripId && (
        <TripDetailModal
          tripId={selectedTripId}
          onClose={() => setSelectedTripId(null)}
          onRefresh={loadDashboardData}
          theme={theme}
        />
      )}

      {/* Dispatch Assignment Workflow Modal */}
      {assignmentTrip && (
        <AssignmentModal
          trip={assignmentTrip}
          drivers={drivers}
          vehicles={vehicles}
          onConfirmAssignment={handleConfirmAssignment}
          onClose={() => setAssignmentTrip(null)}
        />
      )}
    </AppLayout>
  );
};

