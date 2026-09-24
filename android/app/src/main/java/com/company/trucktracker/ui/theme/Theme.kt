package com.company.trucktracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = HoseXpertsBlue,
    onPrimary = Color.White,
    primaryContainer = CharcoalCard,
    onPrimaryContainer = HoseXpertsBlueLight,
    secondary = TextSecondary,
    onSecondary = TextPrimary,
    background = CharcoalBg,
    onBackground = TextPrimary,
    surface = CharcoalSurface,
    onSurface = TextPrimary,
    surfaceVariant = CharcoalCard,
    onSurfaceVariant = TextSecondary,
    outline = CharcoalBorder,
    error = StatusRed,
    onError = TextPrimary
)

private val LightColorScheme = lightColorScheme(
    primary = LightBrandBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFF1F5F9),
    onPrimaryContainer = LightBrandBlue,
    secondary = LightTextSecondary,
    onSecondary = LightTextPrimary,
    background = LightBg,
    onBackground = LightTextPrimary,
    surface = LightSurface,
    onSurface = LightTextPrimary,
    surfaceVariant = LightCard,
    onSurfaceVariant = LightTextSecondary,
    outline = LightBorder,
    error = StatusRed,
    onError = Color.White
)

@Composable
fun TruckTrackerTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
