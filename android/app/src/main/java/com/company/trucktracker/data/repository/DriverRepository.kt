package com.company.trucktracker.data.repository

import android.content.Context
import com.company.trucktracker.data.local.AppDatabase
import com.company.trucktracker.data.local.OfflineEventEntity
import com.company.trucktracker.data.local.PreferenceManager
import com.company.trucktracker.data.models.*
import com.company.trucktracker.data.network.NetworkMonitor
import com.company.trucktracker.data.network.TruckTrackerApiService
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class DriverRepository(
    private val context: Context,
    private val apiServiceProvider: () -> TruckTrackerApiService,
    private val networkMonitor: NetworkMonitor,
    private val preferenceManager: PreferenceManager
) {
    private val apiService get() = apiServiceProvider()
    private val dao = AppDatabase.getDatabase(context).offlineDao()
    private val gson = Gson()

    fun getPendingEventCountFlow(): Flow<Int> = dao.getPendingEventCountFlow()

    fun getCurrentUser(): User? = preferenceManager.getUser()

    suspend fun login(email: String, password: String): Result<User> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.login(mapOf("email" to email, "password" to password))
            if (res.isSuccessful && res.body()?.data != null) {
                val data = res.body()!!.data!!
                preferenceManager.saveAuthToken(data.token)
                preferenceManager.saveUser(data.user)
                Result.success(data.user)
            } else {
                Result.failure(Exception(res.body()?.error ?: "Invalid credentials"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAssignedTrip(): Result<Trip?> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getAssignedTrip()
            android.util.Log.d("DriverRepo", "getAssignedTrip code=${res.code()} hasData=${res.body()?.data != null} trip=${res.body()?.data?.id}")
            if (res.isSuccessful) {
                Result.success(res.body()?.data)
            } else {
                android.util.Log.w("DriverRepo", "getAssignedTrip failed: ${res.code()}")
                Result.failure(Exception("Failed to load assigned trip"))
            }
        } catch (e: Exception) {
            android.util.Log.e("DriverRepo", "getAssignedTrip exception", e)
            Result.failure(e)
        }
    }

    suspend fun getTodaysTrips(): Result<List<Trip>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getTodaysTrips()
            if (res.isSuccessful && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to load today's trips"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTripHistory(): Result<List<Trip>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getTripHistory()
            if (res.isSuccessful && res.body()?.data != null) {
                // Filter to only finished/completed trips for the history view
                val historyStatuses = setOf(TripStatus.COMPLETED, TripStatus.RETURNING, TripStatus.CANCELLED)
                val history = res.body()!!.data!!.filter { it.status in historyStatuses }
                Result.success(history)
            } else {
                Result.failure(Exception("Failed to load trip history"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Driver Action Dispatcher with Offline Queueing & Idempotency
    suspend fun executeAction(
        eventType: String,
        entityId: String,
        payload: MutableMap<String, Any?>
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        val idempotencyKey = UUID.randomUUID().toString()
        val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val clientTimestamp = isoFormat.format(Date())

        payload["idempotency_key"] = idempotencyKey
        payload["client_timestamp"] = clientTimestamp

        if (!networkMonitor.isConnected.value) {
            // Queue locally in Room database
            val offlineEntity = OfflineEventEntity(
                id = UUID.randomUUID().toString(),
                idempotencyKey = idempotencyKey,
                eventType = eventType,
                entityId = entityId,
                endpointUrl = "",
                httpMethod = "POST",
                payloadJson = gson.toJson(payload),
                clientTimestamp = clientTimestamp,
                syncStatus = "PENDING"
            )
            dao.insertEvent(offlineEntity)
            return@withContext Result.success(true) // Queued successfully
        }

        // Online execution
        try {
            val res = when (eventType) {
                "TRIP_START" -> apiService.startTrip(entityId, payload)
                "STOP_ARRIVAL" -> apiService.arriveStop(entityId, payload)
                "ACTIVITY_COMPLETION" -> apiService.completeActivity(entityId, payload)
                "STOP_DEPARTURE" -> apiService.departStop(entityId, payload)
                "DELAY_START" -> apiService.reportDelay(entityId, payload)
                "DELAY_RESOLVE" -> apiService.resolveDelay(entityId, payload)
                "RETURN_START" -> apiService.startReturn(entityId, payload)
                "BASE_ARRIVAL" -> apiService.arriveBase(entityId, payload)
                "TRIP_COMPLETE" -> apiService.completeTrip(entityId, payload)
                else -> throw IllegalArgumentException("Unknown event type $eventType")
            }

            if (res.isSuccessful) {
                Result.success(true)
            } else {
                // If server returns error, queue locally if network dropped during transit
                Result.failure(Exception(res.errorBody()?.string() ?: "Action failed"))
            }
        } catch (e: Exception) {
            // Network dropped while sending: queue to Room for auto-retry
            val offlineEntity = OfflineEventEntity(
                id = UUID.randomUUID().toString(),
                idempotencyKey = idempotencyKey,
                eventType = eventType,
                entityId = entityId,
                endpointUrl = "",
                httpMethod = "POST",
                payloadJson = gson.toJson(payload),
                clientTimestamp = clientTimestamp,
                syncStatus = "PENDING",
                errorMessage = e.message
            )
            dao.insertEvent(offlineEntity)
            Result.success(true) // Saved locally
        }
    }

    suspend fun uploadPhoto(
        photoFile: File,
        tripId: String,
        stopId: String?,
        photoType: String = "Delivery Proof",
        latitude: Double? = null,
        longitude: Double? = null,
        accuracy: Float? = null
    ): Result<Photo> = withContext(Dispatchers.IO) {
        try {
            val reqFile = photoFile.asRequestBody("image/jpeg".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("photo", photoFile.name, reqFile)
            val tripIdPart = tripId.toRequestBody("text/plain".toMediaTypeOrNull())
            val stopIdPart = stopId?.toRequestBody("text/plain".toMediaTypeOrNull())
            val photoTypePart = photoType.toRequestBody("text/plain".toMediaTypeOrNull())
            val latPart = latitude?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            val lngPart = longitude?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            val accPart = accuracy?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())

            val res = apiService.uploadPhoto(body, tripIdPart, stopIdPart, photoTypePart, latPart, lngPart, accPart)
            if (res.isSuccessful && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else if (res.isSuccessful && res.body()?.success == true) {
                Result.success(
                    Photo(
                        id = UUID.randomUUID().toString(),
                        photo_type = photoType,
                        file_path = photoFile.name,
                        timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }.format(Date())
                    )
                )
            } else {
                Result.failure(Exception(res.body()?.error ?: "Failed to upload photo"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendTelemetry(
        tripId: String,
        latitude: Double,
        longitude: Double,
        accuracy: Float? = null,
        speedKmh: Float? = null
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val payload = mapOf(
                "latitude" to latitude,
                "longitude" to longitude,
                "gps_accuracy" to accuracy,
                "speed_kmh" to speedKmh
            )
            val res = apiService.sendTelemetry(tripId, payload)
            if (res.isSuccessful) {
                Result.success(true)
            } else {
                Result.failure(Exception("Telemetry failed code=${res.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() {
        preferenceManager.clear()
    }
}
