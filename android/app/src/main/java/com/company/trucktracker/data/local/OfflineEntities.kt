package com.company.trucktracker.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "offline_events")
data class OfflineEventEntity(
    @PrimaryKey val id: String, // UUID
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

@Entity(tableName = "offline_photos")
data class OfflinePhotoEntity(
    @PrimaryKey val id: String, // UUID
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
