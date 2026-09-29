/**
 * Mapbox GL JS Architecture Forwarder
 * Seamlessly replaces legacy Leaflet map with modern high-performance Mapbox GL JS engine.
 */
import { FleetMap, FleetMapProps } from './map/FleetMap';

export type Props = FleetMapProps;
export const LeafletMap = FleetMap;
export default FleetMap;
