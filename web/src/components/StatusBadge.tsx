import React from 'react';
import {
  Clock,
  Play,
  MapPin,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { TripStatus, StopStatus, VehicleStatus, DriverStatus } from '../types';

interface Props {
  status: TripStatus | StopStatus | VehicleStatus | DriverStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const normalized = (status || '').toUpperCase().trim();

  let className = 'badge';
  let icon: React.ReactNode = null;
  let displayLabel = status ? status.replace(/_/g, ' ') : 'UNKNOWN';

  switch (normalized) {
    case 'IN_PROGRESS':
      className += ' badge-in_progress';
      icon = <Play size={10} />;
      displayLabel = 'In Transit';
      break;

    case 'AT_DESTINATION':
    case 'ARRIVED':
      className += ' badge-at_destination';
      icon = <MapPin size={10} />;
      displayLabel = 'At Stop';
      break;

    case 'DELAYED':
    case 'LATE':
      className += ' badge-delayed';
      icon = <AlertTriangle size={10} />;
      displayLabel = 'Delayed';
      break;

    case 'RETURNING':
      className += ' badge-returning';
      icon = <RotateCcw size={10} />;
      displayLabel = 'Returning';
      break;

    case 'COMPLETED':
    case 'ON_TIME':
    case 'EARLY':
      className += ' badge-completed';
      icon = <CheckCircle2 size={10} />;
      displayLabel = normalized === 'COMPLETED' ? 'Delivered' : displayLabel;
      break;

    case 'CANCELLED':
    case 'FAILED':
      className += ' badge-danger';
      icon = <XCircle size={10} />;
      displayLabel = normalized === 'CANCELLED' ? 'Cancelled' : 'Failed';
      break;

    case 'AVAILABLE':
      className += ' badge-completed';
      icon = <CheckCircle2 size={10} />;
      displayLabel = 'Available';
      break;

    case 'ON_TRIP':
      className += ' badge-in_progress';
      icon = <Play size={10} />;
      displayLabel = 'On Trip';
      break;

    case 'MAINTENANCE':
      className += ' badge-delayed';
      icon = <ShieldAlert size={10} />;
      displayLabel = 'Service';
      break;

    case 'OFF_DUTY':
    case 'INACTIVE':
      className += ' badge-assigned';
      icon = <Clock size={10} />;
      displayLabel = normalized === 'OFF_DUTY' ? 'Off Duty' : 'Inactive';
      break;

    case 'ASSIGNED':
    case 'PENDING':
    case 'PLANNED':
    default:
      className += ' badge-assigned';
      icon = <Clock size={10} />;
      displayLabel = normalized === 'ASSIGNED' ? 'Assigned' : normalized === 'PLANNED' ? 'Planned' : displayLabel;
      break;
  }

  return (
    <span
      className={className}
      style={{
        padding: size === 'sm' ? '2px 6px' : '3px 8px',
        fontSize: size === 'sm' ? '0.68rem' : '0.733rem'
      }}
    >
      {icon}
      <span>{displayLabel}</span>
    </span>
  );
};
