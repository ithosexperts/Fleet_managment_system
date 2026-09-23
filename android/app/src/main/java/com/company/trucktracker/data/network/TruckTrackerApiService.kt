package com.company.trucktracker.data.network

import com.company.trucktracker.data.models.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface TruckTrackerApiService {

    // Auth
    @POST("api/auth/login")
    suspend fun login(@Body body: Map<String, String>): Response<ApiResponse<LoginResponse>>

    @GET("api/auth/me")
    suspend fun getMe(): Response<ApiResponse<User>>

    // Driver Operations
    @GET("api/driver/assigned-trip")
    suspend fun getAssignedTrip(): Response<ApiResponse<Trip?>>

    @GET("api/driver/todays-trips")
    suspend fun getTodaysTrips(): Response<ApiResponse<List<Trip>>>

    @GET("api/driver/history")
    suspend fun getTripHistory(): Response<ApiResponse<List<Trip>>>

    @GET("api/trips/{id}")
    suspend fun getTripDetails(@Path("id") tripId: String): Response<ApiResponse<Trip>>

    @POST("api/driver/trips/{id}/start")
    suspend fun startTrip(
        @Path("id") tripId: String,
        @Body body: Map<String, Any?>
    ): Response<ApiResponse<Trip>>

    @POST("api/driver/stops/{id}/arrive")
    suspend fun arriveStop(
        @Path("id") stopId: String,
        @Body body: Map<String, Any?>
    ): Response<ApiResponse<TripStop>>

    @POST("api/driver/stops/{id}/activity")
    suspend fun completeActivity(
        @Path("id") stopId: String,
        @Body body: Map<String, Any?>
    ): Response<ApiResponse<TripStop>>

    @POST("api/driver/stops/{id}/depart")
    suspend fun departStop(
        @Path("id") stopId: String,
        @Body body: Map<String, Any?>
    ): Response<ApiResponse<TripStop>>

    @POST("api/driver/trips/{id}/delay")
    suspend fun reportDelay(
        @Path("id") tripId: String,
        @Body body: Map<String, Any?>
    ): Response<ApiResponse<Delay>>

    @POST("api/driver/delays/{id}/resolve")
    suspend fun resolveDelay(
        @Path("id") delayId: String,
        @Body body: Map<String, Any?>
    ): Response<ApiResponse<Delay>>

    @POST("api/driver/trips/{id}/start-return")
    suspend fun startReturn(
        @Path("id") tripId: String,
        @Body body: Map<String, Any?>
    ): Response<ApiResponse<Trip>>

    @POST("api/driver/trips/{id}/arrive-base")
    suspend fun arriveBase(
        @Path("id") tripId: String,
        @Body body: Map<String, Any?>
    ): Response<ApiResponse<Trip>>

    @POST("api/driver/trips/{id}/complete")
    suspend fun completeTrip(
        @Path("id") tripId: String,
        @Body body: Map<String, Any?>
    ): Response<ApiResponse<Trip>>

    // Photo Upload
    @Multipart
    @POST("api/photos/upload")
    suspend fun uploadPhoto(
        @Part photo: MultipartBody.Part,
        @Part("trip_id") tripId: RequestBody,
        @Part("stop_id") stopId: RequestBody?,
        @Part("photo_type") photoType: RequestBody,
        @Part("latitude") latitude: RequestBody?,
        @Part("longitude") longitude: RequestBody?,
        @Part("gps_accuracy") accuracy: RequestBody?
    ): Response<ApiResponse<Photo>>

    // Telemetry & Version Sync
    @GET("api/app-version")
    suspend fun getAppVersion(): Response<AppVersionInfo>
}
