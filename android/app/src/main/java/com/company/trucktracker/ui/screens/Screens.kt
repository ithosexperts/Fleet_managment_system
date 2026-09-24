package com.company.trucktracker.ui.screens

import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.company.trucktracker.R
import com.company.trucktracker.data.models.*
import com.company.trucktracker.ui.components.*
import com.company.trucktracker.ui.theme.*

// ─────────────────────────────────────────────────────────────────────────
// LANGUAGE SUPPORT
// ─────────────────────────────────────────────────────────────────────────
enum class AppLanguage(val displayName: String, val code: String) {
    ENGLISH("English", "en"),
    URDU("اردو", "ur")
}

object AppStrings {
    // Login
    fun loginTitle(lang: AppLanguage) = if (lang == AppLanguage.URDU) "ڈرائیور سائن ان" else "Driver Sign In"
    fun loginSubtitle(lang: AppLanguage) = if (lang == AppLanguage.URDU) "لاجسٹکس روٹس تک رسائی" else "Access your assigned logistics routes"
    fun emailLabel(lang: AppLanguage) = if (lang == AppLanguage.URDU) "ای میل / ڈرائیور ID" else "Email / Driver ID"
    fun passwordLabel(lang: AppLanguage) = if (lang == AppLanguage.URDU) "پاس ورڈ" else "Password"
    fun signIn(lang: AppLanguage) = if (lang == AppLanguage.URDU) "سائن ان کریں" else "SIGN IN"
    fun authenticating(lang: AppLanguage) = if (lang == AppLanguage.URDU) "تصدیق ہو رہی ہے..." else "AUTHENTICATING..."
    // Home
    fun welcome(lang: AppLanguage) = if (lang == AppLanguage.URDU) "خوش آمدید" else "WELCOME BACK"
    fun noActiveTrip(lang: AppLanguage) = if (lang == AppLanguage.URDU) "کوئی فعال روٹ نہیں" else "No Active Route Assigned"
    fun noActiveTripSub(lang: AppLanguage) = if (lang == AppLanguage.URDU) "آج کے ٹرپس چیک کریں" else "Check Today's Trips for new dispatches"
    fun viewSchedule(lang: AppLanguage) = if (lang == AppLanguage.URDU) "آج کا شیڈول دیکھیں" else "VIEW TODAY'S SCHEDULE"
    fun todayTrips(lang: AppLanguage) = if (lang == AppLanguage.URDU) "آج کے ٹرپس" else "Today's Trips"
    fun history(lang: AppLanguage) = if (lang == AppLanguage.URDU) "تاریخ" else "History"
    fun liveTrips(lang: AppLanguage) = if (lang == AppLanguage.URDU) "لائیو ٹرپس" else "Live Trips"
    fun profile(lang: AppLanguage) = if (lang == AppLanguage.URDU) "پروفائل" else "Profile"
    fun startTrip(lang: AppLanguage) = if (lang == AppLanguage.URDU) "ٹرپ شروع کریں" else "START TRIP"
    fun continueTrip(lang: AppLanguage) = if (lang == AppLanguage.URDU) "ٹرپ جاری رکھیں" else "CONTINUE TRIP"
    fun signOut(lang: AppLanguage) = if (lang == AppLanguage.URDU) "سائن آؤٹ" else "SIGN OUT"
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 1: SPLASH / SESSION LOADER
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun SplashScreen(isLoading: Boolean, onSessionChecked: (Boolean) -> Unit) {
    val gradientBrush = Brush.verticalGradient(
        colors = listOf(CharcoalBg, Color(0xFF0D1A2E), CharcoalBg)
    )
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(gradientBrush),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo card with subtle glow
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color.White,
                shadowElevation = 20.dp,
                modifier = Modifier
                    .shadow(
                        elevation = 24.dp,
                        shape = RoundedCornerShape(20.dp),
                        ambientColor = HoseXpertsBlue.copy(alpha = 0.4f),
                        spotColor = HoseXpertsBlue.copy(alpha = 0.4f)
                    )
            ) {
                Image(
                    painter = painterResource(id = R.drawable.app_logo),
                    contentDescription = "HoseXperts Logo",
                    modifier = Modifier
                        .padding(horizontal = 28.dp, vertical = 18.dp)
                        .height(58.dp)
                        .fillMaxWidth(0.78f),
                    contentScale = ContentScale.Fit
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                "HOSEXPERTS TRUCKTRACKER",
                color = TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 2.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "Corporate Fleet Logistics Platform",
                color = HoseXpertsBlueLight,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(48.dp))

            if (isLoading) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(
                        color = HoseXpertsBlue,
                        modifier = Modifier.size(36.dp),
                        strokeWidth = 3.dp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Verifying session...", color = TextMuted, fontSize = 12.sp)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 2: LOGIN SCREEN — Professional with password toggle + language
// ─────────────────────────────────────────────────────────────────────────
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
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var showServerConfig by remember { mutableStateOf(false) }
    var serverUrlInput by remember { mutableStateOf(currentBaseUrl) }
    var selectedLanguage by remember { mutableStateOf(AppLanguage.ENGLISH) }
    var showLanguagePicker by remember { mutableStateOf(false) }

    val lang = selectedLanguage

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Subtle top gradient accent
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            HoseXpertsBlueDark.copy(alpha = if (isDarkTheme) 0.25f else 0.08f),
                            Color.Transparent
                        )
                    )
                )
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Center
        ) {
            item {
                // ── Top row: logo + theme + language ──
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color.White,
                        shadowElevation = 6.dp,
                        modifier = Modifier.shadow(
                            8.dp, RoundedCornerShape(12.dp),
                            ambientColor = HoseXpertsBlue.copy(alpha = 0.3f),
                            spotColor = HoseXpertsBlue.copy(alpha = 0.3f)
                        )
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.app_logo),
                            contentDescription = "HoseXperts Logo",
                            modifier = Modifier
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                                .height(34.dp)
                                .width(138.dp),
                            contentScale = ContentScale.Fit
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        // Language button
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.clickable { showLanguagePicker = !showLanguagePicker }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    Icons.Default.Language,
                                    contentDescription = "Language",
                                    tint = HoseXpertsBlueLight,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    lang.code.uppercase(),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        // Theme toggle
                        IconButton(onClick = onToggleTheme, modifier = Modifier.size(40.dp)) {
                            Icon(
                                if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                                contentDescription = "Toggle Theme",
                                tint = HoseXpertsBlueLight,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }

                // Language picker dropdown
                AnimatedVisibility(
                    visible = showLanguagePicker,
                    enter = fadeIn() + expandVertically(),
                    exit = fadeOut() + shrinkVertically()
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(
                                "Select Language / زبان منتخب کریں",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                            )
                            AppLanguage.values().forEach { language ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable {
                                            selectedLanguage = language
                                            showLanguagePicker = false
                                        }
                                        .background(
                                            if (selectedLanguage == language)
                                                HoseXpertsBlue.copy(alpha = 0.15f)
                                            else Color.Transparent
                                        )
                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    if (selectedLanguage == language) {
                                        Icon(
                                            Icons.Default.Check,
                                            contentDescription = null,
                                            tint = HoseXpertsBlue,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    } else {
                                        Spacer(modifier = Modifier.size(16.dp))
                                    }
                                    Text(
                                        language.displayName,
                                        color = if (selectedLanguage == language)
                                            HoseXpertsBlue
                                        else MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontWeight = if (selectedLanguage == language)
                                            FontWeight.Bold else FontWeight.Normal,
                                        fontSize = 15.sp
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                // ── Headline ──
                Text(
                    AppStrings.loginTitle(lang),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onBackground,
                    fontWeight = FontWeight.ExtraBold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    AppStrings.loginSubtitle(lang),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 14.sp
                )

                Spacer(modifier = Modifier.height(28.dp))

                // ── Error Banner ──
                AnimatedVisibility(visible = errorMessage != null) {
                    if (errorMessage != null) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = StatusRed.copy(alpha = 0.12f),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, StatusRed.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    Icons.Default.ErrorOutline,
                                    contentDescription = null,
                                    tint = StatusRed,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(errorMessage, color = StatusRed, fontSize = 13.sp)
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }

                // ── Email Field ──
                PremiumTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = AppStrings.emailLabel(lang),
                    leadingIcon = Icons.Default.Email,
                    isDarkTheme = isDarkTheme
                )
                Spacer(modifier = Modifier.height(14.dp))

                // ── Password Field with show/hide toggle ──
                PremiumTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = AppStrings.passwordLabel(lang),
                    leadingIcon = Icons.Default.Lock,
                    isPassword = true,
                    showPassword = showPassword,
                    onTogglePassword = { showPassword = !showPassword },
                    isDarkTheme = isDarkTheme
                )
                Spacer(modifier = Modifier.height(28.dp))

                // ── Sign In Button ──
                Button(
                    onClick = { if (!isLoading) onLoginSubmit(email, password) },
                    enabled = !isLoading && email.isNotEmpty() && password.isNotEmpty(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = HoseXpertsBlue,
                        contentColor = Color.White,
                        disabledContainerColor = CharcoalCard,
                        disabledContentColor = TextMuted
                    ),
                    elevation = ButtonDefaults.buttonElevation(
                        defaultElevation = 4.dp,
                        pressedElevation = 8.dp
                    )
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(22.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                    } else {
                        Icon(
                            Icons.Default.Login,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(
                        if (isLoading) AppStrings.authenticating(lang) else AppStrings.signIn(lang),
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        letterSpacing = 0.8.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ── Security badge ──
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Security,
                        contentDescription = null,
                        tint = HoseXpertsBlueLight,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        "Encrypted HoseXperts Logistics Authentication",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ── Server config (collapsible) ──
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Server: ${serverUrlInput.take(28)}...",
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                        fontSize = 11.sp
                    )
                    TextButton(onClick = { showServerConfig = !showServerConfig }) {
                        Text(
                            if (showServerConfig) "Hide" else "Configure",
                            color = HoseXpertsBlueLight,
                            fontSize = 12.sp
                        )
                    }
                }

                AnimatedVisibility(
                    visible = showServerConfig,
                    enter = fadeIn() + expandVertically(),
                    exit = fadeOut() + shrinkVertically()
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                "API Base URL",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = serverUrlInput,
                                onValueChange = { serverUrlInput = it },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = HoseXpertsBlue,
                                    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                                    focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                    unfocusedTextColor = MaterialTheme.colorScheme.onSurface
                                ),
                                shape = RoundedCornerShape(10.dp)
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Button(
                                modifier = Modifier.fillMaxWidth().height(46.dp),
                                onClick = {
                                    val cleanUrl = serverUrlInput.trim()
                                    val formatted = if (!cleanUrl.endsWith("/")) "$cleanUrl/" else cleanUrl
                                    serverUrlInput = formatted
                                    onUpdateBaseUrl(formatted)
                                    showServerConfig = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("SAVE SERVER URL", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// REUSABLE: Premium Text Field with visibility toggle
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun PremiumTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    leadingIcon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    isPassword: Boolean = false,
    showPassword: Boolean = false,
    onTogglePassword: () -> Unit = {},
    isDarkTheme: Boolean = true
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label, fontSize = 13.sp) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        visualTransformation = if (isPassword && !showPassword)
            PasswordVisualTransformation() else VisualTransformation.None,
        leadingIcon = if (leadingIcon != null) {
            {
                Icon(
                    leadingIcon,
                    contentDescription = null,
                    tint = HoseXpertsBlue,
                    modifier = Modifier.size(20.dp)
                )
            }
        } else null,
        trailingIcon = if (isPassword) {
            {
                IconButton(onClick = onTogglePassword) {
                    Icon(
                        if (showPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                        contentDescription = if (showPassword) "Hide password" else "Show password",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        } else null,
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = HoseXpertsBlue,
            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
            focusedTextColor = MaterialTheme.colorScheme.onBackground,
            unfocusedTextColor = MaterialTheme.colorScheme.onBackground,
            focusedLabelColor = HoseXpertsBlue,
            unfocusedLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
            cursorColor = HoseXpertsBlue,
            focusedLeadingIconColor = HoseXpertsBlue,
            unfocusedLeadingIconColor = MaterialTheme.colorScheme.onSurfaceVariant
        )
    )
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 3: DRIVER HOME — Professional dashboard with live trips
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun DriverHomeScreen(
    driverName: String,
    activeTrip: Trip?,
    pendingQueueCount: Int,
    updateInfo: AppVersionInfo? = null,
    onDownloadUpdate: () -> Unit = {},
    isDarkTheme: Boolean = true,
    onToggleTheme: () -> Unit = {},
    selectedLanguage: AppLanguage = AppLanguage.ENGLISH,
    onStartTrip: () -> Unit,
    onContinueTrip: () -> Unit,
    onViewTrips: () -> Unit,
    onViewHistory: () -> Unit,
    onViewProfile: () -> Unit,
    onOpenQueue: () -> Unit
) {
    val lang = selectedLanguage

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            // ── Bottom Navigation Bar ──
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 0.dp,
                modifier = Modifier
                    .border(
                        width = 1.dp,
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                    )
            ) {
                NavigationBarItem(
                    selected = true,
                    onClick = {},
                    icon = { Icon(Icons.Default.Home, contentDescription = null) },
                    label = { Text("Home", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = HoseXpertsBlue,
                        selectedTextColor = HoseXpertsBlue,
                        indicatorColor = HoseXpertsBlue.copy(alpha = 0.12f),
                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onViewTrips,
                    icon = { Icon(Icons.Default.Route, contentDescription = null) },
                    label = { Text(AppStrings.todayTrips(lang), fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = HoseXpertsBlue,
                        selectedTextColor = HoseXpertsBlue,
                        indicatorColor = HoseXpertsBlue.copy(alpha = 0.12f),
                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onViewHistory,
                    icon = { Icon(Icons.Default.History, contentDescription = null) },
                    label = { Text(AppStrings.history(lang), fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = HoseXpertsBlue,
                        selectedTextColor = HoseXpertsBlue,
                        indicatorColor = HoseXpertsBlue.copy(alpha = 0.12f),
                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onViewProfile,
                    icon = { Icon(Icons.Default.AccountCircle, contentDescription = null) },
                    label = { Text(AppStrings.profile(lang), fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = HoseXpertsBlue,
                        selectedTextColor = HoseXpertsBlue,
                        indicatorColor = HoseXpertsBlue.copy(alpha = 0.12f),
                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            item {
                // ── System banners ──
                AppUpdateBanner(updateInfo = updateInfo, onUpdateClick = onDownloadUpdate)
                OfflineQueueBanner(pendingQueueCount)

                // ── Header with gradient accent ──
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    HoseXpertsBlueDark.copy(alpha = if (isDarkTheme) 0.3f else 0.08f),
                                    Color.Transparent
                                )
                            )
                        )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 18.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                AppStrings.welcome(lang),
                                color = HoseXpertsBlueLight,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.5.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                driverName,
                                color = MaterialTheme.colorScheme.onBackground,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            if (pendingQueueCount > 0) {
                                Badge(containerColor = StatusAmber) {
                                    Text("$pendingQueueCount", color = Color.Black, fontSize = 10.sp)
                                }
                            }
                            IconButton(onClick = onToggleTheme) {
                                Icon(
                                    if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                                    contentDescription = "Toggle Theme",
                                    tint = HoseXpertsBlueLight,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            IconButton(onClick = onViewProfile) {
                                Box {
                                    Surface(
                                        shape = CircleShape,
                                        color = HoseXpertsBlue,
                                        modifier = Modifier.size(38.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                            Icon(
                                                Icons.Default.Person,
                                                contentDescription = "Profile",
                                                tint = Color.White,
                                                modifier = Modifier.size(22.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ── Active Trip or No-trip card ──
            item {
                Spacer(modifier = Modifier.height(4.dp))
                if (activeTrip == null) {
                    // No active trip
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(16.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(28.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(CircleShape)
                                    .background(StatusGreen.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = StatusGreen,
                                    modifier = Modifier.size(40.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                AppStrings.noActiveTrip(lang),
                                color = MaterialTheme.colorScheme.onSurface,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.SemiBold,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                AppStrings.noActiveTripSub(lang),
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 13.sp,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(24.dp))
                            Button(
                                onClick = onViewTrips,
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue)
                            ) {
                                Icon(Icons.Default.Route, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(AppStrings.viewSchedule(lang), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                } else {
                    // ── Active Trip Card ──
                    ActiveTripCard(
                        trip = activeTrip,
                        onStart = onStartTrip,
                        onContinue = onContinueTrip,
                        lang = lang
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // ── Live Trips header section ──
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(StatusGreen)
                        )
                        Text(
                            AppStrings.liveTrips(lang),
                            color = MaterialTheme.colorScheme.onBackground,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    TextButton(onClick = onViewTrips) {
                        Text("See All", color = HoseXpertsBlueLight, fontSize = 13.sp)
                        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = HoseXpertsBlueLight, modifier = Modifier.size(16.dp))
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            // ── Quick Stats Row ──
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickStatCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.DirectionsCar,
                        label = "Active",
                        value = if (activeTrip != null) "1" else "0",
                        tint = HoseXpertsBlue
                    )
                    QuickStatCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.CheckCircle,
                        label = "Today Done",
                        value = "—",
                        tint = StatusGreen
                    )
                    QuickStatCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.WifiOff,
                        label = "Queued",
                        value = "$pendingQueueCount",
                        tint = if (pendingQueueCount > 0) StatusAmber else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.height(20.dp))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENT: Active Trip Card (hero card on home screen)
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun ActiveTripCard(trip: Trip, onStart: () -> Unit, onContinue: () -> Unit, lang: AppLanguage) {
    val stops = trip.stops ?: emptyList()
    val completedCount = stops.count { it.status == StopStatus.COMPLETED }
    val currentStop = stops.firstOrNull { it.status != StopStatus.COMPLETED }
    val progress = if (stops.isEmpty()) 0f else completedCount.toFloat() / stops.size

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            // Trip number + status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "ACTIVE ROUTE",
                        color = HoseXpertsBlueLight,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp
                    )
                    Text(
                        trip.trip_number,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp
                    )
                }
                StatusBadge(trip.status.name)
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Vehicle info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    Icons.Default.LocalShipping,
                    contentDescription = null,
                    tint = HoseXpertsBlueLight,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    "${trip.vehicle_plate ?: "Assigned"} • ${trip.vehicle_model ?: "Fleet Vehicle"}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 13.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress bar
            Text(
                "STOPS: $completedCount / ${stops.size} COMPLETED",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.8.sp
            )
            Spacer(modifier = Modifier.height(6.dp))
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = HoseXpertsBlue,
                trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
            )

            if (currentStop != null) {
                Spacer(modifier = Modifier.height(14.dp))
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = HoseXpertsBlue.copy(alpha = 0.1f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, HoseXpertsBlue.copy(alpha = 0.25f), RoundedCornerShape(10.dp))
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = HoseXpertsBlue,
                            modifier = Modifier.size(18.dp)
                        )
                        Column {
                            Text(
                                "NEXT STOP",
                                color = HoseXpertsBlueLight,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Text(
                                "${currentStop.destination_name ?: "Stop ${currentStop.stop_number}"}",
                                color = MaterialTheme.colorScheme.onSurface,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            if (trip.status == TripStatus.ASSIGNED || trip.status == TripStatus.PLANNED) {
                Button(
                    onClick = onStart,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(AppStrings.startTrip(lang), fontWeight = FontWeight.Bold, fontSize = 14.sp, letterSpacing = 0.5.sp)
                }
            } else {
                Button(
                    onClick = onContinue,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue)
                ) {
                    Icon(Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(AppStrings.continueTrip(lang), fontWeight = FontWeight.Bold, fontSize = 14.sp, letterSpacing = 0.5.sp)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENT: Quick Stat Card for the home dashboard
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun QuickStatCard(
    modifier: Modifier = Modifier,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    tint: Color
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(tint.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(18.dp))
            }
            Text(value, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 10.sp, textAlign = TextAlign.Center)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 4: TODAY'S TRIPS LIST
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun TodaysTripsScreen(
    trips: List<Trip>,
    onSelectTrip: (Trip) -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 2.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
                    }
                    Spacer(modifier = Modifier.width(4.dp))
                    Column {
                        Text("Today's Dispatched Trips", color = MaterialTheme.colorScheme.onSurface, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        Text("${trips.size} route(s) scheduled", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (trips.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Route, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(60.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No trips scheduled today", color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    Text("Check back later for new dispatches", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                items(trips) { trip ->
                    TripListItem(trip = trip, onClick = { onSelectTrip(trip) })
                }
            }
        }
    }
}

@Composable
fun TripListItem(trip: Trip, onClick: () -> Unit) {
    val stops = trip.stops ?: emptyList()
    val completedCount = stops.count { it.status == StopStatus.COMPLETED }

    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(trip.trip_number, color = HoseXpertsBlue, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                StatusBadge(trip.status.name)
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Icon(Icons.Default.Schedule, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(14.dp))
                Text("Departure: ${trip.planned_departure}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Icon(Icons.Default.Place, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(14.dp))
                Text("${stops.size} stops • $completedCount completed", color = MaterialTheme.colorScheme.onSurface, fontSize = 13.sp)
            }
            if (stops.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                LinearProgressIndicator(
                    progress = { if (stops.isEmpty()) 0f else completedCount.toFloat() / stops.size },
                    modifier = Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(2.dp)),
                    color = HoseXpertsBlue,
                    trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 5: TRIP DETAILS (MULTI-STOP SEQUENCE)
// ─────────────────────────────────────────────────────────────────────────
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
    val stops = trip.stops ?: emptyList()
    val allStopsDone = stops.isNotEmpty() && stops.all { it.status == StopStatus.COMPLETED }
    val completedCount = stops.count { it.status == StopStatus.COMPLETED }

    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
                        }
                        Column {
                            Text(trip.trip_number, color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                            Text("${stops.size} stops • $completedCount done", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                        }
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        StatusBadge(trip.status.name)
                        if (trip.status == TripStatus.IN_PROGRESS) {
                            IconButton(onClick = onReportDelay, modifier = Modifier.size(36.dp)) {
                                Icon(Icons.Default.Warning, contentDescription = "Report Delay", tint = StatusAmber, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            // Route summary card
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(14.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("ROUTE ITINERARY", color = HoseXpertsBlueLight, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                            Text("$completedCount/${stops.size}", color = HoseXpertsBlue, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = { if (stops.isEmpty()) 0f else completedCount.toFloat() / stops.size },
                            modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                            color = HoseXpertsBlue,
                            trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Depot → ${stops.size} Destinations → Return Base",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 13.sp
                        )
                    }
                }
            }

            // Stop items
            items(stops) { stop ->
                StopListItem(stop = stop, onClick = { onOpenStop(stop) })
            }

            // Action button
            item {
                Spacer(modifier = Modifier.height(8.dp))
                when {
                    trip.status == TripStatus.PLANNED || trip.status == TripStatus.ASSIGNED -> {
                        PrimaryActionButton(text = "START ROUTE", onClick = onStartTrip, icon = Icons.Default.PlayArrow)
                    }
                    trip.status == TripStatus.IN_PROGRESS && allStopsDone -> {
                        PrimaryActionButton(text = "START RETURN TO BASE", onClick = onStartReturn, icon = Icons.Default.Home)
                    }
                    trip.status == TripStatus.RETURNING -> {
                        PrimaryActionButton(text = "ARRIVED AT BASE", onClick = onArriveBase, icon = Icons.Default.CheckCircle)
                    }
                    trip.base_arrival_time != null && trip.status != TripStatus.COMPLETED -> {
                        PrimaryActionButton(text = "COMPLETE ENTIRE TRIP", onClick = onCompleteTrip, icon = Icons.Default.Flag)
                    }
                    trip.status == TripStatus.COMPLETED -> {
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = StatusGreen.copy(alpha = 0.12f),
                            modifier = Modifier.fillMaxWidth().border(1.dp, StatusGreen.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(22.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Trip Successfully Completed", color = StatusGreen, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun StopListItem(stop: TripStop, onClick: () -> Unit) {
    val isCompleted = stop.status == StopStatus.COMPLETED
    val isCurrent = stop.status == StopStatus.ARRIVED || stop.status == StopStatus.IN_PROGRESS

    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = when {
                isCurrent -> HoseXpertsBlue.copy(alpha = 0.08f)
                else -> MaterialTheme.colorScheme.surface
            }
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(if (isCurrent) 4.dp else 2.dp),
        border = if (isCurrent) androidx.compose.foundation.BorderStroke(1.dp, HoseXpertsBlue.copy(alpha = 0.4f)) else null
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(
                        when {
                            isCompleted -> StatusGreen.copy(alpha = 0.15f)
                            isCurrent -> HoseXpertsBlue.copy(alpha = 0.2f)
                            else -> MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isCompleted) {
                    Icon(Icons.Default.Check, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(20.dp))
                } else {
                    Text(
                        "${stop.stop_number}",
                        color = if (isCurrent) HoseXpertsBlue else MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp
                    )
                }
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    stop.destination_name ?: "Stop ${stop.stop_number}",
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    stop.address ?: "Address not specified",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            StatusBadge(stop.status.name)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 6: STOP DETAILS
// ─────────────────────────────────────────────────────────────────────────
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
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
                    }
                    Text("Stop ${stop.stop_number} Details", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            item {
                Text(stop.destination_name ?: "", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onBackground)
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(14.dp))
                    Text(stop.address ?: "", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            item {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), shape = RoundedCornerShape(14.dp), elevation = CardDefaults.cardElevation(2.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("PLANNED ARRIVAL", color = HoseXpertsBlueLight, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(stop.planned_arrival ?: "On Schedule", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
            item {
                when (stop.status) {
                    StopStatus.PENDING -> PrimaryActionButton(text = "ARRIVE AT STOP", onClick = onArrive, icon = Icons.Default.LocationOn)
                    StopStatus.ARRIVED -> PrimaryActionButton(text = "COMPLETE ACTIVITY", onClick = onOpenActivity, icon = Icons.Default.Assignment)
                    StopStatus.IN_PROGRESS -> PrimaryActionButton(text = "DEPART STOP", onClick = onDepart, icon = Icons.Default.DriveEta)
                    StopStatus.COMPLETED -> {
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = StatusGreen.copy(alpha = 0.12f),
                            modifier = Modifier.fillMaxWidth().border(1.dp, StatusGreen.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Stop Completed", color = StatusGreen, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    else -> {}
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 7: ARRIVAL & GEOFENCE CHECK
// ─────────────────────────────────────────────────────────────────────────
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
    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
                    Column {
                        Text("Verify Arrival", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                        Text("${stop.destination_name}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(20.dp)) {
            Spacer(modifier = Modifier.height(8.dp))
            GeofenceStatusBanner(isGeofenceVerified, distanceMeters, accuracyMeters)
            Spacer(modifier = Modifier.weight(1f))
            if (!isGeofenceVerified) {
                OutlinedButton(
                    onClick = onRetryGps,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, HoseXpertsBlue)
                ) {
                    Icon(Icons.Default.MyLocation, contentDescription = null, tint = HoseXpertsBlue)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("RETRY GPS CHECK", color = HoseXpertsBlue, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(12.dp))
            }
            PrimaryActionButton(text = "CONFIRM ARRIVAL", enabled = isGeofenceVerified, onClick = onConfirmArrival, icon = Icons.Default.CheckCircle)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 8: ACTIVITY SCREEN (DELIVERY / PICKUP)
// ─────────────────────────────────────────────────────────────────────────
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

    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
                    Text("Complete ${activity?.activity_type ?: "Activity"}", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(vertical = 20.dp)
        ) {
            item {
                PremiumTextField(
                    value = quantity,
                    onValueChange = { quantity = it },
                    label = "Quantity",
                    leadingIcon = Icons.Default.Numbers,
                    isDarkTheme = true
                )
            }
            item {
                PremiumTextField(
                    value = recipient,
                    onValueChange = { recipient = it },
                    label = "Recipient Name / Signature Reference",
                    leadingIcon = Icons.Default.Person,
                    isDarkTheme = true
                )
            }
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(14.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier.size(44.dp).clip(CircleShape).background(HoseXpertsBlue.copy(alpha = 0.12f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(22.dp))
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                if (photoRequired) "PHOTO REQUIRED" else "PHOTO OPTIONAL",
                                color = MaterialTheme.colorScheme.onSurface,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                            Text(
                                if (hasPhotoProof) "✓ Photo attached" else "No photo attached yet",
                                color = if (hasPhotoProof) StatusGreen else MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 12.sp
                            )
                        }
                        Button(
                            onClick = onTakePhoto,
                            colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("CAPTURE", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            item {
                val canSubmit = (!photoRequired || hasPhotoProof) && recipient.isNotEmpty()
                PrimaryActionButton(
                    text = "COMPLETE ACTIVITY",
                    enabled = canSubmit,
                    onClick = { onCompleteActivity(quantity.toIntOrNull() ?: 1, recipient) },
                    icon = Icons.Default.CheckCircle
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 9: CAMERA VIEWFINDER
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun CameraScreen(onCaptureClick: () -> Unit, onClose: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        IconButton(onClick = onClose, modifier = Modifier.padding(16.dp).align(Alignment.TopStart)) {
            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
        }
        Text("Align Proof in Frame", color = Color.White.copy(alpha = 0.8f), modifier = Modifier.align(Alignment.TopCenter).padding(top = 24.dp))
        FloatingActionButton(
            onClick = onCaptureClick,
            containerColor = HoseXpertsBlue,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 40.dp).size(76.dp),
            shape = CircleShape
        ) {
            Icon(Icons.Default.Camera, contentDescription = "Capture", tint = Color.White, modifier = Modifier.size(38.dp))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 10: PHOTO REVIEW
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun PhotoReviewScreen(
    photoUri: Uri?,
    selectedCategory: String,
    onCategoryChange: (String) -> Unit,
    onRetake: () -> Unit,
    onConfirmUpload: () -> Unit
) {
    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Review Proof Photo", color = MaterialTheme.colorScheme.onSurface, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(20.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Image, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Photo: ${photoUri?.lastPathSegment ?: "Ready"}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Surface(shape = RoundedCornerShape(10.dp), color = HoseXpertsBlue.copy(alpha = 0.1f)) {
                Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Label, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Category: $selectedCategory", color = HoseXpertsBlue, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = onRetake,
                    modifier = Modifier.weight(1f).height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Text("RETAKE", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = onConfirmUpload,
                    modifier = Modifier.weight(1f).height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue)
                ) {
                    Text("CONFIRM", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 11: DELAY REPORT
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun DelayReportScreen(onReportSubmit: (reason: String, notes: String) -> Unit, onClose: () -> Unit) {
    var selectedReason by remember { mutableStateOf("TRAFFIC") }
    var notes by remember { mutableStateOf("") }
    val reasons = listOf("TRAFFIC", "VEHICLE_BREAKDOWN", "WEATHER", "CUSTOMER_UNAVAILABLE", "LOADING_UNLOADING", "OTHER")

    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = onClose) { Icon(Icons.Default.Close, contentDescription = "Close", tint = MaterialTheme.colorScheme.onSurface) }
                        Text("Report Active Delay", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                    }
                    Icon(Icons.Default.Warning, contentDescription = null, tint = StatusAmber, modifier = Modifier.padding(end = 16.dp).size(22.dp))
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            item {
                Text("SELECT REASON", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(reasons) { reason ->
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = if (selectedReason == reason) HoseXpertsBlue.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surface,
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            1.dp,
                            if (selectedReason == reason) HoseXpertsBlue.copy(alpha = 0.5f) else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                            RoundedCornerShape(10.dp)
                        )
                        .clickable { selectedReason = reason }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedReason == reason,
                            onClick = { selectedReason = reason },
                            colors = RadioButtonDefaults.colors(selectedColor = HoseXpertsBlue)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(reason.replace("_", " "), color = MaterialTheme.colorScheme.onSurface, fontWeight = if (selectedReason == reason) FontWeight.SemiBold else FontWeight.Normal)
                    }
                }
            }
            item {
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Operational Notes (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = HoseXpertsBlue,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                        focusedTextColor = MaterialTheme.colorScheme.onBackground,
                        unfocusedTextColor = MaterialTheme.colorScheme.onBackground,
                        focusedLabelColor = HoseXpertsBlue
                    )
                )
                Spacer(modifier = Modifier.height(16.dp))
                PrimaryActionButton(text = "SUBMIT DELAY REPORT", onClick = { onReportSubmit(selectedReason, notes) }, icon = Icons.Default.Send)
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 12: ACTIVE DELAY STATE
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun ActiveDelayScreen(delayReason: String, startTime: String, onResolveDelay: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier.size(88.dp).clip(CircleShape).background(StatusRed.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Warning, contentDescription = null, tint = StatusRed, modifier = Modifier.size(52.dp))
        }
        Spacer(modifier = Modifier.height(20.dp))
        Text("TRIP CURRENTLY DELAYED", color = StatusRed, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 0.5.sp, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(12.dp))
        Text("Reason: $delayReason", color = MaterialTheme.colorScheme.onBackground, fontSize = 15.sp, textAlign = TextAlign.Center)
        Text("Started at: $startTime", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(36.dp))
        PrimaryActionButton(text = "RESOLVE DELAY", onClick = onResolveDelay, icon = Icons.Default.CheckCircle)
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 13: RETURN JOURNEY
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun ReturnJourneyScreen(onStartReturn: () -> Unit, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
                    Text("Return Journey", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier.size(88.dp).clip(CircleShape).background(StatusGreen.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(52.dp))
            }
            Spacer(modifier = Modifier.height(20.dp))
            Text("All Stops Completed!", color = StatusGreen, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Proceed back to Company HQ / Depot", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp, textAlign = TextAlign.Center)
            Spacer(modifier = Modifier.height(36.dp))
            PrimaryActionButton(text = "START RETURN TO BASE", onClick = onStartReturn, icon = Icons.Default.Home)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 14: BASE ARRIVAL
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun BaseArrivalScreen(onArriveBase: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier.size(88.dp).clip(CircleShape).background(HoseXpertsBlue.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Home, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(52.dp))
        }
        Spacer(modifier = Modifier.height(20.dp))
        Text("Company Depot Arrival", color = MaterialTheme.colorScheme.onBackground, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Verify return to base depot gate", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(36.dp))
        PrimaryActionButton(text = "RECORD BASE ARRIVAL", onClick = onArriveBase, icon = Icons.Default.CheckCircle)
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 15: TRIP COMPLETION SUMMARY
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun TripCompletionScreen(trip: Trip, onDone: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier.size(100.dp).clip(CircleShape).background(StatusGreen.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(60.dp))
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text("Trip Successfully Completed!", color = StatusGreen, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(8.dp))
        Text(trip.trip_number, color = HoseXpertsBlue, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(4.dp))
        Text("Duration: ${trip.trip_completion_time ?: "Recorded"}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
        Spacer(modifier = Modifier.height(36.dp))
        PrimaryActionButton(text = "RETURN TO HOME", onClick = onDone, icon = Icons.Default.Home)
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 16: TRIP HISTORY
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun TripHistoryScreen(history: List<Trip>, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
                    Column {
                        Text("Completed Trip History", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                        Text("${history.size} trips completed", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (history.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.History, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(60.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No completed trips yet", color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                items(history) { trip ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(14.dp),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.size(44.dp).clip(CircleShape).background(StatusGreen.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(22.dp))
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Text(trip.trip_number, color = HoseXpertsBlue, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                                Text("Completed: ${trip.trip_completion_time ?: "Recorded"}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                                Text("${trip.stops?.size ?: 0} stops", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 17: DRIVER PROFILE — Enhanced
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun ProfileScreen(user: User?, onLogout: () -> Unit, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
                    Text("Driver Profile", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(vertical = 20.dp)
        ) {
            item {
                // Avatar + name header
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(HoseXpertsBlue),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                (user?.name?.firstOrNull()?.uppercaseChar() ?: 'D').toString(),
                                color = Color.White,
                                fontSize = 34.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(user?.name ?: "Driver", color = MaterialTheme.colorScheme.onSurface, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                        Text(user?.email ?: "", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                    }
                }
            }
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(14.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        ProfileInfoRow(icon = Icons.Default.Badge, label = "Employee ID", value = user?.employee_id ?: "EMP-2026")
                        Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                        ProfileInfoRow(icon = Icons.Default.Work, label = "Role", value = user?.role ?: "Driver")
                        Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                        ProfileInfoRow(icon = Icons.Default.VerifiedUser, label = "Status", value = "Active")
                    }
                }
            }
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onLogout,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = StatusRed.copy(alpha = 0.12f), contentColor = StatusRed),
                    border = androidx.compose.foundation.BorderStroke(1.dp, StatusRed.copy(alpha = 0.4f))
                ) {
                    Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(AppStrings.signOut(AppLanguage.ENGLISH), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
fun ProfileInfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(icon, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(20.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
            Text(value, color = MaterialTheme.colorScheme.onSurface, fontSize = 15.sp, fontWeight = FontWeight.Medium)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 18: OFFLINE QUEUE
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun OfflineQueueScreen(pendingCount: Int, onTriggerSync: () -> Unit, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
                    Column {
                        Text("Offline Event Queue", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                        Text("$pendingCount event(s) pending sync", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(20.dp)) {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = StatusAmber.copy(alpha = 0.1f),
                modifier = Modifier.fillMaxWidth().border(1.dp, StatusAmber.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(Icons.Default.WifiOff, contentDescription = null, tint = StatusAmber, modifier = Modifier.size(28.dp))
                    Column {
                        Text("$pendingCount Events Queued", color = StatusAmber, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("Will sync automatically when network is available", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    }
                }
            }
            Spacer(modifier = Modifier.weight(1f))
            PrimaryActionButton(text = "FORCE SYNC NOW", onClick = onTriggerSync, icon = Icons.Default.Sync)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 19: ERROR STATE
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun ErrorStateScreen(errorMessage: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier.size(88.dp).clip(CircleShape).background(StatusRed.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = StatusRed, modifier = Modifier.size(52.dp))
        }
        Spacer(modifier = Modifier.height(20.dp))
        Text("GPS or Operational Error", color = MaterialTheme.colorScheme.onBackground, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(8.dp))
        Text(errorMessage, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(36.dp))
        PrimaryActionButton(text = "RETRY", onClick = onRetry, icon = Icons.Default.Refresh)
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN 20: PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun PermissionScreen(onRequestPermissions: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier.size(88.dp).clip(CircleShape).background(HoseXpertsBlue.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Security, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(52.dp))
        }
        Spacer(modifier = Modifier.height(20.dp))
        Text("Hardware Permissions Required", color = MaterialTheme.colorScheme.onBackground, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            "TruckTracker requires Location and Camera permissions for geofence verification and proof capture.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 14.sp,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(36.dp))
        PrimaryActionButton(text = "GRANT PERMISSIONS", onClick = onRequestPermissions, icon = Icons.Default.Security)
    }
}
