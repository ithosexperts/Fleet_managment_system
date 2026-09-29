package com.company.trucktracker

import android.app.Application
import com.company.trucktracker.data.network.ApiClient
import com.company.trucktracker.data.network.NetworkMonitor
import com.company.trucktracker.data.network.SyncManager
import com.company.trucktracker.data.repository.DriverRepository
import com.company.trucktracker.location.LocationService

class TruckTrackerApp : Application() {

    lateinit var apiClient: ApiClient
    lateinit var networkMonitor: NetworkMonitor
    lateinit var syncManager: SyncManager
    lateinit var driverRepository: DriverRepository
    lateinit var locationService: LocationService

    override fun onCreate() {
        super.onCreate()

        apiClient = ApiClient(this)
        networkMonitor = NetworkMonitor(this)
        syncManager = SyncManager(this, { apiClient.apiService }, networkMonitor)
        driverRepository = DriverRepository(this, { apiClient.apiService }, networkMonitor, apiClient.preferenceManager)
        locationService = LocationService(this)
    }
}
