package com.company.trucktracker.data.network

import android.content.Context
import android.util.Log
import com.company.trucktracker.data.local.AppDatabase
import com.company.trucktracker.data.local.OfflineEventEntity
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class SyncManager(
    private val context: Context,
    private val apiServiceProvider: () -> TruckTrackerApiService,
    private val networkMonitor: NetworkMonitor
) {
    private val apiService get() = apiServiceProvider()
    private val dao = AppDatabase.getDatabase(context).offlineDao()
    private val syncMutex = Mutex()
    private val scope = CoroutineScope(Dispatchers.IO)

    private val _syncStatus = MutableStateFlow<String>("IDLE")
    val syncStatus: StateFlow<String> = _syncStatus.asStateFlow()

    init {
        // Auto-drain offline queue whenever network becomes available
        scope.launch {
            networkMonitor.isConnected.collect { isConnected ->
                if (isConnected) {
                    triggerSync()
                }
            }
        }
    }

    suspend fun triggerSync(): Int {
        if (!networkMonitor.isConnected.value) {
            _syncStatus.value = "OFFLINE"
            return 0
        }

        return syncMutex.withLock {
            _syncStatus.value = "SYNCING"
            var syncedCount = 0
            try {
                val pendingEvents = dao.getPendingEvents()
                val gson = Gson()
                val mapType = object : TypeToken<Map<String, Any?>>() {}.type

                for (event in pendingEvents) {
                    try {
                        val payload: Map<String, Any?> = gson.fromJson(event.payloadJson, mapType)
                        val success = dispatchEvent(event, payload)

                        if (success) {
                            dao.deleteEvent(event.id)
                            syncedCount++
                        } else {
                            dao.updateEvent(event.copy(
                                retryCount = event.retryCount + 1,
                                syncStatus = "FAILED"
                            ))
                        }
                    } catch (e: Exception) {
                        Log.e("SyncManager", "Failed to sync event ${event.id}: ${e.message}")
                        dao.updateEvent(event.copy(
                            retryCount = event.retryCount + 1,
                            syncStatus = "FAILED",
                            errorMessage = e.message
                        ))
                    }
                }
                _syncStatus.value = if (syncedCount > 0) "SYNCED" else "IDLE"
            } catch (e: Exception) {
                Log.e("SyncManager", "Sync loop error: ${e.message}")
                _syncStatus.value = "ERROR"
            }
            syncedCount
        }
    }

    private suspend fun dispatchEvent(
        event: OfflineEventEntity,
        payload: Map<String, Any?>
    ): Boolean {
        val res = when (event.eventType) {
            "TRIP_START" -> apiService.startTrip(event.entityId, payload)
            "STOP_ARRIVAL" -> apiService.arriveStop(event.entityId, payload)
            "ACTIVITY_COMPLETION" -> apiService.completeActivity(event.entityId, payload)
            "STOP_DEPARTURE" -> apiService.departStop(event.entityId, payload)
            "DELAY_START" -> apiService.reportDelay(event.entityId, payload)
            "DELAY_RESOLVE" -> apiService.resolveDelay(event.entityId, payload)
            "RETURN_START" -> apiService.startReturn(event.entityId, payload)
            "BASE_ARRIVAL" -> apiService.arriveBase(event.entityId, payload)
            "TRIP_COMPLETE" -> apiService.completeTrip(event.entityId, payload)
            else -> null
        }
        return res?.isSuccessful == true
    }
}
