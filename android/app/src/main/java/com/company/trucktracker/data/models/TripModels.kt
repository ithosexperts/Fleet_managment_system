package com.company.trucktracker.data.models

import com.google.gson.annotations.SerializedName

enum class TripStatus {
    PLANNED,
    ASSIGNED,
    IN_PROGRESS,
    AT_DESTINATION,
    DELAYED,
    RETURNING,
    COMPLETED,
    CANCELLED
}

enum class StopStatus {
    PENDING,
    ARRIVED,
    IN_PROGRESS,
    COMPLETED,
    SKIPPED,
    FAILED
}

enum class DelayReason {
    TRAFFIC,
    VEHICLE_BREAKDOWN,
    WEATHER,
    CUSTOMER_UNAVAILABLE,
    LOADING_UNLOADING,
    ROAD_CLOSURE,
    POLICE_CHECK,
    OTHER
}

enum class PhotoType {
    DELIVERY_PROOF,
    PICKUP_PROOF,
    DELAY_PROOF,
    VEHICLE_ISSUE,
    DAMAGE,
    LOADING_UNLOADING,
    OTHER
}

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val phone: String? = null,
    val employee_id: String? = null,
    val assigned_vehicle_id: String? = null
)

data class Vehicle(
    val id: String,
    val plate_number: String,
    val model: String,
    val status: String,
    val current_odometer: Double? = null
)

data class Destination(
    val id: String,
    val name: String,
    val address: String,
    val contact_person: String? = null,
    val contact_phone: String? = null,
    val latitude: Double,
    val longitude: Double,
    val geofence_radius: Double = 150.0,
    val is_base: Int = 0
)

data class Activity(
    val id: String,
    val trip_id: String,
    val stop_id: String? = null,
    val activity_type: String,
    val description: String? = null,
    val quantity: Int? = null,
    val recipient_name: String? = null,
    val recipient_phone: String? = null,
    val status: String,
    val photo_required: Int = 0,
    val started_at: String? = null,
    val completed_at: String? = null,
    val notes: String? = null
)

data class TripStop(
    val id: String,
    val trip_id: String,
    val stop_number: Int,
    val destination_id: String,
    val destination_name: String? = null,
    val address: String? = null,
    val latitude: Double,
    val longitude: Double,
    val geofence_radius: Double = 150.0,
    val planned_arrival: String? = null,
    val actual_arrival_time: String? = null,
    val actual_departure_time: String? = null,
    val status: StopStatus,
    val notes: String? = null,
    val activity: Activity? = null,
    val photos: List<Photo>? = null,
    val delays: List<Delay>? = null
)

data class Trip(
    val id: String,
    val trip_number: String,
    val driver_id: String,
    val driver_name: String? = null,
    val vehicle_id: String,
    val vehicle_plate: String? = null,
    val vehicle_model: String? = null,
    val starting_location_id: String,
    val starting_location_name: String? = null,
    val planned_departure: String,
    val actual_start_time: String? = null,
    val return_start_time: String? = null,
    val base_arrival_time: String? = null,
    val trip_completion_time: String? = null,
    val status: TripStatus,
    val purpose: String? = null,
    val notes: String? = null,
    val total_distance_km: Double? = null,
    val total_delay_minutes: Int? = null,
    val stops: List<TripStop>? = null,
    val created_at: String,
    val updated_at: String
)

data class Delay(
    val id: String,
    val trip_id: String,
    val stop_id: String? = null,
    val driver_id: String,
    val reason: String,
    val description: String? = null,
    val start_time: String,
    val end_time: String? = null,
    val duration_minutes: Int? = null,
    val is_resolved: Int = 0
)

data class Photo(
    val id: String,
    val trip_id: String,
    val stop_id: String? = null,
    val driver_id: String,
    val vehicle_id: String,
    val photo_type: String,
    val file_path: String,
    val timestamp: String,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val gps_accuracy: Double? = null
)

data class LoginResponse(
    val token: String,
    val user: User
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null,
    val error: String? = null
)

data class AppVersionInfo(
    val version: String,
    val versionCode: Int,
    val downloadUrl: String,
    val latestReleaseUrl: String,
    val mandatoryUpdate: Boolean = false
)
