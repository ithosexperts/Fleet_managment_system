package com.company.trucktracker.data.local

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

class AppDatabase private constructor(context: Context) {

    private val dbHelper = DatabaseHelper(context.applicationContext)
    private val countFlow = MutableStateFlow(0)

    init {
        updatePendingCount()
    }

    private fun updatePendingCount() {
        try {
            val db = dbHelper.readableDatabase
            val cursor = db.rawQuery("SELECT COUNT(*) FROM offline_events WHERE syncStatus = 'PENDING'", null)
            if (cursor.moveToFirst()) {
                countFlow.value = cursor.getInt(0)
            }
            cursor.close()
        } catch (e: Throwable) {}
    }

    fun offlineDao(): OfflineDao = daoInstance

    private val daoInstance = object : OfflineDao {
        override suspend fun insertEvent(event: OfflineEventEntity) = withContext(Dispatchers.IO) {
            try {
                val db = dbHelper.writableDatabase
                val cv = ContentValues().apply {
                    put("id", event.id)
                    put("idempotencyKey", event.idempotencyKey)
                    put("eventType", event.eventType)
                    put("entityId", event.entityId)
                    put("endpointUrl", event.endpointUrl)
                    put("httpMethod", event.httpMethod)
                    put("payloadJson", event.payloadJson)
                    put("clientTimestamp", event.clientTimestamp)
                    put("retryCount", event.retryCount)
                    put("syncStatus", event.syncStatus)
                    put("errorMessage", event.errorMessage)
                }
                db.insertWithOnConflict("offline_events", null, cv, SQLiteDatabase.CONFLICT_REPLACE)
                updatePendingCount()
            } catch (e: Throwable) {}
        }

        override suspend fun getPendingEvents(): List<OfflineEventEntity> = withContext(Dispatchers.IO) {
            val list = mutableListOf<OfflineEventEntity>()
            try {
                val db = dbHelper.readableDatabase
                val cursor = db.rawQuery("SELECT * FROM offline_events WHERE syncStatus != 'SYNCED' ORDER BY clientTimestamp ASC", null)
                while (cursor.moveToNext()) {
                    list.add(cursorToEvent(cursor))
                }
                cursor.close()
            } catch (e: Throwable) {}
            list
        }

        override fun getPendingEventCountFlow(): Flow<Int> = countFlow.asStateFlow()

        override suspend fun deleteEvent(id: String) = withContext(Dispatchers.IO) {
            try {
                val db = dbHelper.writableDatabase
                db.delete("offline_events", "id = ?", arrayOf(id))
                updatePendingCount()
            } catch (e: Throwable) {}
        }

        override suspend fun updateEvent(event: OfflineEventEntity) = withContext(Dispatchers.IO) {
            try {
                val db = dbHelper.writableDatabase
                val cv = ContentValues().apply {
                    put("retryCount", event.retryCount)
                    put("syncStatus", event.syncStatus)
                    put("errorMessage", event.errorMessage)
                }
                db.update("offline_events", cv, "id = ?", arrayOf(event.id))
                updatePendingCount()
            } catch (e: Throwable) {}
        }

        override suspend fun insertPhoto(photo: OfflinePhotoEntity) = withContext(Dispatchers.IO) {
            try {
                val db = dbHelper.writableDatabase
                val cv = ContentValues().apply {
                    put("id", photo.id)
                    put("tripId", photo.tripId)
                    put("stopId", photo.stopId)
                    put("localFilePath", photo.localFilePath)
                    put("photoType", photo.photoType)
                    put("clientTimestamp", photo.clientTimestamp)
                    put("latitude", photo.latitude)
                    put("longitude", photo.longitude)
                    put("accuracy", photo.accuracy)
                    put("retryCount", photo.retryCount)
                    put("syncStatus", photo.syncStatus)
                }
                db.insertWithOnConflict("offline_photos", null, cv, SQLiteDatabase.CONFLICT_REPLACE)
            } catch (e: Throwable) {}
        }

        override suspend fun getPendingPhotos(): List<OfflinePhotoEntity> = withContext(Dispatchers.IO) {
            val list = mutableListOf<OfflinePhotoEntity>()
            try {
                val db = dbHelper.readableDatabase
                val cursor = db.rawQuery("SELECT * FROM offline_photos WHERE syncStatus != 'SYNCED' ORDER BY clientTimestamp ASC", null)
                while (cursor.moveToNext()) {
                    list.add(cursorToPhoto(cursor))
                }
                cursor.close()
            } catch (e: Throwable) {}
            list
        }

        override suspend fun deletePhoto(id: String) = withContext(Dispatchers.IO) {
            try {
                val db = dbHelper.writableDatabase
                db.delete("offline_photos", "id = ?", arrayOf(id))
            } catch (e: Throwable) {}
        }

        override suspend fun updatePhoto(photo: OfflinePhotoEntity) = withContext(Dispatchers.IO) {
            try {
                val db = dbHelper.writableDatabase
                val cv = ContentValues().apply {
                    put("retryCount", photo.retryCount)
                    put("syncStatus", photo.syncStatus)
                }
                db.update("offline_photos", cv, "id = ?", arrayOf(photo.id))
            } catch (e: Throwable) {}
        }
    }

    private fun cursorToEvent(cursor: Cursor): OfflineEventEntity {
        return OfflineEventEntity(
            id = cursor.getString(cursor.getColumnIndexOrThrow("id")),
            idempotencyKey = cursor.getString(cursor.getColumnIndexOrThrow("idempotencyKey")),
            eventType = cursor.getString(cursor.getColumnIndexOrThrow("eventType")),
            entityId = cursor.getString(cursor.getColumnIndexOrThrow("entityId")),
            endpointUrl = cursor.getString(cursor.getColumnIndexOrThrow("endpointUrl")),
            httpMethod = cursor.getString(cursor.getColumnIndexOrThrow("httpMethod")),
            payloadJson = cursor.getString(cursor.getColumnIndexOrThrow("payloadJson")),
            clientTimestamp = cursor.getString(cursor.getColumnIndexOrThrow("clientTimestamp")),
            retryCount = cursor.getInt(cursor.getColumnIndexOrThrow("retryCount")),
            syncStatus = cursor.getString(cursor.getColumnIndexOrThrow("syncStatus")),
            errorMessage = cursor.getString(cursor.getColumnIndexOrThrow("errorMessage"))
        )
    }

    private fun cursorToPhoto(cursor: Cursor): OfflinePhotoEntity {
        val latIdx = cursor.getColumnIndexOrThrow("latitude")
        val lonIdx = cursor.getColumnIndexOrThrow("longitude")
        val accIdx = cursor.getColumnIndexOrThrow("accuracy")
        return OfflinePhotoEntity(
            id = cursor.getString(cursor.getColumnIndexOrThrow("id")),
            tripId = cursor.getString(cursor.getColumnIndexOrThrow("tripId")),
            stopId = cursor.getString(cursor.getColumnIndexOrThrow("stopId")),
            localFilePath = cursor.getString(cursor.getColumnIndexOrThrow("localFilePath")),
            photoType = cursor.getString(cursor.getColumnIndexOrThrow("photoType")),
            clientTimestamp = cursor.getString(cursor.getColumnIndexOrThrow("clientTimestamp")),
            latitude = if (cursor.isNull(latIdx)) null else cursor.getDouble(latIdx),
            longitude = if (cursor.isNull(lonIdx)) null else cursor.getDouble(lonIdx),
            accuracy = if (cursor.isNull(accIdx)) null else cursor.getDouble(accIdx),
            retryCount = cursor.getInt(cursor.getColumnIndexOrThrow("retryCount")),
            syncStatus = cursor.getString(cursor.getColumnIndexOrThrow("syncStatus"))
        )
    }

    private class DatabaseHelper(context: Context) : SQLiteOpenHelper(context, "truck_tracker_offline.db", null, 1) {
        override fun onCreate(db: SQLiteDatabase) {
            db.execSQL("""
                CREATE TABLE IF NOT EXISTS offline_events (
                    id TEXT PRIMARY KEY NOT NULL,
                    idempotencyKey TEXT NOT NULL,
                    eventType TEXT NOT NULL,
                    entityId TEXT NOT NULL,
                    endpointUrl TEXT NOT NULL,
                    httpMethod TEXT NOT NULL,
                    payloadJson TEXT NOT NULL,
                    clientTimestamp TEXT NOT NULL,
                    retryCount INTEGER NOT NULL DEFAULT 0,
                    syncStatus TEXT NOT NULL DEFAULT 'PENDING',
                    errorMessage TEXT
                )
            """.trimIndent())

            db.execSQL("""
                CREATE TABLE IF NOT EXISTS offline_photos (
                    id TEXT PRIMARY KEY NOT NULL,
                    tripId TEXT NOT NULL,
                    stopId TEXT,
                    localFilePath TEXT NOT NULL,
                    photoType TEXT NOT NULL,
                    clientTimestamp TEXT NOT NULL,
                    latitude REAL,
                    longitude REAL,
                    accuracy REAL,
                    retryCount INTEGER NOT NULL DEFAULT 0,
                    syncStatus TEXT NOT NULL DEFAULT 'PENDING'
                )
            """.trimIndent())
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
            db.execSQL("DROP TABLE IF EXISTS offline_events")
            db.execSQL("DROP TABLE IF EXISTS offline_photos")
            onCreate(db)
        }
    }

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = AppDatabase(context)
                INSTANCE = instance
                instance
            }
        }
    }
}
