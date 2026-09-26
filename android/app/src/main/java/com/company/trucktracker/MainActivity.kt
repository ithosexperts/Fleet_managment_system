package com.company.trucktracker

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import android.content.Intent
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.company.trucktracker.data.models.*
import com.company.trucktracker.location.LocationResult
import com.company.trucktracker.ui.components.AppUpdateDialog
import com.company.trucktracker.ui.screens.*
import com.company.trucktracker.ui.theme.TruckTrackerTheme
import com.company.trucktracker.utils.AppUpdateManager
import kotlinx.coroutines.launch
import java.io.File

class MainActivity : ComponentActivity() {

    private lateinit var app: TruckTrackerApp

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineLocationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false

        if (!fineLocationGranted || !cameraGranted) {
            Toast.makeText(
                this,
                "Location and Camera permissions are required for route operation",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        app = application as TruckTrackerApp

        requestHardwarePermissions()

        setContent {
            var isDarkTheme by remember { mutableStateOf<Boolean>(app.apiClient.preferenceManager.isDarkTheme()) }
            TruckTrackerTheme(darkTheme = isDarkTheme) {
                MainAppHost(
                    app = app,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = {
                        val newMode = isDarkTheme.not()
                        isDarkTheme = newMode
                        app.apiClient.preferenceManager.setDarkTheme(newMode)
                    }
                )
            }
        }
    }

    private fun requestHardwarePermissions() {
        try {
            val fineLocation = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            val camera = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)

            if (fineLocation != PackageManager.PERMISSION_GRANTED || camera != PackageManager.PERMISSION_GRANTED) {
                permissionLauncher.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.CAMERA
                    )
                )
            }
        } catch (e: Throwable) {}
    }
}

@Composable
fun MainAppHost(
    app: TruckTrackerApp,
    isDarkTheme: Boolean = true,
    onToggleTheme: () -> Unit = {}
) {
    var currentScreen by remember { mutableStateOf("SPLASH") }
    var currentUser by remember { mutableStateOf<User?>(app.driverRepository.getCurrentUser()) }
    var activeTrip by remember { mutableStateOf<Trip?>(null) }
    var selectedStop by remember { mutableStateOf<TripStop?>(null) }
    var todaysTrips by remember { mutableStateOf<List<Trip>>(emptyList()) }
    var tripHistory by remember { mutableStateOf<List<Trip>>(emptyList()) }
    var selectedLanguage by remember { mutableStateOf(AppLanguage.ENGLISH) }

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Geofence and GPS state
    var isGeofenceVerified by remember { mutableStateOf(false) }
    var geofenceDistance by remember { mutableStateOf<Double?>(null) }
    var gpsAccuracy by remember { mutableStateOf<Float?>(null) }
    var hasPhotoProof by remember { mutableStateOf(false) }

    // Context & App Version Telemetry Check
    val context = LocalContext.current
    var updateInfo by remember { mutableStateOf<AppVersionInfo?>(null) }
    var showUpdateDialog by remember { mutableStateOf(false) }
    var isDownloadingUpdate by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableStateOf(0f) }
    var downloadedBytes by remember { mutableStateOf(0L) }
    var totalBytes by remember { mutableStateOf(0L) }
    var downloadError by remember { mutableStateOf<String?>(null) }
    var downloadedApkFile by remember { mutableStateOf<File?>(null) }
    var isReadyToInstall by remember { mutableStateOf(false) }

    // Offline queue counter
    val pendingQueueCount by app.driverRepository.getPendingEventCountFlow().collectAsState(initial = 0)
    val scope = rememberCoroutineScope()

    val currentVersionCode = try {
        BuildConfig.VERSION_CODE
    } catch (_: Throwable) {
        2
    }

    val triggerUpdateDownload: (AppVersionInfo) -> Unit = { info ->
        isDownloadingUpdate = true
        downloadProgress = 0f
        downloadedBytes = 0L
        totalBytes = 0L
        downloadError = null
        isReadyToInstall = false
        scope.launch {
            val res = AppUpdateManager.downloadApk(
                context = context,
                downloadUrl = info.downloadUrl,
                baseUrl = app.apiClient.preferenceManager.getBaseUrl(),
                onProgress = { p, bytes, total ->
                    downloadProgress = p
                    downloadedBytes = bytes
                    totalBytes = total
                }
            )
            isDownloadingUpdate = false
            if (res.isSuccess) {
                val file = res.getOrNull()
                downloadedApkFile = file
                isReadyToInstall = true
                if (file != null) {
                    AppUpdateManager.installApk(context, file)
                }
            } else {
                downloadError = res.exceptionOrNull()?.message ?: "Failed to download update package"
            }
        }
    }

    // Background App Version Check on app startup
    LaunchedEffect(Unit) {
        try {
            val info = AppUpdateManager.checkForUpdate(app.apiClient, currentVersionCode)
            if (info != null) {
                updateInfo = info
                showUpdateDialog = true
            }
        } catch (_: Throwable) {}
    }

    // Splash session check
    LaunchedEffect(Unit) {
        val user = app.driverRepository.getCurrentUser()
        if (user != null) {
            currentUser = user
            // Load assigned trip
            val res = app.driverRepository.getAssignedTrip()
            activeTrip = res.getOrNull()
            currentScreen = "HOME"
        } else {
            currentScreen = "LOGIN"
        }
    }

    when (currentScreen) {
        "SPLASH" -> {
            SplashScreen(isLoading = true, onSessionChecked = {})
        }

        "LOGIN" -> {
            LoginScreen(
                currentBaseUrl = app.apiClient.preferenceManager.getBaseUrl(),
                onUpdateBaseUrl = { url -> app.apiClient.preferenceManager.saveBaseUrl(url) },
                isLoading = isLoading,
                errorMessage = errorMessage,
                isDarkTheme = isDarkTheme,
                onToggleTheme = onToggleTheme,
                onLoginSubmit = { email, password ->
                    isLoading = true
                    errorMessage = null
                    scope.launch {
                        try {
                            val result = app.driverRepository.login(email, password)
                            isLoading = false
                            if (result.isSuccess) {
                                currentUser = result.getOrNull()
                                try {
                                    val tripRes = app.driverRepository.getAssignedTrip()
                                    activeTrip = tripRes.getOrNull()
                                } catch (e: Throwable) {
                                    activeTrip = null
                                }
                                currentScreen = "HOME"
                            } else {
                                errorMessage = result.exceptionOrNull()?.message ?: "Login failed"
                            }
                        } catch (e: Throwable) {
                            isLoading = false
                            errorMessage = e.message ?: "Connection error. Please check server URL."
                        }
                    }
                }
            )
        }

        "HOME" -> {
            DriverHomeScreen(
                driverName = currentUser?.name ?: "Driver",
                activeTrip = activeTrip,
                pendingQueueCount = pendingQueueCount,
                updateInfo = updateInfo,
                onDownloadUpdate = {
                    if (updateInfo != null) {
                        showUpdateDialog = true
                    } else {
                        scope.launch {
                            val info = AppUpdateManager.checkForUpdate(app.apiClient, currentVersionCode)
                            if (info != null) {
                                updateInfo = info
                                showUpdateDialog = true
                            } else {
                                Toast.makeText(context, "App is up to date", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                },
                isDarkTheme = isDarkTheme,
                onToggleTheme = onToggleTheme,
                selectedLanguage = selectedLanguage,
                onStartTrip = {
                    activeTrip?.let { trip ->
                        scope.launch {
                            app.driverRepository.executeAction(
                                eventType = "TRIP_START",
                                entityId = trip.id,
                                payload = mutableMapOf()
                            )
                            val updated = app.driverRepository.getAssignedTrip()
                            activeTrip = updated.getOrNull()
                        }
                    }
                },
                onContinueTrip = { currentScreen = "TRIP_DETAIL" },
                onViewTrips = {
                    scope.launch {
                        val res = app.driverRepository.getTodaysTrips()
                        todaysTrips = res.getOrDefault(emptyList())
                        currentScreen = "TODAYS_TRIPS"
                    }
                },
                onViewHistory = {
                    scope.launch {
                        val res = app.driverRepository.getTripHistory()
                        tripHistory = res.getOrDefault(emptyList())
                        currentScreen = "HISTORY"
                    }
                },
                onViewProfile = { currentScreen = "PROFILE" },
                onOpenQueue = { currentScreen = "OFFLINE_QUEUE" }
            )
        }

        "TODAYS_TRIPS" -> {
            TodaysTripsScreen(
                trips = todaysTrips,
                onSelectTrip = { trip ->
                    activeTrip = trip
                    currentScreen = "TRIP_DETAIL"
                },
                onBack = { currentScreen = "HOME" }
            )
        }

        "TRIP_DETAIL" -> {
            val trip = activeTrip
            if (trip != null) {
                TripDetailScreen(
                    trip = trip,
                    onStartTrip = {
                        scope.launch {
                            app.driverRepository.executeAction("TRIP_START", trip.id, mutableMapOf())
                            val updated = app.driverRepository.getAssignedTrip()
                            activeTrip = updated.getOrNull()
                        }
                    },
                    onOpenStop = { stop ->
                        selectedStop = stop
                        currentScreen = "STOP_DETAIL"
                    },
                    onReportDelay = { currentScreen = "DELAY_REPORT" },
                    onStartReturn = {
                        scope.launch {
                            app.driverRepository.executeAction("RETURN_START", trip.id, mutableMapOf())
                            val updated = app.driverRepository.getAssignedTrip()
                            activeTrip = updated.getOrNull()
                        }
                    },
                    onArriveBase = {
                        scope.launch {
                            app.driverRepository.executeAction("BASE_ARRIVAL", trip.id, mutableMapOf())
                            val updated = app.driverRepository.getAssignedTrip()
                            activeTrip = updated.getOrNull()
                        }
                    },
                    onCompleteTrip = {
                        scope.launch {
                            app.driverRepository.executeAction("TRIP_COMPLETE", trip.id, mutableMapOf())
                            currentScreen = "COMPLETION"
                        }
                    },
                    onBack = { currentScreen = "HOME" }
                )
            } else {
                currentScreen = "HOME"
            }
        }

        "STOP_DETAIL" -> {
            val stop = selectedStop
            if (stop != null) {
                StopDetailScreen(
                    stop = stop,
                    onArrive = {
                        scope.launch {
                            // Obtain device GPS and test geofence
                            val loc = app.locationService.getCurrentLocation()
                            if (loc is LocationResult.Success) {
                                val (verified, dist) = app.locationService.verifyGeofence(
                                    loc.latitude, loc.longitude,
                                    stop.latitude, stop.longitude,
                                    stop.geofence_radius
                                )
                                isGeofenceVerified = verified
                                geofenceDistance = dist
                                gpsAccuracy = loc.accuracyMeters
                            } else {
                                isGeofenceVerified = false
                                geofenceDistance = null
                                gpsAccuracy = null
                            }
                            currentScreen = "ARRIVAL"
                        }
                    },
                    onOpenActivity = { currentScreen = "ACTIVITY" },
                    onDepart = {
                        scope.launch {
                            val payload = mutableMapOf<String, Any?>()
                            val loc = app.locationService.getCurrentLocation()
                            if (loc is LocationResult.Success) {
                                payload["latitude"] = loc.latitude
                                payload["longitude"] = loc.longitude
                                payload["gps_accuracy"] = loc.accuracyMeters
                            } else {
                                payload["latitude"] = stop.latitude
                                payload["longitude"] = stop.longitude
                                payload["gps_accuracy"] = 10.0
                            }
                            app.driverRepository.executeAction("STOP_DEPARTURE", stop.id, payload)
                            val updated = app.driverRepository.getAssignedTrip()
                            activeTrip = updated.getOrNull()
                            currentScreen = "TRIP_DETAIL"
                        }
                    },
                    onBack = { currentScreen = "TRIP_DETAIL" }
                )
            }
        }

        "ARRIVAL" -> {
            val stop = selectedStop
            if (stop != null) {
                ArrivalScreen(
                    stop = stop,
                    isGeofenceVerified = isGeofenceVerified,
                    distanceMeters = geofenceDistance,
                    accuracyMeters = gpsAccuracy,
                    onSimulateArrival = {
                        isGeofenceVerified = true
                        geofenceDistance = 15.0
                        gpsAccuracy = 5f
                    },
                    onRetryGps = {
                        scope.launch {
                            val loc = app.locationService.getCurrentLocation()
                            if (loc is LocationResult.Success) {
                                val (verified, dist) = app.locationService.verifyGeofence(
                                    loc.latitude, loc.longitude,
                                    stop.latitude, stop.longitude,
                                    stop.geofence_radius
                                )
                                isGeofenceVerified = verified
                                geofenceDistance = dist
                                gpsAccuracy = loc.accuracyMeters
                            }
                        }
                    },
                    onConfirmArrival = {
                        scope.launch {
                            val payload = mutableMapOf<String, Any?>()
                            val loc = app.locationService.getCurrentLocation()
                            if (loc is LocationResult.Success) {
                                payload["latitude"] = loc.latitude
                                payload["longitude"] = loc.longitude
                                payload["gps_accuracy"] = loc.accuracyMeters
                            } else {
                                payload["latitude"] = stop.latitude
                                payload["longitude"] = stop.longitude
                                payload["gps_accuracy"] = 10.0
                            }
                            app.driverRepository.executeAction("STOP_ARRIVAL", stop.id, payload)
                            val updated = app.driverRepository.getAssignedTrip()
                            activeTrip = updated.getOrNull()
                            selectedStop = activeTrip?.stops?.find { it.id == stop.id }
                            currentScreen = "STOP_DETAIL"
                        }
                    },
                    onBack = { currentScreen = "STOP_DETAIL" }
                )
            }
        }

        "ACTIVITY" -> {
            val stop = selectedStop
            ActivityScreen(
                activity = stop?.activity,
                hasPhotoProof = hasPhotoProof,
                onTakePhoto = { currentScreen = "CAMERA" },
                onCompleteActivity = { qty, recipient ->
                    scope.launch {
                        stop?.let {
                            val payload = mutableMapOf<String, Any?>(
                                "status" to "COMPLETED",
                                "quantity" to qty,
                                "recipient_name" to recipient
                            )
                            app.driverRepository.executeAction(
                                eventType = "ACTIVITY_COMPLETION",
                                entityId = it.id,
                                payload = payload
                            )
                            val updated = app.driverRepository.getAssignedTrip()
                            activeTrip = updated.getOrNull()
                            selectedStop = activeTrip?.stops?.find { s -> s.id == it.id }
                            hasPhotoProof = false
                            currentScreen = "STOP_DETAIL"
                        }
                    }
                },
                onBack = { currentScreen = "STOP_DETAIL" }
            )
        }

        "CAMERA" -> {
            CameraScreen(
                onCaptureClick = { currentScreen = "PHOTO_REVIEW" },
                onClose = { currentScreen = "ACTIVITY" }
            )
        }

        "PHOTO_REVIEW" -> {
            PhotoReviewScreen(
                photoUri = null,
                selectedCategory = "DELIVERY_PROOF",
                onCategoryChange = {},
                onRetake = { currentScreen = "CAMERA" },
                onConfirmUpload = {
                    hasPhotoProof = true
                    currentScreen = "ACTIVITY"
                }
            )
        }

        "DELAY_REPORT" -> {
            DelayReportScreen(
                onReportSubmit = { reason, notes ->
                    scope.launch {
                        activeTrip?.let { trip ->
                            app.driverRepository.executeAction(
                                eventType = "DELAY_START",
                                entityId = trip.id,
                                payload = mutableMapOf("reason" to reason, "description" to notes)
                            )
                            val updated = app.driverRepository.getAssignedTrip()
                            activeTrip = updated.getOrNull()
                            currentScreen = "ACTIVE_DELAY"
                        }
                    }
                },
                onClose = { currentScreen = "TRIP_DETAIL" }
            )
        }

        "ACTIVE_DELAY" -> {
            ActiveDelayScreen(
                delayReason = "Traffic Congestion",
                startTime = "Recorded",
                onResolveDelay = {
                    scope.launch {
                        activeTrip?.let { trip ->
                            val delayId = trip.stops?.flatMap { it.delays ?: emptyList() }?.firstOrNull()?.id ?: ""
                            app.driverRepository.executeAction("DELAY_RESOLVE", delayId, mutableMapOf())
                            val updated = app.driverRepository.getAssignedTrip()
                            activeTrip = updated.getOrNull()
                            currentScreen = "TRIP_DETAIL"
                        }
                    }
                }
            )
        }

        "COMPLETION" -> {
            activeTrip?.let { trip ->
                TripCompletionScreen(trip = trip, onDone = {
                    activeTrip = null
                    currentScreen = "HOME"
                })
            }
        }

        "HISTORY" -> {
            TripHistoryScreen(history = tripHistory, onBack = { currentScreen = "HOME" })
        }

        "PROFILE" -> {
            ProfileScreen(
                user = currentUser,
                onCheckUpdate = {
                    scope.launch {
                        Toast.makeText(context, "Checking for latest updates...", Toast.LENGTH_SHORT).show()
                        val info = AppUpdateManager.checkForUpdate(app.apiClient, currentVersionCode)
                        if (info != null) {
                            updateInfo = info
                            showUpdateDialog = true
                        } else {
                            Toast.makeText(context, "TruckTracker is up to date (v${BuildConfig.VERSION_NAME})", Toast.LENGTH_LONG).show()
                        }
                    }
                },
                onLogout = {
                    app.driverRepository.logout()
                    currentUser = null
                    activeTrip = null
                    currentScreen = "LOGIN"
                },
                onBack = { currentScreen = "HOME" }
            )
        }

        "OFFLINE_QUEUE" -> {
            OfflineQueueScreen(
                pendingCount = pendingQueueCount,
                onTriggerSync = {
                    scope.launch {
                        app.syncManager.triggerSync()
                    }
                },
                onBack = { currentScreen = "HOME" }
            )
        }
    }

    // In-App Auto-Update Dialog (OTA Overlay)
    if (showUpdateDialog && updateInfo != null) {
        AppUpdateDialog(
            updateInfo = updateInfo!!,
            isDownloading = isDownloadingUpdate,
            downloadProgress = downloadProgress,
            downloadedBytes = downloadedBytes,
            totalBytes = totalBytes,
            downloadError = downloadError,
            isReadyToInstall = isReadyToInstall,
            onStartDownload = {
                triggerUpdateDownload(updateInfo!!)
            },
            onInstall = {
                downloadedApkFile?.let { apk ->
                    AppUpdateManager.installApk(context, apk)
                }
            },
            onDismiss = {
                showUpdateDialog = false
            }
        )
    }
}
