package com.company.trucktracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// =============================================================
// HoseXperts TruckTracker — Material3 Design Tokens
// Matches the Web App dark navy / blue brand identity exactly
// =============================================================

private val DarkColorScheme = darkColorScheme(
    primary              = HoseXpertsBlue,
    onPrimary            = Color.White,
    primaryContainer     = CharcoalCard,
    onPrimaryContainer   = HoseXpertsBlueLight,
    secondary            = HoseXpertsBlueLight,
    onSecondary          = Color.White,
    secondaryContainer   = CharcoalCard,
    onSecondaryContainer = TextSecondary,
    tertiary             = StatusGreen,
    onTertiary           = Color.White,
    background           = CharcoalBg,
    onBackground         = TextPrimary,
    surface              = CharcoalSurface,
    onSurface            = TextPrimary,
    surfaceVariant       = CharcoalCard,
    onSurfaceVariant     = TextSecondary,
    outline              = CharcoalBorder,
    outlineVariant       = CharcoalOverlay,
    error                = StatusRed,
    onError              = Color.White,
    inverseSurface       = TextPrimary,
    inverseOnSurface     = CharcoalBg
)

private val LightColorScheme = lightColorScheme(
    primary              = LightBrandBlue,
    onPrimary            = Color.White,
    primaryContainer     = LightBlueTint,
    onPrimaryContainer   = LightBrandBlue,
    secondary            = LightBrandBlue,
    onSecondary          = Color.White,
    secondaryContainer   = LightBlueTint,
    onSecondaryContainer = LightTextSecondary,
    tertiary             = StatusGreen,
    onTertiary           = Color.White,
    background           = LightBg,
    onBackground         = LightTextPrimary,
    surface              = LightSurface,
    onSurface            = LightTextPrimary,
    surfaceVariant       = LightCard,
    onSurfaceVariant     = LightTextSecondary,
    outline              = LightBorder,
    outlineVariant       = Color(0xFFE2E8F0),
    error                = StatusRed,
    onError              = Color.White,
    inverseSurface       = LightTextPrimary,
    inverseOnSurface     = LightSurface
)

@Composable
fun TruckTrackerTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography  = Typography,
        content     = content
    )
}
