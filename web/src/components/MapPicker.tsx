/**
 * Mapbox GL JS Architecture Forwarder
 * Seamlessly replaces legacy Leaflet MapPicker with modern Mapbox location picker.
 */
import { MapPicker as ModernMapPicker, MapPickerProps } from './map/MapPicker';

export type Props = MapPickerProps;
export const MapPicker = ModernMapPicker;
export default ModernMapPicker;
