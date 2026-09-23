package com.company.trucktracker.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface OfflineDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: OfflineEventEntity)

    @Query("SELECT * FROM offline_events WHERE syncStatus != 'SYNCED' ORDER BY clientTimestamp ASC")
    suspend fun getPendingEvents(): List<OfflineEventEntity>

    @Query("SELECT COUNT(*) FROM offline_events WHERE syncStatus = 'PENDING'")
    fun getPendingEventCountFlow(): Flow<Int>

    @Query("DELETE FROM offline_events WHERE id = :id")
    suspend fun deleteEvent(id: String)

    @Update
    suspend fun updateEvent(event: OfflineEventEntity)

    // Offline Photos
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPhoto(photo: OfflinePhotoEntity)

    @Query("SELECT * FROM offline_photos WHERE syncStatus != 'SYNCED' ORDER BY clientTimestamp ASC")
    suspend fun getPendingPhotos(): List<OfflinePhotoEntity>

    @Query("DELETE FROM offline_photos WHERE id = :id")
    suspend fun deletePhoto(id: String)

    @Update
    suspend fun updatePhoto(photo: OfflinePhotoEntity)
}
