import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
  Camera,
  LogOut,
  Navigation,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  WifiOff,
  Wifi,
  Smartphone,
  Plus,
  ExternalLink,
  Radio,
  FileText,
  X,
  Phone,
  Info
} from 'lucide-react';
import { api, getCurrentGpsPosition } from '../services/api';
import { Trip, TripStop, User, Destination, Vehicle } from '../types';
import { CameraModal } from '../components/CameraModal';
import { DelayModal } from '../components/DelayModal';
import { AddCustomStopModal } from '../components/AddCustomStopModal';
import { VehiclePapersModal } from '../components/VehiclePapersModal';
import { LeafletMap } from '../components/LeafletMap';
import { offlineQueue } from '../services/offlineQueue';

// Modular Driver-First Components
import { BottomNavigation, DriverTab } from '../components/driver/BottomNavigation';
import { DriverHeader } from '../components/driver/DriverHeader';
import { CurrentTripCard } from '../components/driver/CurrentTripCard';
import { QuickActionGrid } from '../components/driver/QuickActionGrid';
import { StatusBanner } from '../components/driver/StatusBanner';
import { TripTimeline } from '../components/driver/TripTimeline';
import { StopWorkflowCard } from '../components/driver/StopWorkflowCard';
import { FloatingNavigationCard } from '../components/driver/FloatingNavigationCard';
import { EmergencyScreen } from '../components/driver/EmergencyScreen';
import { MoreScreen } from '../components/driver/MoreScreen';
import { HoseXpertsLogo } from '../components/common/HoseXpertsLogo';
import { DriverLanguageProvider, useDriverLanguage } from '../context/DriverLanguageContext';

interface Props {
  currentUser: User;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSwitchRole?: (role: 'DRIVER' | 'MANAGER') => void;
}

// Mathematical Haversine Distance in Kilometers
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Estimated Reaching Time based on Urban Logistics Speed (avg 28 km/h ~ 0.47 km/min)
function estimateReachingTimeMinutes(distanceKm: number): number {
  return Math.max(3, Math.round(distanceKm / 0.47));
}

const DriverViewInner: React.FC<Props> = ({
  currentUser,
  onLogout,
  theme = 'dark',
  onToggleTheme,
  onSwitchRole
}) => {
  const { t } = useDriverLanguage();

  // Navigation tab state: 'home' | 'trip' | 'map' | 'emergency' | 'more'
  const [activeTab, setActiveTab] = useState<DriverTab>('home');

  // Track responsive desktop breakpoint (>=1024px) for full Operations Control Tower
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Selected stop for progressive workflow (null = show timeline list)
  const [selectedStopForWorkflow, setSelectedStopForWorkflow] = useState<TripStop | null>(null);

  // Trips and assignment state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [geofenceFeedback, setGeofenceFeedback] = useState<string | null>(null);

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDelayOpen, setIsDelayOpen] = useState(false);
  const [isCustomStopOpen, setIsCustomStopOpen] = useState(false);
  const [isVehiclePapersOpen, setIsVehiclePapersOpen] = useState(false);
  const [isVehicleInfoOpen, setIsVehicleInfoOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationToastOpen, setIsNotificationToastOpen] = useState(false);

  // Offline and network state
  const [offlineCount, setOfflineCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isRealGps, setIsRealGps] = useState(false);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  // Fleet destinations for area codes and radar
  const [fleetDestinations, setFleetDestinations] = useState<Destination[]>([]);
  // Fleet vehicles state for vehicle info and official papers
  const [fleetVehicles, setFleetVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    api.fleet.getDestinations().then((res: any) => {
      if (res?.destinations) setFleetDestinations(res.destinations);
    }).catch(() => {});

    api.fleet.getVehicles().then((res: any) => {
      if (res?.vehicles) setFleetVehicles(res.vehicles);
    }).catch(() => {});
  }, []);

  // Driver GPS coordinates state
  const [driverCoords, setDriverCoords] = useState<{ latitude: number; longitude: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('tt_last_real_gps');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.latitude && parsed.longitude) {
            return { latitude: parsed.latitude, longitude: parsed.longitude };
          }
        }
      } catch {}
    }
    return { latitude: 28.5355, longitude: 77.2680 };
  });

  // Current active stop
  const currentStop: TripStop | undefined = activeTrip?.stops?.find(
    (s) => s.status === 'PENDING' || s.status === 'ARRIVED' || s.status === 'IN_PROGRESS'
  );

  // Active unresolved delay if any
  const activeDelay = activeTrip?.delays?.find((d) => !d.is_resolved);

  // Area code lookup
  const getStopAreaCode = (stop: TripStop): string | undefined => {
    if (stop.area_code) return stop.area_code;
    const match = fleetDestinations.find(
      (d) => d.id === stop.destination_id || d.name.toLowerCase() === stop.destination_name.toLowerCase()
    );
    return match?.area_code;
  };

  // Distance helper from current driver location
  const calculateDistanceKm = (lat: number, lon: number): number | null => {
    if (!driverCoords) return null;
    return calculateHaversineDistanceKm(driverCoords.latitude, driverCoords.longitude, lat, lon);
  };

  // Active GPS refresh action
  const handleRefreshGps = async () => {
    setIsRefreshingGps(true);
    try {
      const fix = await getCurrentGpsPosition({ timeoutMs: 9000, preferHighAccuracy: true });
      if (fix.latitude && fix.longitude) {
        setDriverCoords({ latitude: fix.latitude, longitude: fix.longitude });
        setGpsAccuracy(fix.gps_accuracy);
        setIsRealGps(fix.isReal);
        setGeofenceFeedback(
          fix.isReal
            ? `Live GPS Acquired: ${Number(fix.latitude || 0).toFixed(4)}°, ${Number(fix.longitude || 0).toFixed(4)}° (±${fix.gps_accuracy}m)`
            : (fix.error || 'Using route corridor position')
        );
        setTimeout(() => setGeofenceFeedback(null), 4000);
      }
    } finally {
      setIsRefreshingGps(false);
    }
  };

  // GPS watcher
  useEffect(() => {
    getCurrentGpsPosition({ timeoutMs: 5000 })
      .then((fix) => {
        if (fix.isReal && fix.latitude && fix.longitude) {
          setDriverCoords({ latitude: fix.latitude, longitude: fix.longitude });
          setGpsAccuracy(fix.gps_accuracy);
          setIsRealGps(true);
        }
      })
      .catch(() => {});

    let watchId: number | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setIsRealGps(true);
          setDriverCoords({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6))
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Initial data loading
  useEffect(() => {
    loadTodayTrips();

    api.fleet.getDestinations().then((res) => {
      if (res?.destinations && res.destinations.length > 0) {
        setFleetDestinations(res.destinations);
      }
    }).catch(() => {});

    const unsubscribeQueue = offlineQueue.subscribe((count) => {
      setOfflineCount(count);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribeQueue();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Live GPS Telemetry heartbeat to backend while on active route
  useEffect(() => {
    if (!activeTrip || !['IN_PROGRESS', 'RETURNING', 'AT_DESTINATION'].includes(activeTrip.status)) return;
    if (!driverCoords || !isOnline) return;

    // Send an immediate telemetry ping on status change or mount
    api.driver.sendTelemetry(activeTrip.id, {
      latitude: driverCoords.latitude,
      longitude: driverCoords.longitude,
      gps_accuracy: gpsAccuracy ?? undefined,
      speed_kmh: 42
    }).catch(() => {});

    // Periodic heartbeat every 15 seconds
    const interval = setInterval(() => {
      api.driver.sendTelemetry(activeTrip.id, {
        latitude: driverCoords.latitude,
        longitude: driverCoords.longitude,
        gps_accuracy: gpsAccuracy ?? undefined,
        speed_kmh: 42
      }).catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTrip?.id, activeTrip?.status, driverCoords?.latitude, driverCoords?.longitude, isOnline, gpsAccuracy]);

  const loadTodayTrips = async () => {
    setLoading(true);
    try {
      const activeRes = await api.driver.getActiveTrip();
      if (activeRes.trip) {
        setActiveTrip(activeRes.trip);
        api.driver.getTodayTrips().then((data) => setTrips(data.trips)).catch(() => {});
        return;
      }

      const data = await api.driver.getTodayTrips();
      setTrips(data.trips);
      if (data.trips.length > 0) {
        loadTripDetails(data.trips[0].id);
      } else {
        setActiveTrip(null);
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTripDetails = async (tripId: string) => {
    try {
      const data = await api.driver.getTrip(tripId);
      setActiveTrip(data.trip);
      // Keep selected stop in sync
      setSelectedStopForWorkflow((prev) => {
        if (!prev) return prev;
        const refreshed = data.trip?.stops?.find((s: TripStop) => s.id === prev.id);
        return refreshed || prev;
      });
    } catch (err) {
      console.error('Failed to load trip details:', err);
    }
  };

  // ==========================================
  // ACTION HANDLERS (Preserving existing logic)
  // ==========================================

  const handleStartTrip = async () => {
    if (!activeTrip) return;
    setActionLoading(true);
    try {
      const coords = await getCurrentGpsPosition();
      await api.driver.startTrip(activeTrip.id, coords);
      await loadTripDetails(activeTrip.id);
    } catch (err: any) {
      alert(err.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArriveAtStop = async () => {
    const targetStop = selectedStopForWorkflow || currentStop;
    if (!activeTrip || !targetStop) return;
    setActionLoading(true);
    setGeofenceFeedback(null);
    try {
      const coords = await getCurrentGpsPosition();
      const res = await api.driver.arriveStop(activeTrip.id, targetStop.id, coords);
      if (res.geofence) {
        setGeofenceFeedback(res.geofence.message);
      }
      await loadTripDetails(activeTrip.id);
    } catch (err: any) {
      alert(err.message || 'Failed to record arrival');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteActivity = async () => {
    const targetStop = selectedStopForWorkflow || currentStop;
    if (!activeTrip || !targetStop) return;
    setActionLoading(true);
    try {
      await api.driver.completeActivity(activeTrip.id, targetStop.id, {
        activity_type: 'Delivery',
        status: 'COMPLETED',
        notes: 'Standard POD delivery completed'
      });
      await loadTripDetails(activeTrip.id);
    } catch (err: any) {
      alert(err.message || 'Failed to complete activity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDepartStop = async () => {
    const targetStop = selectedStopForWorkflow || currentStop;
    if (!activeTrip || !targetStop) return;
    setActionLoading(true);
    try {
      const coords = await getCurrentGpsPosition();
      await api.driver.departStop(activeTrip.id, targetStop.id, coords);
      setGeofenceFeedback(null);
      await loadTripDetails(activeTrip.id);
      setSelectedStopForWorkflow(null); // return to timeline after departing
    } catch (err: any) {
      alert(err.message || 'Failed to record departure');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!activeTrip) return;
    if (!window.confirm('All scheduled stops are delivered. Complete and close this trip?')) return;
    setActionLoading(true);
    try {
      const coords = await getCurrentGpsPosition().catch(() => ({}));
      await api.driver.completeTrip(activeTrip.id, coords);
      alert('Trip completed successfully! Have a safe rest of your day.');
      setActiveTrip(null);
      setSelectedStopForWorkflow(null);
      await loadTodayTrips();
    } catch (err: any) {
      alert(err.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDeliveredProgressive = async () => {
    const targetStop = selectedStopForWorkflow || currentStop;
    if (!activeTrip || !targetStop) return;
    setActionLoading(true);
    try {
      // Step 1: Complete activity and POD record on backend
      await api.driver.completeActivity(activeTrip.id, targetStop.id, {
        activity_type: 'Delivery',
        status: 'COMPLETED',
        notes: 'Standard POD delivery completed'
      });
      // Step 2: Record departure safely after activity completion confirms
      const coords = await getCurrentGpsPosition();
      await api.driver.departStop(activeTrip.id, targetStop.id, coords);
      setGeofenceFeedback(null);
      await loadTripDetails(activeTrip.id);
      setSelectedStopForWorkflow(null); // return to timeline after departing

      // Check if all stops are now completed
      const updatedTripRes = await api.driver.getTrip(activeTrip.id).catch(() => null);
      if (updatedTripRes?.trip) {
        const remainingStops = updatedTripRes.trip.stops?.filter((s: TripStop) => s.status !== 'COMPLETED') || [];
        if (remainingStops.length === 0) {
          if (window.confirm('All stops for this trip are completed! Would you like to finish and close the trip now?')) {
            const finishCoords = await getCurrentGpsPosition().catch(() => ({}));
            await api.driver.completeTrip(activeTrip.id, finishCoords);
            alert('Trip completed successfully!');
            setActiveTrip(null);
            await loadTodayTrips();
          }
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete stop delivery. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDelay = async () => {
    if (!activeTrip || !activeDelay) return;
    setActionLoading(true);
    try {
      await api.driver.resolveDelay(activeTrip.id, activeDelay.id);
      await loadTripDetails(activeTrip.id);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve delay');
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve vehicle object for VehiclePapersModal from live fleet database
  const vehicleForModal: Vehicle = useMemo(() => {
    if (activeTrip?.vehicle_id && fleetVehicles.length > 0) {
      const match = fleetVehicles.find((v) => v.id === activeTrip.vehicle_id || v.vehicle_number === activeTrip.vehicle_number);
      if (match) return match;
    }
    if (activeTrip?.vehicle_number) {
      const match = fleetVehicles.find((v) => v.vehicle_number === activeTrip.vehicle_number);
      if (match) return match;
      return {
        id: activeTrip.vehicle_id || 'unassigned',
        vehicle_number: activeTrip.vehicle_number,
        vehicle_type: 'TRUCK',
        model: activeTrip.vehicle_model || 'Commercial Fleet Vehicle',
        status: (activeTrip.status as any) || 'AVAILABLE',
        documents: [],
        challans: []
      };
    }
    return {
      id: 'unassigned',
      vehicle_number: 'Unassigned',
      vehicle_type: 'TRUCK',
      model: 'No Vehicle Assigned',
      status: 'AVAILABLE',
      documents: [],
      challans: []
    };
  }, [activeTrip, fleetVehicles]);

  // Next stop calculation for Map & Floating Navigation
  const targetNextStop = selectedStopForWorkflow || currentStop;
  const nextStopDistance = targetNextStop?.latitude && targetNextStop?.longitude
    ? calculateDistanceKm(targetNextStop.latitude, targetNextStop.longitude)
    : null;
  const nextStopEta = nextStopDistance !== null ? estimateReachingTimeMinutes(nextStopDistance) : null;

  if (loading && !activeTrip && trips.length === 0) {
    return (
      <div
        className="driver-theme-root"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          padding: '24px',
          backgroundColor: 'var(--driver-bg, #0B101B)'
        }}
      >
        <div
          style={{
            padding: '14px 26px',
            background: 'var(--driver-card-bg, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--driver-card-border, rgba(255, 255, 255, 0.1))',
            borderRadius: '16px',
            boxShadow: '0 15px 35px -10px rgba(0,0,0,0.6), 0 0 24px rgba(23,100,168,0.2)',
            animation: 'hxPulse 2.2s infinite ease-in-out'
          }}
        >
          <HoseXpertsLogo variant={theme === 'dark' ? 'white' : 'blue'} height={48} showTagline={true} />
        </div>
        <div
          style={{
            width: '160px',
            height: '4px',
            backgroundColor: 'var(--driver-card-border, rgba(255,255,255,0.1))',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: '50px',
              height: '100%',
              backgroundColor: '#1764A8',
              borderRadius: '9999px',
              animation: 'hxSlide 1.2s infinite ease-in-out'
            }}
          />
        </div>
        <div style={{ color: 'var(--driver-text-secondary, #94a3b8)', fontSize: '0.84rem', fontWeight: 600 }}>
          {t.loading || 'Loading driver workflow...'}
        </div>
        <style>{`
          @keyframes hxPulse { 0%, 100% { opacity: 0.9; transform: scale(1); } 50% { opacity: 1; transform: scale(1.025); } }
          @keyframes hxSlide { 0% { transform: translateX(-50px); } 100% { transform: translateX(160px); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="driver-theme-root">
      {/* Top Driver In-Cab Bar for Tablet & Desktop Screens */}
      {isDesktop && (
        <header
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--driver-card-bg)',
            borderBottom: '1px solid var(--driver-card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <HoseXpertsLogo variant={theme === 'dark' ? 'white' : 'blue'} height={28} />
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(23, 100, 168, 0.12)',
                color: 'var(--driver-primary)',
                fontSize: '0.74rem',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}
            >
              Commercial Driver Terminal
            </span>
          </div>

          {/* Desktop Driver Navigation Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'home' as DriverTab, label: 'Home' },
              { id: 'trip' as DriverTab, label: 'Trip & Stops' },
              { id: 'map' as DriverTab, label: 'Route Map' },
              { id: 'more' as DriverTab, label: 'Vehicle Papers & Menu' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'trip') setSelectedStopForWorkflow(null);
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? 'var(--driver-primary)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--driver-text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Driver Identity & Vehicle Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--driver-text-primary)' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                Assigned Truck: <strong style={{ color: 'var(--driver-primary)' }}>{activeTrip?.vehicle_number || 'Unassigned'}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '5px 12px' }}
            >
              Logout
            </button>
          </div>
        </header>
      )}

      {/* Main Content Workspace */}
      <div style={{ display: 'flex', minHeight: isDesktop ? 'calc(100vh - 60px)' : '100vh', justifyContent: 'center' }}>
        <main
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            padding: activeTab === 'map' ? '0' : isDesktop ? '24px 20px 40px' : '12px 14px 90px',
            width: '100%',
            height: activeTab === 'map' ? '100%' : 'auto',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              maxWidth: activeTab === 'map' ? '100%' : '640px',
              width: '100%',
              height: activeTab === 'map' ? '100%' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: activeTab === 'map' ? '0' : '16px'
            }}
          >
            {/* TAB 1: HOME SCREEN (Consistent Driver Identity & Route Actions) */}
            {activeTab === 'home' && (
              <>
                <DriverHeader
                  currentUser={currentUser}
                  vehicleNumber={activeTrip?.vehicle_number}
                  gpsAccuracy={gpsAccuracy}
                  isRealGps={isRealGps}
                  isRefreshingGps={isRefreshingGps}
                  onRefreshGps={handleRefreshGps}
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  onOpenNotifications={() => setIsNotificationToastOpen(true)}
                  isDesktop={isDesktop}
                />

                {/* Status Alert Banner */}
                <StatusBanner
                  activeDelay={activeDelay}
                  onViewDelay={() => setIsDelayOpen(true)}
                  isOnline={isOnline}
                  offlineCount={offlineCount}
                  onSyncNow={() => offlineQueue.processQueue()}
                />

                {/* Geofence feedback alert if active */}
                {geofenceFeedback && (
                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: geofenceFeedback.includes('Verified')
                        ? 'var(--driver-success-bg)'
                        : 'var(--driver-warning-bg)',
                      border: `1px solid ${
                        geofenceFeedback.includes('Verified')
                          ? 'var(--driver-success-border)'
                          : 'var(--driver-warning-border)'
                      }`,
                      borderRadius: '14px',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: geofenceFeedback.includes('Verified')
                        ? 'var(--driver-success)'
                        : 'var(--driver-warning)',
                      fontWeight: 600
                    }}
                  >
                    <ShieldCheck size={18} />
                    <span>{geofenceFeedback}</span>
                  </div>
                )}

                {/* Hero Current Trip Card */}
                <CurrentTripCard
                  trip={activeTrip}
                  onViewTripDetails={() => setActiveTab('trip')}
                  onStartTrip={handleStartTrip}
                  onCompleteTrip={handleCompleteTrip}
                  actionLoading={actionLoading}
                />

                {/* 2x2 Quick Actions */}
                <QuickActionGrid
                  onOpenTrip={() => setActiveTab('trip')}
                  onOpenPapers={() => setIsVehiclePapersOpen(true)}
                  onOpenEmergency={() => setActiveTab('emergency')}
                  onOpenSupport={() => setIsHelpOpen(true)}
                  driverCoords={driverCoords}
                />

                {/* Active Stop Quick Preview Card (if travelling) */}
                {currentStop && (
                  <div
                    onClick={() => {
                      setSelectedStopForWorkflow(currentStop);
                      setActiveTab('trip');
                    }}
                    className="driver-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderLeft: '4px solid var(--driver-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: 'var(--driver-primary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em'
                          }}
                        >
                          NEXT DESTINATION
                        </span>
                        {nextStopDistance !== null && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: 'var(--driver-text-muted)',
                              backgroundColor: 'var(--driver-bg)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            ~{nextStopDistance} km • {nextStopEta}m
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: 'var(--driver-text-primary)',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {currentStop.destination_name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--driver-text-secondary)',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {currentStop.address}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('map');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(23, 100, 168, 0.1)',
                          color: 'var(--driver-primary)',
                          border: 'none',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <MapPin size={13} />
                        <span>Map</span>
                      </button>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: 'var(--driver-primary)',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      >
                        <span>Deliver</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: TRIP SCREEN */}
            {activeTab === 'trip' && (
              <>
                {selectedStopForWorkflow ? (
                  /* Progressive State Machine View for Selected Stop */
                  <StopWorkflowCard
                    stop={selectedStopForWorkflow}
                    isCurrentStop={selectedStopForWorkflow.id === currentStop?.id}
                    totalStops={activeTrip?.stops?.length || 1}
                    distanceKm={
                      selectedStopForWorkflow.latitude && selectedStopForWorkflow.longitude
                        ? calculateDistanceKm(selectedStopForWorkflow.latitude, selectedStopForWorkflow.longitude)
                        : null
                    }
                    etaMinutes={
                      selectedStopForWorkflow.latitude && selectedStopForWorkflow.longitude
                        ? estimateReachingTimeMinutes(
                            calculateDistanceKm(selectedStopForWorkflow.latitude, selectedStopForWorkflow.longitude) || 5
                          )
                        : null
                    }
                    areaCode={getStopAreaCode(selectedStopForWorkflow)}
                    actionLoading={actionLoading}
                    onArrive={handleArriveAtStop}
                    onOpenUploadPOD={() => setIsCameraOpen(true)}
                    onMarkDelivered={handleMarkDeliveredProgressive}
                    onReportDelay={() => setIsDelayOpen(true)}
                    onAddCustomStop={() => setIsCustomStopOpen(true)}
                    onOpenDocuments={() => setIsVehiclePapersOpen(true)}
                    onBack={() => setSelectedStopForWorkflow(null)}
                    hasPodUploaded={Boolean(
                      (selectedStopForWorkflow.photos && selectedStopForWorkflow.photos.length > 0) ||
                      (activeTrip?.photos && activeTrip.photos.some((p: any) => p.stop_id === selectedStopForWorkflow.id))
                    )}
                  />
                ) : activeTrip ? (
                  /* Vertical Timeline of All Stops */
                  <TripTimeline
                    trip={activeTrip}
                    currentStop={currentStop}
                    driverCoords={driverCoords}
                    onBack={() => setActiveTab('home')}
                    onOpenHelp={() => setIsHelpOpen(true)}
                    onSelectStop={(stop) => setSelectedStopForWorkflow(stop)}
                    getStopAreaCode={getStopAreaCode}
                    calculateDistanceKm={calculateDistanceKm}
                  />
                ) : (
                  <div className="driver-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <Truck size={40} color="var(--driver-text-muted)" style={{ margin: '0 auto 10px' }} />
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--driver-text-primary)' }}>No Active Trip</h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--driver-text-secondary)' }}>
                      No stops scheduled for today. Check back with dispatch command.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* TAB 3: MAP / NAVIGATION SCREEN */}
            {activeTab === 'map' && (
              <div className="driver-map-viewport">
                {/* Floating Top Next Stop Card */}
                <FloatingNavigationCard
                  nextStop={targetNextStop}
                  distanceKm={nextStopDistance}
                  etaMinutes={nextStopEta}
                  areaCode={targetNextStop ? getStopAreaCode(targetNextStop) : undefined}
                  onSelectStop={(stop) => {
                    setSelectedStopForWorkflow(stop);
                    setActiveTab('trip');
                  }}
                />

                {/* Leaflet Interactive Map */}
                <LeafletMap
                  baseLocation={{
                    name: activeTrip?.starting_location || 'Depot HQ',
                    latitude: 28.5355,
                    longitude: 77.2680
                  }}
                  stops={activeTrip?.stops || []}
                  driverLocation={{
                    latitude: driverCoords.latitude,
                    longitude: driverCoords.longitude,
                    accuracy: gpsAccuracy || undefined
                  }}
                  height="100%"
                  theme={theme}
                  showToolbar={false}
                  showGoogleMapsButton={false}
                />
              </div>
            )}

            {/* TAB 4: EMERGENCY SCREEN */}
            {activeTab === 'emergency' && (
              <EmergencyScreen
                onBack={() => setActiveTab('home')}
                onReportIncident={() => setIsDelayOpen(true)}
              />
            )}

            {/* TAB 5: MORE OPTIONS SCREEN */}
            {activeTab === 'more' && (
              <MoreScreen
                currentUser={currentUser}
                activeTrip={activeTrip}
                trips={trips}
                onSelectTrip={(id) => {
                  loadTripDetails(id);
                  setActiveTab('home');
                }}
                onOpenDocuments={() => setIsVehiclePapersOpen(true)}
                onOpenVehicleInfo={() => setIsVehicleInfoOpen(true)}
                onOpenHelp={() => setIsHelpOpen(true)}
                theme={theme}
                onToggleTheme={onToggleTheme}
                offlineCount={offlineCount}
                onSyncOffline={() => offlineQueue.processQueue()}
                onSwitchRole={onSwitchRole}
                onLogout={onLogout}
              />
            )}
          </div>
        </main>
      </div>

      {/* Sticky Mobile Bottom Navigation (Home | Trip | Map | More) */}
      {!isDesktop && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'trip') setSelectedStopForWorkflow(null);
          }}
          hasActiveDelay={!!activeDelay}
          offlineCount={offlineCount}
        />
      )}

      {/* Camera Capture Modal (POD / Delay proof) */}
      {isCameraOpen && activeTrip && (
        <CameraModal
          tripId={activeTrip.id}
          stopId={selectedStopForWorkflow?.id || targetNextStop?.id}
          onSuccess={(uploadedPhoto) => {
            if (uploadedPhoto && selectedStopForWorkflow) {
              setSelectedStopForWorkflow((prev) => prev ? {
                ...prev,
                photos: [...(prev.photos || []), uploadedPhoto]
              } : prev);
            }
            loadTripDetails(activeTrip.id);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Delay Reporting Modal */}
      {isDelayOpen && activeTrip && (
        <DelayModal
          tripId={activeTrip.id}
          stopId={targetNextStop?.id}
          onSuccess={() => loadTripDetails(activeTrip.id)}
          onClose={() => setIsDelayOpen(false)}
        />
      )}

      {/* Add Custom Stop Modal */}
      {isCustomStopOpen && activeTrip && (
        <AddCustomStopModal
          tripId={activeTrip.id}
          currentStopCount={activeTrip.stops?.length || 0}
          currentDriverCoords={driverCoords}
          onSuccess={() => loadTripDetails(activeTrip.id)}
          onClose={() => setIsCustomStopOpen(false)}
        />
      )}

      {/* Vehicle Papers Modal (RC, Insurance, Fitness, PUC, Challans) */}
      {isVehiclePapersOpen && (
        <VehiclePapersModal
          vehicle={vehicleForModal}
          onClose={() => setIsVehiclePapersOpen(false)}
          onUpdate={(updated) => {
            setFleetVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
          }}
        />
      )}

      {/* Vehicle Info Dialog */}
      {isVehicleInfoOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsVehicleInfoOpen(false)}
        >
          <div
            className="driver-card"
            style={{ maxWidth: '400px', width: '100%', padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="var(--driver-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Vehicle Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVehicleInfoOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--driver-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--driver-text-secondary)' }}>Registration Number:</span>
                <span style={{ fontWeight: 700 }}>{vehicleForModal.vehicle_number !== 'Unassigned' ? vehicleForModal.vehicle_number : 'Unassigned'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--driver-text-secondary)' }}>Model / Body:</span>
                <span style={{ fontWeight: 700 }}>{vehicleForModal.model !== 'No Vehicle Assigned' ? vehicleForModal.model : (activeTrip?.vehicle_number ? 'Commercial Freight Body' : 'N/A')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--driver-text-secondary)' }}>Payload Capacity:</span>
                <span style={{ fontWeight: 700 }}>
                  {vehicleForModal.capacity_tons ? `${vehicleForModal.capacity_tons} Metric Tons` : (vehicleForModal.vehicle_number !== 'Unassigned' ? 'Commercial Freight' : 'N/A')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--driver-text-secondary)' }}>Telematics Device:</span>
                <span style={{ fontWeight: 700, color: isRealGps ? 'var(--driver-success)' : 'var(--driver-text-muted)' }}>
                  {isRealGps ? 'Active (GPS Online)' : isOnline ? 'Network Connected' : 'Offline / Standby'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="driver-btn-primary"
              onClick={() => {
                setIsVehicleInfoOpen(false);
                setIsVehiclePapersOpen(true);
              }}
              style={{ marginTop: '16px', minHeight: '44px', fontSize: '0.9rem' }}
            >
              <FileText size={16} />
              <span>View Vehicle Documents & RC</span>
            </button>
          </div>
        </div>
      )}

      {/* Help & Support Dialog */}
      {isHelpOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            className="driver-card"
            style={{ maxWidth: '400px', width: '100%', padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Driver Help & Guidelines</h3>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--driver-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem', color: 'var(--driver-text-secondary)' }}>
              <div>
                <b style={{ color: 'var(--driver-text-primary)' }}>1. Check-In & Arrive:</b> Tap "I'm at Location" when you reach the warehouse security gate.
              </div>
              <div>
                <b style={{ color: 'var(--driver-text-primary)' }}>2. Proof of Delivery (POD):</b> Snap a clear photo of the stamped delivery challan.
              </div>
              <div>
                <b style={{ color: 'var(--driver-text-primary)' }}>3. Delays:</b> If stuck in traffic or loading delays exceed 15 mins, report a delay immediately.
              </div>
              <div>
                <b style={{ color: 'var(--driver-text-primary)' }}>4. Emergency:</b> In case of mechanical breakdown or accident, use the Emergency tab to dial hotline.
              </div>
            </div>

            <a
              href="tel:+911145678900"
              className="driver-btn-primary"
              style={{ marginTop: '16px', textDecoration: 'none', minHeight: '44px', fontSize: '0.9rem' }}
            >
              <Phone size={16} />
              <span>Call Dispatch Command Center</span>
            </a>
          </div>
        </div>
      )}

      {/* Notifications Toast */}
      {isNotificationToastOpen && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200,
            maxWidth: '380px',
            width: '90%',
            backgroundColor: 'var(--driver-card-bg)',
            border: '1px solid var(--driver-card-border)',
            borderRadius: '14px',
            padding: '14px 16px',
            boxShadow: 'var(--driver-shadow-float)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={18} color="var(--driver-primary)" />
            <div style={{ fontSize: '0.84rem', color: 'var(--driver-text-primary)' }}>
              <b>No new operational alerts.</b> All routes and geofences clear.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNotificationToastOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--driver-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export const DriverView: React.FC<Props> = (props) => {
  return (
    <DriverLanguageProvider>
      <DriverViewInner {...props} />
    </DriverLanguageProvider>
  );
};
