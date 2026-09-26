package com.company.trucktracker.data.models

import com.google.gson.annotations.SerializedName

enum class TripStatus {
    @SerializedName("PLANNED", alternate = ["planned"])
    PLANNED,
    @SerializedName("ASSIGNED", alternate = ["assigned"])
    ASSIGNED,
    @SerializedName("IN_PROGRESS", alternate = ["in_progress", "in-progress"])
    IN_PROGRESS,
    @SerializedName("AT_DESTINATION", alternate = ["at_destination", "at-destination"])
    AT_DESTINATION,
    @SerializedName("DELAYED", alternate = ["delayed"])
    DELAYED,
    @SerializedName("RETURNING", alternate = ["returning"])
    RETURNING,
    @SerializedName("COMPLETED", alternate = ["completed"])
    COMPLETED,
    @SerializedName("CANCELLED", alternate = ["cancelled", "canceled"])
    CANCELLED
}

enum class StopStatus {
    @SerializedName("PENDING", alternate = ["pending"])
    PENDING,
    @SerializedName("ARRIVED", alternate = ["arrived"])
    ARRIVED,
    @SerializedName("IN_PROGRESS", alternate = ["in_progress", "in-progress"])
    IN_PROGRESS,
    @SerializedName("COMPLETED", alternate = ["completed"])
    COMPLETED,
    @SerializedName("SKIPPED", alternate = ["skipped"])
    SKIPPED,
    @SerializedName("FAILED", alternate = ["failed"])
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
    @SerializedName("id")
    val id: String = "",
    @SerializedName("name")
    val name: String = "",
    @SerializedName("email")
    val email: String = "",
    @SerializedName("role")
    val role: String = "DRIVER",
    @SerializedName("phone")
    val phone: String? = null,
    @SerializedName("employee_id")
    val employee_id: String? = null,
    @SerializedName("assigned_vehicle_id")
    val assigned_vehicle_id: String? = null
)

data class Vehicle(
    @SerializedName("id")
    val id: String = "",
    @SerializedName(value = "plate_number", alternate = ["vehicle_number"])
    val plate_number: String = "",
    @SerializedName("model")
    val model: String = "",
    @SerializedName("status")
    val status: String = "ACTIVE",
    @SerializedName("current_odometer")
    val current_odometer: Double? = null
)

data class Destination(
    @SerializedName("id")
    val id: String = "",
    @SerializedName("name")
    val name: String = "",
    @SerializedName("address")
    val address: String = "",
    @SerializedName("contact_person")
    val contact_person: String? = null,
    @SerializedName("contact_phone")
    val contact_phone: String? = null,
    @SerializedName("latitude")
    val latitude: Double = 0.0,
    @SerializedName("longitude")
    val longitude: Double = 0.0,
    @SerializedName("geofence_radius")
    val geofence_radius: Double = 150.0,
    @SerializedName("is_base")
    val is_base: Int = 0
)

data class Activity(
    @SerializedName("id")
    val id: String = "",
    @SerializedName("trip_id")
    val trip_id: String = "",
    @SerializedName("stop_id")
    val stop_id: String? = null,
    @SerializedName("activity_type")
    val activity_type: String = "DELIVERY",
    @SerializedName("description")
    val description: String? = null,
    @SerializedName("quantity")
    val quantity: Int? = null,
    @SerializedName("recipient_name")
    val recipient_name: String? = null,
    @SerializedName("recipient_phone")
    val recipient_phone: String? = null,
    @SerializedName("status")
    val status: String = "PENDING",
    @SerializedName("photo_required")
    val photo_required: Int = 0,
    @SerializedName(value = "started_at", alternate = ["start_time"])
    val started_at: String? = null,
    @SerializedName(value = "completed_at", alternate = ["completion_time"])
    val completed_at: String? = null,
    @SerializedName("notes")
    val notes: String? = null
)

data class TripStop(
    @SerializedName("id")
    val id: String = "",
    @SerializedName("trip_id")
    val trip_id: String = "",
    @SerializedName("stop_number")
    val stop_number: Int = 1,
    @SerializedName("destination_id")
    val destination_id: String? = null,
    @SerializedName("destination_name")
    val destination_name: String? = null,
    @SerializedName("address")
    val address: String? = null,
    @SerializedName("latitude")
    val latitude: Double = 0.0,
    @SerializedName("longitude")
    val longitude: Double = 0.0,
    @SerializedName(value = "geofence_radius", alternate = ["geofence_radius_meters"])
    val geofence_radius: Double = 150.0,
    @SerializedName(value = "planned_arrival", alternate = ["planned_arrival_time"])
    val planned_arrival: String? = null,
    @SerializedName("actual_arrival_time")
    val actual_arrival_time: String? = null,
    @SerializedName("actual_departure_time")
    val actual_departure_time: String? = null,
    @SerializedName("status")
    val status: StopStatus = StopStatus.PENDING,
    @SerializedName("notes")
    val notes: String? = null,
    @SerializedName("activity")
    val singleActivity: Activity? = null,
    @SerializedName("activities")
    val activities: List<Activity>? = null,
    @SerializedName("photos")
    val photos: List<Photo>? = null,
    @SerializedName("delays")
    val delays: List<Delay>? = null
) {
    val activity: Activity?
        get() = singleActivity ?: activities?.firstOrNull()
}

data class Trip(
    @SerializedName(value = "id", alternate = ["trip_id"])
    val id: String = "",
    @SerializedName(value = "trip_number", alternate = ["reference_number", "tripNumber"])
    val trip_number: String = "",
    @SerializedName("driver_id")
    val driver_id: String = "",
    @SerializedName(value = "driver_name", alternate = ["driverName"])
    val driver_name: String? = null,
    @SerializedName("vehicle_id")
    val vehicle_id: String = "",
    @SerializedName(value = "vehicle_plate", alternate = ["vehicle_number", "vehicleNumber", "plate_number"])
    val vehicle_plate: String? = null,
    @SerializedName(value = "vehicle_model", alternate = ["model"])
    val vehicle_model: String? = null,
    @SerializedName(value = "starting_location_id", alternate = ["startingLocationId"])
    val starting_location_id: String? = null,
    @SerializedName(value = "starting_location_name", alternate = ["starting_location", "startingLocation"])
    val starting_location_name: String? = null,
    @SerializedName(value = "planned_departure", alternate = ["planned_departure_time", "plannedDepartureTime"])
    val planned_departure: String = "08:00",
    @SerializedName("actual_start_time")
    val actual_start_time: String? = null,
    @SerializedName("return_start_time")
    val return_start_time: String? = null,
    @SerializedName("base_arrival_time")
    val base_arrival_time: String? = null,
    @SerializedName(value = "trip_completion_time", alternate = ["completion_time"])
    val trip_completion_time: String? = null,
    @SerializedName("status")
    val status: TripStatus = TripStatus.ASSIGNED,
    @SerializedName("purpose")
    val purpose: String? = null,
    @SerializedName("notes")
    val notes: String? = null,
    @SerializedName(value = "total_distance_km", alternate = ["calculated_distance_km"])
    val total_distance_km: Double? = null,
    @SerializedName("total_delay_minutes")
    val total_delay_minutes: Int? = null,
    @SerializedName("stops")
    val stops: List<TripStop>? = null,
    @SerializedName("created_at")
    val created_at: String? = null,
    @SerializedName("updated_at")
    val updated_at: String? = null
) {
    val displayTripNumber: String
        get() = if (trip_number.isNotBlank()) trip_number else id
}

data class Delay(
    @SerializedName("id")
    val id: String = "",
    @SerializedName("trip_id")
    val trip_id: String = "",
    @SerializedName("stop_id")
    val stop_id: String? = null,
    @SerializedName("driver_id")
    val driver_id: String = "",
    @SerializedName("reason")
    val reason: String = "OTHER",
    @SerializedName("description")
    val description: String? = null,
    @SerializedName("start_time")
    val start_time: String = "",
    @SerializedName("end_time")
    val end_time: String? = null,
    @SerializedName("duration_minutes")
    val duration_minutes: Int? = null,
    @SerializedName("is_resolved")
    val is_resolved: Int = 0
)

data class Photo(
    @SerializedName("id")
    val id: String = "",
    @SerializedName("trip_id")
    val trip_id: String = "",
    @SerializedName("stop_id")
    val stop_id: String? = null,
    @SerializedName("driver_id")
    val driver_id: String = "",
    @SerializedName("vehicle_id")
    val vehicle_id: String = "",
    @SerializedName("photo_type")
    val photo_type: String = "DELIVERY_PROOF",
    @SerializedName("file_path")
    val file_path: String = "",
    @SerializedName("timestamp")
    val timestamp: String = "",
    @SerializedName("latitude")
    val latitude: Double? = null,
    @SerializedName("longitude")
    val longitude: Double? = null,
    @SerializedName("gps_accuracy")
    val gps_accuracy: Double? = null
)

data class LoginResponse(
    @SerializedName("token")
    val token: String = "",
    @SerializedName("user")
    val user: User
)

data class ApiResponse<T>(
    @SerializedName("success")
    val success: Boolean = true,
    @SerializedName("data")
    val data: T? = null,
    @SerializedName("message")
    val message: String? = null,
    @SerializedName("error")
    val error: String? = null
)

data class AppVersionInfo(
    @SerializedName("version")
    val version: String = "",
    @SerializedName("versionCode")
    val versionCode: Int = 1,
    @SerializedName("downloadUrl")
    val downloadUrl: String = "",
    @SerializedName("latestReleaseUrl")
    val latestReleaseUrl: String = "",
    @SerializedName("mandatoryUpdate")
    val mandatoryUpdate: Boolean = false,
    @SerializedName("releaseNotes")
    val releaseNotes: String? = null
)
