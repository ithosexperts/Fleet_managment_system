package com.company.trucktracker.data.local

import kotlinx.coroutines.flow.Flow

interface OfflineDao {
    suspend fun insertEvent(event: OfflineEventEntity)
    suspend fun getPendingEvents(): List<OfflineEventEntity>
    fun getPendingEventCountFlow(): Flow<Int>
    suspend fun deleteEvent(id: String)
    suspend fun updateEvent(event: OfflineEventEntity)

    // Offline Photos
    suspend fun insertPhoto(photo: OfflinePhotoEntity)
    suspend fun getPendingPhotos(): List<OfflinePhotoEntity>
    suspend fun deletePhoto(id: String)
    suspend fun updatePhoto(photo: OfflinePhotoEntity)
}
