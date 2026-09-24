import { hosexpertsApi } from './hosexpertsApi';
import { query } from '../db';

export class HoseXpertsSyncService {
  private isEnabled(): boolean {
    // Enabled by default if HOSEXPERTS_SYNC_ENABLED is not explicitly set to 'false'
    return process.env.HOSEXPERTS_SYNC_ENABLED !== 'false';
  }

  /**
   * Safe upsert helper: tries insert, falls back to update if primary key already exists
   */
  private async upsert(table: string, payload: Record<string, any>, idKey = 'id'): Promise<boolean> {
    const targetId = payload[idKey];
    try {
      const res = await hosexpertsApi.insert(table, payload);
      if (res && res.status === 'error') {
        const errorStr = JSON.stringify(res.error || '');
        if (errorStr.includes('2627') || errorStr.includes('duplicate') || errorStr.includes('PRIMARY KEY')) {
          const { [idKey]: _, created_at: __, ...updateFields } = payload;
          await hosexpertsApi.update(table, updateFields, { [idKey]: targetId });
          console.log(`[HoseXperts Sync] Upsert (updated) ${table} record ${targetId}`);
          return true;
        }
        throw new Error(res.message || errorStr);
      }
      console.log(`[HoseXperts Sync] Inserted into ${table}: ${targetId}`);
      return true;
    } catch (err: any) {
      const errStr = err.message || '';
      if (errStr.includes('2627') || errStr.includes('duplicate') || errStr.includes('PRIMARY KEY')) {
        const { [idKey]: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update(table, updateFields, { [idKey]: targetId });
        console.log(`[HoseXperts Sync] Upsert fallback (updated) ${table} record ${targetId}`);
        return true;
      }
      console.error(`[HoseXperts Sync Error] Failed upsert into ${table}:`, errStr);
      return false;
    }
  }

  /**
   * VEHICLES SYNC
   */
  async syncVehicle(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Vehicles', { id: targetId });
        console.log(`[HoseXperts Sync] Deleted vehicle ${targetId} in SQL Server`);
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        vehicle_number: (data.vehicle_number || '').toUpperCase(),
        vehicle_type: data.vehicle_type || 'Medium Freight',
        model: data.model || 'Commercial Fleet',
        assigned_driver_id: data.assigned_driver_id || null,
        status: data.status || 'AVAILABLE',
        fleet_unit_id: data.fleet_unit_id || null,
        chassis_number: data.chassis_number || null,
        telematics_imei: data.telematics_imei || null,
        photo_url: data.photo_url || null,
        notes: data.notes || null,
        created_at: data.created_at || new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Vehicles', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        const res = await hosexpertsApi.update('FL_Vehicles', updateFields, { id: targetId });
        console.log(`[HoseXperts Sync] Updated vehicle ${targetId} in SQL Server:`, res?.message || res?.status);
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} vehicle:`, err.message);
      return false;
    }
  }

  /**
   * VEHICLE DOCUMENTS SYNC
   */
  async syncVehicleDocument(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Vehicle_Documents', { id: targetId });
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        vehicle_id: data.vehicle_id,
        document_type: data.document_type || 'OTHER',
        title: data.title || 'Document',
        document_number: data.document_number || 'DOC-001',
        issue_date: data.issue_date || null,
        expiry_date: data.expiry_date || '2030-01-01',
        status: data.status || 'VALID',
        file_url: data.file_url || null,
        file_name: data.file_name || null,
        file_size: data.file_size ? Number(data.file_size) : null,
        created_at: data.created_at || new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Vehicle_Documents', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update('FL_Vehicle_Documents', updateFields, { id: targetId });
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} vehicle document:`, err.message);
      return false;
    }
  }

  /**
   * DRIVERS SYNC
   */
  async syncDriver(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Drivers', { id: targetId });
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        user_id: data.user_id,
        employee_id: data.employee_id || `EMP-${Date.now().toString().slice(-4)}`,
        assigned_vehicle_id: data.assigned_vehicle_id || null,
        license_number: data.license_number || null,
        license_category: data.license_category || 'COMMERCIAL_HMV',
        emergency_phone: data.emergency_phone || null,
        avatar_url: data.avatar_url || null,
        status: data.status || 'AVAILABLE',
        created_at: data.created_at || new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Drivers', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update('FL_Drivers', updateFields, { id: targetId });
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} driver:`, err.message);
      return false;
    }
  }

  /**
   * USERS SYNC
   */
  async syncUser(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Users', { id: targetId });
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        name: data.name,
        email: (data.email || '').toLowerCase(),
        password_hash: data.password_hash,
        role: data.role || 'DRIVER',
        phone: data.phone || null,
        created_at: data.created_at || new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Users', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update('FL_Users', updateFields, { id: targetId });
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} user:`, err.message);
      return false;
    }
  }

  /**
   * DESTINATIONS SYNC
   */
  async syncDestination(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Destinations', { id: targetId });
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        name: data.name,
        address: data.address,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        contact_name: data.contact_name || data.contact_person || null,
        contact_number: data.contact_number || data.contact_phone || null,
        geofence_radius_meters: data.geofence_radius_meters ? Number(data.geofence_radius_meters) : 150,
        area_code: data.area_code || null,
        notes: data.notes || null,
        is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
        created_at: data.created_at || new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Destinations', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update('FL_Destinations', updateFields, { id: targetId });
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} destination:`, err.message);
      return false;
    }
  }

  /**
   * TRIPS SYNC
   */
  async syncTrip(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Trips', { id: targetId });
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        date: data.date || new Date().toISOString().slice(0, 10),
        driver_id: data.driver_id,
        vehicle_id: data.vehicle_id,
        starting_location: data.starting_location || 'HoseXperts Central Depot',
        starting_latitude: data.starting_latitude ? Number(data.starting_latitude) : null,
        starting_longitude: data.starting_longitude ? Number(data.starting_longitude) : null,
        purpose: data.purpose || 'Commercial Hose & Fitting Delivery',
        reference_number: data.reference_number || data.trip_number || null,
        planned_departure_time: data.planned_departure_time || data.planned_departure || new Date().toISOString(),
        actual_start_time: data.actual_start_time || null,
        return_start_time: data.return_start_time || null,
        base_arrival_time: data.base_arrival_time || null,
        completion_time: data.completion_time || data.trip_completion_time || null,
        status: data.status || 'ASSIGNED',
        total_delay_minutes: data.total_delay_minutes ? Number(data.total_delay_minutes) : 0,
        calculated_distance_km: data.calculated_distance_km ? Number(data.calculated_distance_km) : null,
        sap_shipment_num: data.sap_shipment_num || null,
        erp_delivery_doc: data.erp_delivery_doc || null,
        cost_center: data.cost_center || null,
        notes: data.notes || null,
        created_by: data.created_by || null,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Trips', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update('FL_Trips', updateFields, { id: targetId });
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} trip:`, err.message);
      return false;
    }
  }

  /**
   * TRIP STOPS SYNC
   */
  async syncTripStop(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Trip_Stops', { id: targetId });
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        trip_id: data.trip_id,
        destination_id: data.destination_id || null,
        stop_number: Number(data.stop_number || 1),
        destination_name: data.destination_name || 'Delivery Stop',
        address: data.address || '',
        latitude: Number(data.latitude || 0),
        longitude: Number(data.longitude || 0),
        geofence_radius_meters: data.geofence_radius_meters ? Number(data.geofence_radius_meters) : 150,
        planned_arrival_time: data.planned_arrival_time || data.planned_arrival || new Date().toISOString(),
        actual_arrival_time: data.actual_arrival_time || null,
        actual_departure_time: data.actual_departure_time || null,
        arrival_latitude: data.arrival_latitude ? Number(data.arrival_latitude) : null,
        arrival_longitude: data.arrival_longitude ? Number(data.arrival_longitude) : null,
        departure_latitude: data.departure_latitude ? Number(data.departure_latitude) : null,
        departure_longitude: data.departure_longitude ? Number(data.departure_longitude) : null,
        arrival_status: data.arrival_status || null,
        arrival_diff_minutes: data.arrival_diff_minutes ? Number(data.arrival_diff_minutes) : null,
        status: data.status || 'PENDING',
        notes: data.notes || null,
        created_at: data.created_at || new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Trip_Stops', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update('FL_Trip_Stops', updateFields, { id: targetId });
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} trip stop:`, err.message);
      return false;
    }
  }

  /**
   * STOP ACTIVITIES SYNC
   */
  async syncActivity(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Activities', { id: targetId });
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        trip_id: data.trip_id,
        stop_id: data.stop_id,
        activity_type: data.activity_type || 'DELIVERY',
        status: data.status || 'COMPLETED',
        start_time: data.start_time || data.started_at || null,
        completion_time: data.completion_time || data.completed_at || null,
        quantity: data.quantity ? Number(data.quantity) : null,
        reference_number: data.reference_number || null,
        recipient_name: data.recipient_name || null,
        notes: data.notes || null,
        created_at: data.created_at || new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Activities', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update('FL_Activities', updateFields, { id: targetId });
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} activity:`, err.message);
      return false;
    }
  }

  /**
   * DELAYS & BOTTLENECKS SYNC
   */
  async syncDelay(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Delays', { id: targetId });
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        trip_id: data.trip_id,
        stop_id: data.stop_id || null,
        driver_id: data.driver_id,
        vehicle_id: data.vehicle_id,
        reason: data.reason || 'TRAFFIC',
        description: data.description || null,
        start_time: data.start_time || new Date().toISOString(),
        end_time: data.end_time || null,
        duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : null,
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        gps_accuracy: data.gps_accuracy ? Number(data.gps_accuracy) : null,
        is_resolved: data.is_resolved !== undefined ? (data.is_resolved ? 1 : 0) : 0,
        photo_id: data.photo_id || null,
        created_at: data.created_at || new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Delays', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update('FL_Delays', updateFields, { id: targetId });
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} delay:`, err.message);
      return false;
    }
  }

  /**
   * PHOTOS SYNC
   */
  async syncPhoto(action: 'insert' | 'update' | 'delete', data: Record<string, any>, id?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    const targetId = id || data.id;
    try {
      if (action === 'delete') {
        await hosexpertsApi.delete('FL_Photos', { id: targetId });
        return true;
      }

      const payload: Record<string, any> = {
        id: targetId,
        trip_id: data.trip_id,
        stop_id: data.stop_id || null,
        driver_id: data.driver_id,
        vehicle_id: data.vehicle_id,
        photo_type: data.photo_type || 'DELIVERY_PROOF',
        file_path: data.file_path || '',
        file_size: data.file_size ? Number(data.file_size) : 0,
        mime_type: data.mime_type || 'image/jpeg',
        timestamp: data.timestamp || new Date().toISOString(),
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        gps_accuracy: data.gps_accuracy ? Number(data.gps_accuracy) : null,
        created_at: data.created_at || new Date().toISOString()
      };

      if (action === 'insert') {
        return await this.upsert('FL_Photos', payload);
      } else {
        const { id: _, created_at: __, ...updateFields } = payload;
        await hosexpertsApi.update('FL_Photos', updateFields, { id: targetId });
        return true;
      }
    } catch (err: any) {
      console.error(`[HoseXperts Sync Error] Failed to ${action} photo:`, err.message);
      return false;
    }
  }

  /**
   * BULK SYNC ALL: Migrates all active local data (users, drivers, vehicles, destinations, trips, stops)
   * into SQL Server FL_* tables via the HoseXperts API Gateway.
   */
  async syncAll(): Promise<{
    users: number;
    vehicles: number;
    drivers: number;
    destinations: number;
    trips: number;
    stops: number;
  }> {
    const summary = { users: 0, vehicles: 0, drivers: 0, destinations: 0, trips: 0, stops: 0 };
    console.log('[HoseXperts Sync] Starting full bulk synchronization...');

    try {
      // 1. Users
      const users = (await query(`SELECT * FROM users`)).rows;
      for (const u of users) {
        const ok = await this.syncUser('insert', u);
        if (ok) summary.users++;
      }

      // 2. Vehicles
      const vehicles = (await query(`SELECT * FROM vehicles`)).rows;
      for (const v of vehicles) {
        const ok = await this.syncVehicle('insert', v);
        if (ok) summary.vehicles++;
      }

      // 3. Drivers
      const drivers = (await query(`SELECT * FROM drivers`)).rows;
      for (const d of drivers) {
        const ok = await this.syncDriver('insert', d);
        if (ok) summary.drivers++;
      }

      // 4. Destinations
      const destinations = (await query(`SELECT * FROM destinations`)).rows;
      for (const dest of destinations) {
        const ok = await this.syncDestination('insert', dest);
        if (ok) summary.destinations++;
      }

      // 5. Trips
      const trips = (await query(`SELECT * FROM trips`)).rows;
      for (const t of trips) {
        const ok = await this.syncTrip('insert', t);
        if (ok) summary.trips++;
      }

      // 6. Stops
      const stops = (await query(`SELECT * FROM trip_stops`)).rows;
      for (const s of stops) {
        const ok = await this.syncTripStop('insert', s);
        if (ok) summary.stops++;
      }

      console.log('[HoseXperts Sync] Bulk sync complete:', summary);
    } catch (err: any) {
      console.error('[HoseXperts Sync] Error during bulk sync:', err.message);
    }

    return summary;
  }
}

export const hosexpertsSync = new HoseXpertsSyncService();
