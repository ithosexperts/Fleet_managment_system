package com.company.trucktracker.data.local

data class OfflineEventEntity(
    val id: String, // UUID
    val idempotencyKey: String,
    val eventType: String,
    val entityId: String, // trip_id or stop_id
    val endpointUrl: String,
    val httpMethod: String,
    val payloadJson: String,
    val clientTimestamp: String,
    val retryCount: Int = 0,
    val syncStatus: String = "PENDING", // PENDING, SYNCING, FAILED
    val errorMessage: String? = null
)

data class OfflinePhotoEntity(
    val id: String, // UUID
    val tripId: String,
    val stopId: String?,
    val localFilePath: String,
    val photoType: String,
    val clientTimestamp: String,
    val latitude: Double?,
    val longitude: Double?,
    val accuracy: Double?,
    val retryCount: Int = 0,
    val syncStatus: String = "PENDING"
)
