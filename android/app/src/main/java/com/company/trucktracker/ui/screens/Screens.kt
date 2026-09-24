package com.company.trucktracker.ui.screens

import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.layout.ContentScale
import com.company.trucktracker.R
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.company.trucktracker.data.models.*
import com.company.trucktracker.ui.components.*
import com.company.trucktracker.ui.theme.*

// -------------------------------------------------------------
// SCREEN 1: SPLASH & SESSION LOADER
// -------------------------------------------------------------
@Composable
fun SplashScreen(isLoading: Boolean, onSessionChecked: (Boolean) -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CharcoalBg),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                shadowElevation = 8.dp,
                modifier = Modifier.padding(16.dp)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.app_logo),
                    contentDescription = "HoseXperts Official Logo",
                    modifier = Modifier
                        .padding(horizontal = 24.dp, vertical = 14.dp)
                        .height(52.dp)
                        .fillMaxWidth(0.82f),
                    contentScale = ContentScale.Fit
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("HOSEXPERTS TRUCKTRACKER", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
            Text("Corporate Logistics Fleet • Working with the flow", color = TextSecondary, fontSize = 13.sp)
            Spacer(modifier = Modifier.height(32.dp))
            if (isLoading) {
                CircularProgressIndicator(color = ChampagneGold, modifier = Modifier.size(32.dp))
            }
        }
    }
}

// -------------------------------------------------------------
// SCREEN 2: LOGIN SCREEN
// -------------------------------------------------------------
@Composable
fun LoginScreen(
    currentBaseUrl: String = "https://fleet-managment-system-638o.onrender.com/",
    onUpdateBaseUrl: (String) -> Unit = {},
    isLoading: Boolean,
    errorMessage: String?,
    isDarkTheme: Boolean = true,
    onToggleTheme: () -> Unit = {},
    onLoginSubmit: (String, String) -> Unit
) {
    var email by remember { mutableStateOf("driver@company.com") }
    var password by remember { mutableStateOf("") }
    var showServerConfig by remember { mutableStateOf(false) }
    var serverUrlInput by remember { mutableStateOf(currentBaseUrl) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color.White,
                shadowElevation = 4.dp
            ) {
                Image(
                    painter = painterResource(id = R.drawable.app_logo),
                    contentDescription = "HoseXperts Official Logo",
                    modifier = Modifier
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                        .height(36.dp)
                        .width(145.dp),
                    contentScale = ContentScale.Fit
                )
            }
            IconButton(onClick = onToggleTheme) {
                Icon(
                    if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                    contentDescription = "Toggle Theme",
                    tint = ChampagneGold,
                    modifier = Modifier.size(26.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text("Driver Sign In", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground)
        Text("Access assigned logistics routes", color = TextSecondary, fontSize = 14.sp)
        Spacer(modifier = Modifier.height(32.dp))

        if (errorMessage != null) {
            Text(
                errorMessage,
                color = StatusRed,
                fontSize = 13.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )
        }

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email / Driver ID") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                focusedTextColor = MaterialTheme.colorScheme.onBackground,
                unfocusedTextColor = MaterialTheme.colorScheme.onBackground,
                focusedLabelColor = MaterialTheme.colorScheme.primary,
                unfocusedLabelColor = MaterialTheme.colorScheme.secondary
            )
        )
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                focusedTextColor = MaterialTheme.colorScheme.onBackground,
                unfocusedTextColor = MaterialTheme.colorScheme.onBackground,
                focusedLabelColor = MaterialTheme.colorScheme.primary,
                unfocusedLabelColor = MaterialTheme.colorScheme.secondary
            )
        )
        Spacer(modifier = Modifier.height(28.dp))

        PrimaryActionButton(
            text = if (isLoading) "AUTHENTICATING..." else "SIGN IN",
            enabled = !isLoading && email.isNotEmpty() && password.isNotEmpty(),
            onClick = { onLoginSubmit(email, password) }
        )

        Spacer(modifier = Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Server: ${serverUrlInput.take(24)}...",
                color = TextMuted,
                fontSize = 11.sp
            )
            TextButton(onClick = { showServerConfig = !showServerConfig }) {
                Text(if (showServerConfig) "Hide" else "Configure", color = ChampagneGold, fontSize = 12.sp)
            }
        }

        if (showServerConfig) {
            Card(
                colors = CardDefaults.cardColors(containerColor = CharcoalCard),
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("API Base URL (HTTPS or LAN)", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = serverUrlInput,
                        onValueChange = { serverUrlInput = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = HoseXpertsBlueLight,
                            unfocusedBorderColor = CharcoalBorder,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            val cleanUrl = serverUrlInput.trim()
                            val formattedUrl = if (!cleanUrl.endsWith("/")) "$cleanUrl/" else cleanUrl
                            serverUrlInput = formattedUrl
                            onUpdateBaseUrl(formattedUrl)
                            showServerConfig = false
                        },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ChampagneGold),
                        border = androidx.compose.foundation.BorderStroke(1.dp, ChampagneGold)
                    ) {
                        Text("SAVE SERVER URL", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// SCREEN 3: DRIVER HOME
// -------------------------------------------------------------
@Composable
fun DriverHomeScreen(
    driverName: String,
    activeTrip: Trip?,
    pendingQueueCount: Int,
    updateInfo: AppVersionInfo? = null,
    onDownloadUpdate: () -> Unit = {},
    isDarkTheme: Boolean = true,
    onToggleTheme: () -> Unit = {},
    onStartTrip: () -> Unit,
    onContinueTrip: () -> Unit,
    onViewTrips: () -> Unit,
    onViewHistory: () -> Unit,
    onViewProfile: () -> Unit,
    onOpenQueue: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // App Update Banner (if newer version available from server)
        AppUpdateBanner(updateInfo = updateInfo, onUpdateClick = onDownloadUpdate)

        // Offline Banner
        OfflineQueueBanner(pendingQueueCount)

        // Top App Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("WELCOME BACK", color = ChampagneGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text(driverName, color = MaterialTheme.colorScheme.onBackground, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onToggleTheme) {
                    Icon(
                        if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                        contentDescription = "Toggle Theme",
                        tint = ChampagneGold,
                        modifier = Modifier.size(24.dp)
                    )
                }
                IconButton(onClick = onViewProfile) {
                    Icon(Icons.Default.AccountCircle, contentDescription = "Profile", tint = TextSecondary, modifier = Modifier.size(32.dp))
                }
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp)
        ) {
            if (activeTrip == null) {
                // No active trip
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No Active Route Assigned", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        Text("Check Today's Trips for newly dispatched schedules", color = TextSecondary, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(20.dp))
                        PrimaryActionButton(text = "VIEW TODAY'S SCHEDULE", onClick = onViewTrips)
                    }
                }
            } else {
                // Active trip card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
                    shape = RoundedCornerShape(16.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CharcoalBorder))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(activeTrip.trip_number, color = ChampagneGold, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            StatusBadge(activeTrip.status.name)
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Vehicle: ${activeTrip.vehicle_plate ?: "Assigned"} • ${activeTrip.vehicle_model ?: ""}",
                            color = TextPrimary,
                            fontSize = 14.sp
                        )

                        val stops = activeTrip.stops ?: emptyList()
                        val completedCount = stops.count { it.status == StopStatus.COMPLETED }
                        val currentStop = stops.firstOrNull { it.status != StopStatus.COMPLETED }

                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "PROGRESS: $completedCount OF ${stops.size} STOPS COMPLETED",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )

                        if (currentStop != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Current: Stop ${currentStop.stop_number} — ${currentStop.destination_name}",
                                color = TextPrimary,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 15.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))
                        if (activeTrip.status == TripStatus.ASSIGNED || activeTrip.status == TripStatus.PLANNED) {
                            PrimaryActionButton(text = "START TRIP", onClick = onStartTrip, icon = Icons.Default.PlayArrow)
                        } else {
                            PrimaryActionButton(text = "CONTINUE TRIP", onClick = onContinueTrip, icon = Icons.Default.Navigation)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Quick Actions Footer
            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = onViewTrips,
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Today's Trips", color = TextPrimary, fontSize = 13.sp)
                }
                OutlinedButton(
                    onClick = onViewHistory,
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("History", color = TextPrimary, fontSize = 13.sp)
                }
            }
        }
    }
}

// -------------------------------------------------------------
// SCREEN 4: TODAY'S TRIPS LIST
// -------------------------------------------------------------
@Composable
fun TodaysTripsScreen(
    trips: List<Trip>,
    onSelectTrip: (Trip) -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            Row(
                modifier = Modifier.fillMaxWidth().background(CharcoalBg).padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                }
                Text("Today's Dispatched Trips", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        },
        containerColor = CharcoalBg
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(trips) { trip ->
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onSelectTrip(trip) },
                    colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
                    shape = RoundedCornerShape(12.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CharcoalBorder))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(trip.trip_number, color = ChampagneGold, fontWeight = FontWeight.Bold)
                            StatusBadge(trip.status.name)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Departure: ${trip.planned_departure}", color = TextSecondary, fontSize = 13.sp)
                        Text("Destinations: ${trip.stops?.size ?: 0} stops", color = TextPrimary, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// SCREEN 5: TRIP DETAILS (MULTI-STOP SEQUENCE)
// -------------------------------------------------------------
@Composable
fun TripDetailScreen(
    trip: Trip,
    onStartTrip: () -> Unit,
    onOpenStop: (TripStop) -> Unit,
    onReportDelay: () -> Unit,
    onStartReturn: () -> Unit,
    onArriveBase: () -> Unit,
    onCompleteTrip: () -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            Row(
                modifier = Modifier.fillMaxWidth().background(CharcoalBg).padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                    Text(trip.trip_number, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
                StatusBadge(trip.status.name)
            }
        },
        containerColor = CharcoalBg
    ) { padding ->
        val stops = trip.stops ?: emptyList()
        val allStopsDone = stops.isNotEmpty() && stops.all { it.status == StopStatus.COMPLETED }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = CharcoalSurface), shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("ROUTE ITINERARY", color = ChampagneGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Text("Base Depot → ${stops.size} Destinations → Return Base", color = TextPrimary, fontSize = 14.sp)
                    }
                }
            }

            items(stops) { stop ->
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onOpenStop(stop) },
                    colors = CardDefaults.cardColors(containerColor = CharcoalSurface),
                    shape = RoundedCornerShape(12.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(CharcoalBorder))
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier.size(36.dp).clip(CircleShape).background(ChampagneGold.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("${stop.stop_number}", color = ChampagneGold, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(stop.destination_name ?: "Stop ${stop.stop_number}", color = TextPrimary, fontWeight = FontWeight.SemiBold)
                            Text(stop.address ?: "", color = TextSecondary, fontSize = 12.sp, maxLines = 1)
                        }
                        StatusBadge(stop.status.name)
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                when {
                    trip.status == TripStatus.PLANNED || trip.status == TripStatus.ASSIGNED -> {
                        PrimaryActionButton(text = "START ROUTE", onClick = onStartTrip)
                    }
                    trip.status == TripStatus.IN_PROGRESS && allStopsDone -> {
                        PrimaryActionButton(text = "START RETURN TO BASE", onClick = onStartReturn)
                    }
                    trip.status == TripStatus.RETURNING -> {
                        PrimaryActionButton(text = "ARRIVED AT BASE", onClick = onArriveBase)
                    }
                    trip.base_arrival_time != null && trip.status != TripStatus.COMPLETED -> {
                        PrimaryActionButton(text = "COMPLETE ENTIRE TRIP", onClick = onCompleteTrip)
                    }
                    trip.status == TripStatus.COMPLETED -> {
                        Text("✓ Trip Successfully Completed", color = StatusGreen, modifier = Modifier.fillMaxWidth().padding(16.dp))
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// SCREEN 6: STOP DETAILS
// -------------------------------------------------------------
@Composable
fun StopDetailScreen(
    stop: TripStop,
    onArrive: () -> Unit,
    onOpenActivity: () -> Unit,
    onDepart: () -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            Row(modifier = Modifier.fillMaxWidth().background(CharcoalBg).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary) }
                Text("Stop ${stop.stop_number} Details", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        },
        containerColor = CharcoalBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(20.dp)) {
            Text(stop.destination_name ?: "", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text(stop.address ?: "", fontSize = 14.sp, color = TextSecondary)
            Spacer(modifier = Modifier.height(20.dp))

            Card(colors = CardDefaults.cardColors(containerColor = CharcoalSurface), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("PLANNED ARRIVAL", color = ChampagneGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text(stop.planned_arrival ?: "On Schedule", color = TextPrimary, fontSize = 15.sp)
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            when (stop.status) {
                StopStatus.PENDING -> {
                    PrimaryActionButton(text = "ARRIVE AT STOP", onClick = onArrive)
                }
                StopStatus.ARRIVED -> {
                    PrimaryActionButton(text = "COMPLETE ACTIVITY", onClick = onOpenActivity)
                }
                StopStatus.IN_PROGRESS -> {
                    PrimaryActionButton(text = "DEPART STOP", onClick = onDepart)
                }
                StopStatus.COMPLETED -> {
                    Text("✓ Stop Completed", color = StatusGreen, fontWeight = FontWeight.Bold)
                }
                else -> {}
            }
        }
    }
}

// -------------------------------------------------------------
// SCREEN 7: ARRIVAL & GEOFENCE CHECK
// -------------------------------------------------------------
@Composable
fun ArrivalScreen(
    stop: TripStop,
    isGeofenceVerified: Boolean,
    distanceMeters: Double?,
    accuracyMeters: Float?,
    onConfirmArrival: () -> Unit,
    onRetryGps: () -> Unit,
    onBack: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(20.dp)) {
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary) }
        Text("Verify Arrival", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Text("Destination: ${stop.destination_name}", color = TextSecondary, fontSize = 14.sp)
        Spacer(modifier = Modifier.height(24.dp))

        GeofenceStatusBanner(isGeofenceVerified, distanceMeters, accuracyMeters)

        Spacer(modifier = Modifier.weight(1f))

        if (!isGeofenceVerified) {
            OutlinedButton(onClick = onRetryGps, modifier = Modifier.fillMaxWidth().height(52.dp)) {
                Text("RETRY GPS CHECK", color = ChampagneGold)
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        PrimaryActionButton(
            text = "CONFIRM ARRIVAL",
            enabled = isGeofenceVerified,
            onClick = onConfirmArrival
        )
    }
}

// -------------------------------------------------------------
// SCREEN 8: ACTIVITY SCREEN (DELIVERY / PICKUP)
// -------------------------------------------------------------
@Composable
fun ActivityScreen(
    activity: Activity?,
    hasPhotoProof: Boolean,
    onTakePhoto: () -> Unit,
    onCompleteActivity: (quantity: Int, recipient: String) -> Unit,
    onBack: () -> Unit
) {
    var quantity by remember { mutableStateOf("1") }
    var recipient by remember { mutableStateOf("") }
    val photoRequired = (activity?.photo_required ?: 0) == 1

    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(20.dp)) {
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary) }
        Text("Complete ${activity?.activity_type ?: "Activity"}", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(
            value = quantity,
            onValueChange = { quantity = it },
            label = { Text("Quantity") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(14.dp))

        OutlinedTextField(
            value = recipient,
            onValueChange = { recipient = it },
            label = { Text("Recipient Name / Signature Reference") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(20.dp))

        // Photo requirement check
        Card(colors = CardDefaults.cardColors(containerColor = CharcoalSurface), modifier = Modifier.fillMaxWidth()) {
            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.CameraAlt, contentDescription = null, tint = ChampagneGold)
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(if (photoRequired) "PHOTO REQUIRED" else "PHOTO OPTIONAL", color = TextPrimary, fontWeight = FontWeight.Bold)
                    Text(if (hasPhotoProof) "✓ Photo attached" else "No photo attached yet", color = if (hasPhotoProof) StatusGreen else TextSecondary, fontSize = 12.sp)
                }
                Button(onClick = onTakePhoto, colors = ButtonDefaults.buttonColors(containerColor = CharcoalCard)) {
                    Text("CAPTURE", color = ChampagneGold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        val canSubmit = (!photoRequired || hasPhotoProof) && recipient.isNotEmpty()
        PrimaryActionButton(
            text = "COMPLETE ACTIVITY",
            enabled = canSubmit,
            onClick = { onCompleteActivity(quantity.toIntOrNull() ?: 1, recipient) }
        )
    }
}

// -------------------------------------------------------------
// SCREEN 9: CAMERA VIEWFINDER & HARDWARE CAPTURE
// -------------------------------------------------------------
@Composable
fun CameraScreen(
    onCaptureClick: () -> Unit,
    onClose: () -> Unit
) {
    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        IconButton(onClick = onClose, modifier = Modifier.padding(16.dp).align(Alignment.TopStart)) {
            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
        }
        Text(
            "Align Proof in Frame",
            color = Color.White,
            modifier = Modifier.align(Alignment.TopCenter).padding(top = 24.dp)
        )
        FloatingActionButton(
            onClick = onCaptureClick,
            containerColor = ChampagneGold,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 36.dp).size(72.dp),
            shape = CircleShape
        ) {
            Icon(Icons.Default.Camera, contentDescription = "Capture", tint = CharcoalBg, modifier = Modifier.size(36.dp))
        }
    }
}

// -------------------------------------------------------------
// SCREEN 10: PHOTO REVIEW
// -------------------------------------------------------------
@Composable
fun PhotoReviewScreen(
    photoUri: Uri?,
    selectedCategory: String,
    onCategoryChange: (String) -> Unit,
    onRetake: () -> Unit,
    onConfirmUpload: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(20.dp)) {
        Text("Review Proof Photo", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Spacer(modifier = Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .clip(RoundedCornerShape(12.dp))
                .background(CharcoalSurface)
                .border(1.dp, CharcoalBorder, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text("Preview Image: ${photoUri?.lastPathSegment ?: "Ready"}", color = TextSecondary)
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text("Category: $selectedCategory", color = ChampagneGold, fontWeight = FontWeight.SemiBold)
        Spacer(modifier = Modifier.height(20.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedButton(onClick = onRetake, modifier = Modifier.weight(1f).height(52.dp)) {
                Text("RETAKE", color = TextPrimary)
            }
            Button(
                onClick = onConfirmUpload,
                modifier = Modifier.weight(1f).height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ChampagneGold)
            ) {
                Text("CONFIRM", color = CharcoalBg, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// -------------------------------------------------------------
// SCREEN 11: DELAY REPORT
// -------------------------------------------------------------
@Composable
fun DelayReportScreen(
    onReportSubmit: (reason: String, notes: String) -> Unit,
    onClose: () -> Unit
) {
    var selectedReason by remember { mutableStateOf("TRAFFIC") }
    var notes by remember { mutableStateOf("") }
    val reasons = listOf("TRAFFIC", "VEHICLE_BREAKDOWN", "WEATHER", "CUSTOMER_UNAVAILABLE", "LOADING_UNLOADING", "OTHER")

    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(20.dp)) {
        IconButton(onClick = onClose) { Icon(Icons.Default.Close, contentDescription = "Close", tint = TextPrimary) }
        Text("Report Active Delay", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Spacer(modifier = Modifier.height(16.dp))

        Text("SELECT REASON", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        reasons.forEach { reason ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { selectedReason = reason }
                    .padding(vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                RadioButton(selected = selectedReason == reason, onClick = { selectedReason = reason })
                Spacer(modifier = Modifier.width(8.dp))
                Text(reason.replace("_", " "), color = TextPrimary)
            }
        }

        OutlinedTextField(
            value = notes,
            onValueChange = { notes = it },
            label = { Text("Operational Notes") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.weight(1f))
        PrimaryActionButton(
            text = "SUBMIT DELAY REPORT",
            onClick = { onReportSubmit(selectedReason, notes) }
        )
    }
}

// -------------------------------------------------------------
// SCREEN 12: ACTIVE DELAY BANNER / STATE
// -------------------------------------------------------------
@Composable
fun ActiveDelayScreen(
    delayReason: String,
    startTime: String,
    onResolveDelay: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.Warning, contentDescription = null, tint = StatusRed, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text("TRIP CURRENTLY DELAYED", color = StatusRed, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("Reason: $delayReason", color = TextPrimary, fontSize = 16.sp)
        Text("Started at: $startTime", color = TextSecondary, fontSize = 13.sp)
        Spacer(modifier = Modifier.height(36.dp))
        PrimaryActionButton(text = "RESOLVE DELAY", onClick = onResolveDelay)
    }
}

// -------------------------------------------------------------
// SCREEN 13: RETURN JOURNEY
// -------------------------------------------------------------
@Composable
fun ReturnJourneyScreen(onStartReturn: () -> Unit, onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("All Stops Completed", color = StatusGreen, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text("Proceed back to Company HQ / Depot", color = TextSecondary, fontSize = 14.sp)
        Spacer(modifier = Modifier.height(32.dp))
        PrimaryActionButton(text = "START RETURN TO BASE", onClick = onStartReturn)
    }
}

// -------------------------------------------------------------
// SCREEN 14: BASE ARRIVAL
// -------------------------------------------------------------
@Composable
fun BaseArrivalScreen(onArriveBase: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("Company Depot Arrival", color = ChampagneGold, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text("Verify return to base depot gate", color = TextSecondary, fontSize = 14.sp)
        Spacer(modifier = Modifier.height(32.dp))
        PrimaryActionButton(text = "RECORD BASE ARRIVAL", onClick = onArriveBase)
    }
}

// -------------------------------------------------------------
// SCREEN 15: TRIP COMPLETION SUMMARY
// -------------------------------------------------------------
@Composable
fun TripCompletionScreen(trip: Trip, onDone: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(24.dp), verticalArrangement = Arrangement.Center) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text("Trip Successfully Completed", color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Text("Trip: ${trip.trip_number}", color = ChampagneGold, fontSize = 16.sp)
        Spacer(modifier = Modifier.height(24.dp))
        Text("Duration: ${trip.trip_completion_time ?: "Recorded"}", color = TextSecondary, fontSize = 13.sp)
        Spacer(modifier = Modifier.height(32.dp))
        PrimaryActionButton(text = "RETURN TO HOME", onClick = onDone)
    }
}

// -------------------------------------------------------------
// SCREEN 16: TRIP HISTORY
// -------------------------------------------------------------
@Composable
fun TripHistoryScreen(history: List<Trip>, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            Row(modifier = Modifier.fillMaxWidth().background(CharcoalBg).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary) }
                Text("Completed Trip History", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        },
        containerColor = CharcoalBg
    ) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp)) {
            items(history) { trip ->
                Card(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), colors = CardDefaults.cardColors(containerColor = CharcoalSurface)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(trip.trip_number, color = ChampagneGold, fontWeight = FontWeight.Bold)
                        Text("Completed: ${trip.trip_completion_time ?: "Recorded"}", color = TextSecondary, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// SCREEN 17: DRIVER PROFILE
// -------------------------------------------------------------
@Composable
fun ProfileScreen(user: User?, onLogout: () -> Unit, onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(20.dp)) {
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary) }
        Text("Driver Profile", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Spacer(modifier = Modifier.height(20.dp))
        Text("Name: ${user?.name ?: "Driver"}", color = TextPrimary, fontSize = 16.sp)
        Text("Email: ${user?.email ?: ""}", color = TextSecondary, fontSize = 14.sp)
        Text("Employee ID: ${user?.employee_id ?: "EMP-2026"}", color = TextSecondary, fontSize = 14.sp)
        Spacer(modifier = Modifier.weight(1f))
        PrimaryActionButton(text = "SIGN OUT", onClick = onLogout, containerColor = StatusRed, contentColor = Color.White)
    }
}

// -------------------------------------------------------------
// SCREEN 18: OFFLINE QUEUE / SYNC STATUS
// -------------------------------------------------------------
@Composable
fun OfflineQueueScreen(pendingCount: Int, onTriggerSync: () -> Unit, onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(20.dp)) {
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary) }
        Text("Offline Event Queue", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        Spacer(modifier = Modifier.height(16.dp))
        Text("Events pending synchronization: $pendingCount", color = TextSecondary)
        Spacer(modifier = Modifier.height(24.dp))
        PrimaryActionButton(text = "FORCE SYNC NOW", onClick = onTriggerSync)
    }
}

// -------------------------------------------------------------
// SCREEN 19: ERROR / GPS UNAVAILABLE STATE
// -------------------------------------------------------------
@Composable
fun ErrorStateScreen(errorMessage: String, onRetry: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = StatusRed, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text("GPS or Operational Error", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text(errorMessage, color = TextSecondary, fontSize = 14.sp)
        Spacer(modifier = Modifier.height(32.dp))
        PrimaryActionButton(text = "RETRY", onClick = onRetry)
    }
}

// -------------------------------------------------------------
// SCREEN 20: RUNTIME PERMISSION STATES
// -------------------------------------------------------------
@Composable
fun PermissionScreen(onRequestPermissions: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(CharcoalBg).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Icon(Icons.Default.Security, contentDescription = null, tint = ChampagneGold, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text("Hardware Permissions Required", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("TruckTracker requires Location and Camera permissions for geofence verification and proof capture.", color = TextSecondary, fontSize = 14.sp)
        Spacer(modifier = Modifier.height(32.dp))
        PrimaryActionButton(text = "GRANT PERMISSIONS", onClick = onRequestPermissions)
    }
}
