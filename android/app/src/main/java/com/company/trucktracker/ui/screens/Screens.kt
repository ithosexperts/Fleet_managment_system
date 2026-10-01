package com.company.trucktracker.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.automirrored.filled.*
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
import androidx.compose.ui.platform.LocalContext
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
// LANGUAGE SUPPORT (English, Hindi, Hinglish)
// ─────────────────────────────────────────────────────────────────────────
enum class AppLanguage(val displayName: String, val code: String) {
    ENGLISH("English", "en"),
    HINDI("हिन्दी (Hindi)", "hi"),
    HINGLISH("Hinglish", "hinglish")
}

object AppStrings {
    // Login
    fun loginTitle(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "ड्राइवर साइन इन"
        AppLanguage.HINGLISH -> "Driver Sign In Karein"
        else -> "Driver Sign In"
    }
    fun loginSubtitle(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "लॉजिस्टिक्स रूट्स एक्सेस करें"
        AppLanguage.HINGLISH -> "Apne assigned logistics routes dekhein"
        else -> "Access your assigned logistics routes"
    }
    fun emailLabel(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "ईमेल / ड्राइवर आईडी"
        AppLanguage.HINGLISH -> "Email / Driver ID"
        else -> "Email / Driver ID"
    }
    fun passwordLabel(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "पासवर्ड"
        AppLanguage.HINGLISH -> "Password"
        else -> "Password"
    }
    fun signIn(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "साइन इन करें"
        AppLanguage.HINGLISH -> "SIGN IN KAREIN"
        else -> "SIGN IN"
    }
    fun authenticating(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "प्रमाणीकरण हो रहा है..."
        AppLanguage.HINGLISH -> "Authenticating ho raha hai..."
        else -> "AUTHENTICATING..."
    }
    // Home
    fun welcome(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "स्वागत है"
        AppLanguage.HINGLISH -> "WELCOME BACK"
        else -> "WELCOME BACK"
    }
    fun noActiveTrip(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "कोई सक्रिय रूट आवंटित नहीं है"
        AppLanguage.HINGLISH -> "No Active Trip Assigned"
        else -> "No Active Route Assigned"
    }
    fun noActiveTripSub(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "नए डिस्पैच ऑर्डर के लिए आज के ट्रिप्स जांचें"
        AppLanguage.HINGLISH -> "Please stand by for fleet dispatch"
        else -> "Check Today's Trips for new dispatches"
    }
    fun viewSchedule(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "आज का शेड्यूल देखें"
        AppLanguage.HINGLISH -> "VIEW TODAY'S SCHEDULE"
        else -> "VIEW TODAY'S SCHEDULE"
    }
    fun todayTrips(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "आज के ट्रिप्स"
        AppLanguage.HINGLISH -> "Today's Trips"
        else -> "Today's Trips"
    }
    fun history(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "इतिहास"
        AppLanguage.HINGLISH -> "History"
        else -> "History"
    }
    fun liveTrips(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "लाइव ट्रिप्स"
        AppLanguage.HINGLISH -> "Live Trips"
        else -> "Live Trips"
    }
    fun profile(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "वाहन कागजात एवं मेनू"
        AppLanguage.HINGLISH -> "Vehicle Papers & Menu"
        else -> "Vehicle Papers & Menu"
    }
    fun startTrip(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "ट्रिप शुरू करें"
        AppLanguage.HINGLISH -> "TRIP START KAREIN"
        else -> "START TRIP"
    }
    fun continueTrip(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "ट्रिप जारी रखें"
        AppLanguage.HINGLISH -> "TRIP CONTINUE KAREIN"
        else -> "CONTINUE TRIP"
    }
    fun signOut(lang: AppLanguage) = when (lang) {
        AppLanguage.HINDI -> "साइन आउट"
        AppLanguage.HINGLISH -> "LOGOUT"
        else -> "SIGN OUT"
    }
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
    selectedLanguage: AppLanguage = AppLanguage.ENGLISH,
    onLanguageChanged: (AppLanguage) -> Unit = {},
    onLoginSubmit: (String, String) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var showServerConfig by remember { mutableStateOf(false) }
    var serverUrlInput by remember { mutableStateOf(currentBaseUrl) }
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
                                            onLanguageChanged(language)
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
                            Icons.AutoMirrored.Filled.Login,
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
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Button(
                                    onClick = {
                                        serverUrlInput = "http://10.0.2.2:5000/"
                                        onUpdateBaseUrl("http://10.0.2.2:5000/")
                                    },
                                    modifier = Modifier.weight(1f).height(36.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surface),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                                ) {
                                    Text("Emulator", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
                                }
                                Button(
                                    onClick = {
                                        serverUrlInput = "http://192.168.1.13:5000/"
                                        onUpdateBaseUrl("http://192.168.1.13:5000/")
                                    },
                                    modifier = Modifier.weight(1f).height(36.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surface),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                                ) {
                                    Text("Wi-Fi", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
                                }
                                Button(
                                    onClick = {
                                        serverUrlInput = "https://fleet-managment-system-638o.onrender.com/"
                                        onUpdateBaseUrl("https://fleet-managment-system-638o.onrender.com/")
                                    },
                                    modifier = Modifier.weight(1f).height(36.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surface),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                                ) {
                                    Text("Cloud", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
                                }
                            }
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
    completedTodayCount: Int = 0,
    updateInfo: AppVersionInfo? = null,
    onDownloadUpdate: () -> Unit = {},
    isDarkTheme: Boolean = true,
    onToggleTheme: () -> Unit = {},
    selectedLanguage: AppLanguage = AppLanguage.ENGLISH,
    onStartTrip: () -> Unit,
    onContinueTrip: () -> Unit,
    onReportDispute: () -> Unit = {},
    onOpenMap: () -> Unit = {},
    onOpenEmergency: () -> Unit = {},
    onViewTrips: () -> Unit,
    onViewHistory: () -> Unit,
    onViewProfile: () -> Unit,
    onOpenQueue: () -> Unit
) {
    val lang = selectedLanguage

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            // ── Bottom Navigation Bar (5 tabs matching Web Control Tower) ──
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
                    label = { Text("Home", fontSize = 10.sp) },
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
                    label = { Text(AppStrings.todayTrips(lang), fontSize = 10.sp, maxLines = 1) },
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
                    onClick = onOpenMap,
                    icon = { Icon(Icons.Default.Map, contentDescription = null) },
                    label = { Text("Map", fontSize = 10.sp) },
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
                    onClick = onOpenEmergency,
                    icon = { Icon(Icons.Default.Warning, contentDescription = null, tint = StatusRed) },
                    label = { Text("SOS", fontSize = 10.sp, color = StatusRed) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = StatusRed,
                        selectedTextColor = StatusRed,
                        indicatorColor = StatusRed.copy(alpha = 0.12f),
                        unselectedIconColor = StatusRed,
                        unselectedTextColor = StatusRed
                    )
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onViewProfile,
                    icon = { Icon(Icons.Default.AccountCircle, contentDescription = null) },
                    label = { Text(AppStrings.profile(lang), fontSize = 10.sp, maxLines = 1) },
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
                        onReportDispute = onReportDispute,
                        onOpenMap = onOpenMap,
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
                        value = "$completedTodayCount",
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
fun ActiveTripCard(
    trip: Trip,
    onStart: () -> Unit,
    onContinue: () -> Unit,
    onReportDispute: () -> Unit = {},
    onOpenMap: () -> Unit = {},
    lang: AppLanguage
) {
    val stops = trip.stops ?: emptyList()
    val completedCount = stops.count { it.status == StopStatus.COMPLETED }
    val currentStop = stops.firstOrNull { it.status != StopStatus.COMPLETED }
    val progress = if (stops.isEmpty()) 0f else completedCount.toFloat() / stops.size
    val context = LocalContext.current

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
                        trip.displayTripNumber,
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

            Spacer(modifier = Modifier.height(10.dp))

            // Call Dispatch, Live Map & Report Dispute Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:+9118005550199"))
                        context.startActivity(intent)
                    },
                    modifier = Modifier.weight(1f).height(44.dp),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp),
                    border = BorderStroke(1.dp, HoseXpertsBlue)
                ) {
                    Icon(Icons.Default.Phone, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("DISPATCH", color = HoseXpertsBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = onOpenMap,
                    modifier = Modifier.weight(1f).height(44.dp),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp),
                    border = BorderStroke(1.dp, HoseXpertsBlueLight)
                ) {
                    Icon(Icons.Default.Map, contentDescription = null, tint = HoseXpertsBlueLight, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("LIVE MAP", color = HoseXpertsBlueLight, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = onReportDispute,
                    modifier = Modifier.weight(1f).height(44.dp),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp),
                    border = BorderStroke(1.dp, StatusAmber)
                ) {
                    Icon(Icons.Default.ReportProblem, contentDescription = null, tint = StatusAmber, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("DISPUTE", color = StatusAmber, fontSize = 10.sp, fontWeight = FontWeight.Bold)
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
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
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
                Text(trip.displayTripNumber, color = HoseXpertsBlue, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
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
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
                        }
                        Column {
                            Text(trip.displayTripNumber, color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
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
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
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
                    StopStatus.ARRIVED -> PrimaryActionButton(text = "COMPLETE ACTIVITY", onClick = onOpenActivity, icon = Icons.AutoMirrored.Filled.Assignment)
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
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
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
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, HoseXpertsBlue)
                ) {
                    Icon(Icons.Default.MyLocation, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("RETRY GPS", color = HoseXpertsBlue, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                Spacer(modifier = Modifier.height(12.dp))
            } else {
                PrimaryActionButton(
                    text = "CONFIRM ARRIVAL",
                    enabled = true,
                    onClick = onConfirmArrival,
                    icon = Icons.Default.CheckCircle
                )
            }
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
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
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
                val canSubmit = (!photoRequired || hasPhotoProof)
                PrimaryActionButton(
                    text = "COMPLETE ACTIVITY",
                    enabled = canSubmit,
                    onClick = { onCompleteActivity(quantity.toIntOrNull() ?: 1, recipient.ifBlank { "Store Receiver" }) },
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
                    Icon(Icons.AutoMirrored.Filled.Label, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(16.dp))
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
                PrimaryActionButton(text = "SUBMIT DELAY REPORT", onClick = { onReportSubmit(selectedReason, notes) }, icon = Icons.AutoMirrored.Filled.Send)
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
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
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
        Text(trip.displayTripNumber, color = HoseXpertsBlue, fontSize = 18.sp, fontWeight = FontWeight.Bold)
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
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
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
                                Text(trip.displayTripNumber, color = HoseXpertsBlue, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
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
// SCREEN 17: VEHICLE PAPERS & MENU / DRIVER PROFILE
// Matches the Web Application "Vehicle Papers & Menu" Screen Exactly
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun ProfileScreen(
    user: User?,
    activeTrip: Trip? = null,
    selectedLanguage: AppLanguage = AppLanguage.ENGLISH,
    onLanguageChanged: (AppLanguage) -> Unit = {},
    isDarkTheme: Boolean = false,
    onToggleTheme: () -> Unit = {},
    onTriggerSync: () -> Unit = {},
    onCheckUpdate: () -> Unit = {},
    onLogout: () -> Unit,
    onBack: () -> Unit
) {
    var showHelpGuidelines by remember { mutableStateOf(false) }
    var showVehicleInfo by remember { mutableStateOf(false) }
    var showVehiclePapers by remember { mutableStateOf(false) }
    val context = LocalContext.current

    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
                    Text("Vehicle Papers & Menu", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
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
            // Driver Profile Header Card
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(HoseXpertsBlue),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                (user?.name?.firstOrNull()?.uppercaseChar() ?: 'A').toString(),
                                color = Color.White,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                        Column {
                            Text(
                                user?.name ?: "ahjsj",
                                color = MaterialTheme.colorScheme.onSurface,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                "Commercial Driver • Verified Driver & Safety Active",
                                color = StatusGreen,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // Quick Menu Items
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(14.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showVehiclePapers = true }
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Box(
                                    modifier = Modifier.size(36.dp).clip(RoundedCornerShape(8.dp)).background(HoseXpertsBlue.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Description, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(20.dp))
                                }
                                Column {
                                    Text("Vehicle Papers & Documents", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("RC, Insurance, Fitness, Pollution, Challans", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                                }
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showVehicleInfo = true }
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Box(
                                    modifier = Modifier.size(36.dp).clip(RoundedCornerShape(8.dp)).background(HoseXpertsBlue.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.LocalShipping, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(20.dp))
                                }
                                Column {
                                    Text("Vehicle Information", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("No Vehicle Assigned / Fleet Truck", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                                }
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showHelpGuidelines = true }
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Box(
                                    modifier = Modifier.size(36.dp).clip(RoundedCornerShape(8.dp)).background(StatusAmber.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.AutoMirrored.Filled.HelpOutline, contentDescription = null, tint = StatusAmber, modifier = Modifier.size(20.dp))
                                }
                                Column {
                                    Text("Help & Support", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("Dispatch contact, standard guidelines & FAQ", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                                }
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            // APP LANGUAGE & PREFERENCES
            item {
                Text(
                    "APP LANGUAGE & PREFERENCES",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                )

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(14.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Language Selector
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.Language, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(18.dp))
                                Text("App Language", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                            Text("Choose your preferred language", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                AppLanguage.values().forEach { lang ->
                                    val isSelected = selectedLanguage == lang
                                    val bg = if (isSelected) HoseXpertsBlue else MaterialTheme.colorScheme.surfaceVariant
                                    val fg = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface

                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(42.dp)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(bg)
                                            .border(1.dp, if (isSelected) HoseXpertsBlue else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                            .clickable { onLanguageChanged(lang) },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(lang.displayName, color = fg, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }
                            }
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

                        // App Theme
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(if (isDarkTheme) Icons.Default.DarkMode else Icons.Default.LightMode, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(18.dp))
                                    Text("App Theme", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                                Text(if (isDarkTheme) "Currently in Dark mode" else "Currently in Light mode", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                            }

                            OutlinedButton(
                                onClick = onToggleTheme,
                                shape = RoundedCornerShape(10.dp),
                                border = BorderStroke(1.dp, HoseXpertsBlue)
                            ) {
                                Text(if (isDarkTheme) "Switch to Light" else "Switch to Dark", color = HoseXpertsBlue, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            }
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

                        // Offline Storage Sync
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(Icons.Default.Sync, contentDescription = null, tint = HoseXpertsBlue, modifier = Modifier.size(18.dp))
                                    Text("Offline Storage Sync", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                                Text("All operational data in sync", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                            }

                            Button(
                                onClick = onTriggerSync,
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue)
                            ) {
                                Text("Sync Now", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }

            // OTA Update & Logout
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(14.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("App Version: v1.2.0 (OTA Enabled)", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        TextButton(onClick = onCheckUpdate) {
                            Text("Check Updates", color = HoseXpertsBlue, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = onLogout,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = StatusRed)
                ) {
                    Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("LOGOUT", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                }
            }
        }
    }

    // Driver Help & Guidelines Dialog (matching Web App Modal)
    if (showHelpGuidelines) {
        AlertDialog(
            onDismissRequest = { showHelpGuidelines = false },
            confirmButton = {
                Button(
                    onClick = {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:+9118005550199"))
                        context.startActivity(intent)
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue)
                ) {
                    Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Call Dispatch Command Center", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            },
            dismissButton = {
                TextButton(onClick = { showHelpGuidelines = false }) {
                    Text("Close", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            },
            title = {
                Text("Driver Help & Guidelines", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("1. Check-In & Arrive: Tap 'I'm at Location' when you reach the warehouse security gate.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                    Text("2. Proof of Delivery (POD): Snap a clear photo of the stamped delivery challan.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                    Text("3. Delays: If stuck in traffic or loading delays exceed 15 mins, report a delay immediately.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                    Text("4. Emergency: In case of mechanical breakdown or accident, use Emergency hotline.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                }
            },
            shape = RoundedCornerShape(16.dp),
            containerColor = MaterialTheme.colorScheme.surface
        )
    }

    // Vehicle Information Dialog
    if (showVehicleInfo) {
        AlertDialog(
            onDismissRequest = { showVehicleInfo = false },
            confirmButton = {
                Button(
                    onClick = { showVehicleInfo = false },
                    colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Close") }
            },
            title = {
                Text("Vehicle Information", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
            },
            text = {
                val plate = activeTrip?.vehicle_plate ?: "Not Assigned"
                val model = activeTrip?.vehicle_model ?: "—"
                val vehicleId = activeTrip?.vehicle_id ?: "—"
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    ProfileInfoRow(Icons.Default.LocalShipping, "Plate Number", plate)
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    ProfileInfoRow(Icons.Default.DirectionsCar, "Model", model)
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    ProfileInfoRow(Icons.Default.Tag, "Vehicle ID", vehicleId)
                }
            },
            shape = RoundedCornerShape(16.dp),
            containerColor = MaterialTheme.colorScheme.surface
        )
    }

    // Vehicle Papers Dialog
    if (showVehiclePapers) {
        AlertDialog(
            onDismissRequest = { showVehiclePapers = false },
            confirmButton = {
                Button(
                    onClick = { showVehiclePapers = false },
                    colors = ButtonDefaults.buttonColors(containerColor = HoseXpertsBlue),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) { Text("OK") }
            },
            title = {
                Text("Vehicle Papers & Documents", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Vehicle documents (RC, Insurance, Fitness Certificate, PUC, Challans) are managed by your fleet manager.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Contact your dispatch manager to view or update vehicle documents.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            },
            shape = RoundedCornerShape(16.dp),
            containerColor = MaterialTheme.colorScheme.surface
        )
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
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface) }
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

// ─────────────────────────────────────────────────────────────────────────
// SCREEN: EMERGENCY & SOS ASSISTANCE
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun EmergencyScreen(
    onBack: () -> Unit,
    onReportIncident: () -> Unit,
    activeTrip: Trip? = null,
    controlRoomPhone: String = "+911145678900",
    fleetManagerPhone: String = "+919811223344",
    roadsidePhone: String = "+9118001021234",
    emergencyServicesPhone: String = "112"
) {
    val context = LocalContext.current
    var holdProgress by remember { mutableStateOf(0f) }
    var isHolding by remember { mutableStateOf(false) }
    var sosActivated by remember { mutableStateOf(false) }

    LaunchedEffect(isHolding) {
        if (isHolding && !sosActivated) {
            val startTime = System.currentTimeMillis()
            val duration = 2000L
            while (isHolding && !sosActivated) {
                val elapsed = System.currentTimeMillis() - startTime
                holdProgress = (elapsed.toFloat() / duration).coerceIn(0f, 1f)
                if (holdProgress >= 1f) {
                    sosActivated = true
                    isHolding = false
                    try {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$emergencyServicesPhone"))
                        context.startActivity(intent)
                    } catch (_: Exception) {}
                    break
                }
                kotlinx.coroutines.delay(30)
            }
        } else if (!sosActivated) {
            holdProgress = 0f
        }
    }

    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
                    }
                    Text("Emergency Help & SOS", color = MaterialTheme.colorScheme.onSurface, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            // Hero SOS Beacon Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(20.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    border = BorderStroke(1.dp, StatusRed.copy(alpha = 0.35f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "SOS EMERGENCY BEACON",
                            color = StatusRed,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.2.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Need Immediate Help?",
                            color = MaterialTheme.colorScheme.onSurface,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "Dispatch Control Room and Emergency Responders are available 24/7.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(20.dp))

                        // Hold button with progress ring
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.size(130.dp)
                        ) {
                            CircularProgressIndicator(
                                progress = { holdProgress },
                                modifier = Modifier.size(130.dp),
                                color = StatusRed,
                                trackColor = StatusRed.copy(alpha = 0.15f),
                                strokeWidth = 6.dp
                            )

                            Button(
                                onClick = {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$emergencyServicesPhone"))
                                    context.startActivity(intent)
                                },
                                modifier = Modifier.size(105.dp),
                                shape = CircleShape,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (sosActivated) StatusGreen else StatusRed
                                ),
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        if (sosActivated) Icons.Default.CheckCircle else Icons.Default.Warning,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(32.dp)
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        if (sosActivated) "CALLED" else "TAP / SOS",
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            if (sosActivated) "Emergency alert activated. Dialing 112..."
                            else if (isHolding) "Holding... ${(holdProgress * 100).toInt()}%"
                            else "Tap to dial 112 or hold for emergency broadcast",
                            color = if (sosActivated) StatusGreen else MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // Report Incident / Breakdown Button
            item {
                Button(
                    onClick = onReportIncident,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = StatusAmber)
                ) {
                    Icon(Icons.Default.ReportProblem, contentDescription = null, tint = Color.Black, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("REPORT DELAY / BREAKDOWN", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }

            // Emergency Contacts Directory Header
            item {
                Text(
                    "EMERGENCY CONTACTS DIRECTORY",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            // Contact 1: Control Room 24/7
            item {
                EmergencyContactCard(
                    title = "Dispatch Control Room",
                    subtitle = "24/7 Fleet operations & live tracking help",
                    phoneNumber = controlRoomPhone,
                    icon = Icons.Default.HeadsetMic,
                    tint = HoseXpertsBlue
                )
            }

            // Contact 2: Fleet Manager
            item {
                EmergencyContactCard(
                    title = "Fleet Operations Manager",
                    subtitle = "Direct line to duty fleet manager",
                    phoneNumber = fleetManagerPhone,
                    icon = Icons.Default.Person,
                    tint = HoseXpertsBlue
                )
            }

            // Contact 3: Roadside Assistance & Towing
            item {
                EmergencyContactCard(
                    title = "Roadside Assistance & Towing",
                    subtitle = "Vehicle breakdown, puncture or accident support",
                    phoneNumber = roadsidePhone,
                    icon = Icons.Default.LocalShipping,
                    tint = StatusAmber
                )
            }

            // Contact 4: National Emergency 112
            item {
                EmergencyContactCard(
                    title = "Police & Medical Services (112)",
                    subtitle = "National Emergency Response Support System",
                    phoneNumber = emergencyServicesPhone,
                    icon = Icons.Default.Shield,
                    tint = StatusRed
                )
            }
        }
    }
}

@Composable
fun EmergencyContactCard(
    title: String,
    subtitle: String,
    phoneNumber: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    tint: Color
) {
    val context = LocalContext.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable {
                try {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phoneNumber"))
                    context.startActivity(intent)
                } catch (_: Exception) {}
            },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.weight(1f)
            ) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = tint.copy(alpha = 0.12f),
                    modifier = Modifier.size(42.dp)
                ) {
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(22.dp))
                    }
                }
                Column {
                    Text(title, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                    Text(phoneNumber, color = tint, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
            }

            Surface(
                shape = CircleShape,
                color = tint,
                modifier = Modifier.size(36.dp)
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Icon(Icons.Default.Phone, contentDescription = "Call", tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SCREEN: INTERACTIVE MAP & ROUTE CORRIDOR
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun MapScreen(
    trip: Trip?,
    onBack: () -> Unit,
    onNavigateToStop: (TripStop) -> Unit = {}
) {
    val context = LocalContext.current
    val stops = trip?.stops ?: emptyList()
    val activeStop = stops.firstOrNull { it.status != StopStatus.COMPLETED } ?: stops.firstOrNull()

    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
                        }
                        Column {
                            Text(trip?.displayTripNumber ?: "Live Route Map", color = MaterialTheme.colorScheme.onSurface, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                            Text("${stops.size} Stops • Corridor Navigation", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                        }
                    }

                    if (activeStop != null && activeStop.latitude != 0.0) {
                        FilledTonalButton(
                            onClick = {
                                val lat = activeStop.latitude
                                val lng = activeStop.longitude
                                val gmmIntentUri = Uri.parse("google.navigation:q=$lat,$lng&mode=d")
                                val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri).apply {
                                    setPackage("com.google.android.apps.maps")
                                }
                                try {
                                    context.startActivity(mapIntent)
                                } catch (_: Exception) {
                                    val fallback = Intent(Intent.ACTION_VIEW, Uri.parse("geo:$lat,$lng?q=$lat,$lng(${Uri.encode(activeStop.destination_name ?: "Stop")})"))
                                    context.startActivity(fallback)
                                }
                            },
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("NAVIGATE", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            // Live Corridor summary card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("ORIGIN DEPOT", color = HoseXpertsBlueLight, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                Text(trip?.starting_location_name ?: "HoseXperts Central Depot", color = MaterialTheme.colorScheme.onSurface, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            }
                            StatusBadge(trip?.status?.name ?: "PLANNED")
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("ASSIGNED VEHICLE", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                                Text(trip?.vehicle_plate ?: "Fleet Truck", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("TOTAL DISTANCE", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                                Text("${trip?.total_distance_km ?: "--"} km", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }

            // Route Stops Section
            item {
                Text(
                    "ROUTE STOPS & CORRIDOR WAYPOINTS",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            if (stops.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.Route, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No stops assigned for this route", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                        }
                    }
                }
            } else {
                items(stops) { stop ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = if (stop.status == StopStatus.IN_PROGRESS || stop.status == StopStatus.ARRIVED)
                                HoseXpertsBlue.copy(alpha = 0.08f)
                            else MaterialTheme.colorScheme.surface
                        ),
                        shape = RoundedCornerShape(14.dp),
                        elevation = CardDefaults.cardElevation(1.dp),
                        border = if (stop.status == StopStatus.IN_PROGRESS || stop.status == StopStatus.ARRIVED)
                            BorderStroke(1.dp, HoseXpertsBlue.copy(alpha = 0.5f))
                        else null
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = when (stop.status) {
                                        StopStatus.COMPLETED -> StatusGreen
                                        StopStatus.ARRIVED, StopStatus.IN_PROGRESS -> HoseXpertsBlue
                                        else -> MaterialTheme.colorScheme.outline
                                    },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                        Text("${stop.stop_number}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                }

                                Column {
                                    Text(stop.destination_name ?: "Stop ${stop.stop_number}", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(stop.address ?: "", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    if (stop.planned_arrival != null) {
                                        Text("ETA: ${stop.planned_arrival}", color = HoseXpertsBlueLight, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                IconButton(
                                    onClick = {
                                        val lat = stop.latitude
                                        val lng = stop.longitude
                                        val uri = Uri.parse("google.navigation:q=$lat,$lng&mode=d")
                                        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                                            setPackage("com.google.android.apps.maps")
                                        }
                                        try {
                                            context.startActivity(intent)
                                        } catch (_: Exception) {
                                            val fallback = Intent(Intent.ACTION_VIEW, Uri.parse("geo:$lat,$lng?q=$lat,$lng"))
                                            context.startActivity(fallback)
                                        }
                                    }
                                ) {
                                    Icon(Icons.Default.Navigation, contentDescription = "Navigate", tint = HoseXpertsBlue, modifier = Modifier.size(20.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

