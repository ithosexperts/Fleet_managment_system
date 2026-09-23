package com.company.trucktracker.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.clickable
import androidx.compose.material.icons.filled.SystemUpdate
import com.company.trucktracker.data.models.AppVersionInfo
import com.company.trucktracker.ui.theme.*

@Composable
fun PrimaryActionButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: ImageVector? = null,
    containerColor: Color = ChampagneGold,
    contentColor: Color = CharcoalBg
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = contentColor,
            disabledContainerColor = CharcoalCard,
            disabledContentColor = TextMuted
        )
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(22.dp))
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text(
            text = text,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun StatusBadge(status: String) {
    val (bgColor, textColor) = when (status.uppercase()) {
        "COMPLETED" -> Pair(StatusGreen.copy(alpha = 0.15f), StatusGreen)
        "IN_PROGRESS", "RETURNING" -> Pair(StatusBlue.copy(alpha = 0.15f), StatusBlue)
        "DELAYED" -> Pair(StatusRed.copy(alpha = 0.15f), StatusRed)
        "ARRIVED" -> Pair(ChampagneGold.copy(alpha = 0.15f), ChampagneGold)
        "PENDING", "PLANNED" -> Pair(CharcoalBorder, TextSecondary)
        else -> Pair(CharcoalCard, TextMuted)
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .border(1.dp, textColor.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = status.replace("_", " "),
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun OfflineQueueBanner(pendingCount: Int) {
    if (pendingCount > 0) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(StatusAmber.copy(alpha = 0.15f))
                .border(1.dp, StatusAmber.copy(alpha = 0.4f))
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.WifiOff, contentDescription = null, tint = StatusAmber, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Saved — $pendingCount event(s) waiting for network",
                color = StatusAmber,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun AppUpdateBanner(
    updateInfo: AppVersionInfo?,
    onUpdateClick: () -> Unit
) {
    if (updateInfo != null) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF1E3A8A))
                .border(1.dp, Color(0xFF3B82F6))
                .clickable { onUpdateClick() }
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.SystemUpdate,
                    contentDescription = "App Update",
                    tint = Color(0xFF60A5FA),
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "New Build Available: v${updateInfo.version}",
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Text(
                text = "DOWNLOAD ↗",
                color = Color(0xFF93C5FD),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun GeofenceStatusBanner(
    isVerified: Boolean,
    distanceMeters: Double?,
    accuracyMeters: Float?
) {
    val bgColor = if (isVerified) StatusGreen.copy(alpha = 0.12f) else StatusAmber.copy(alpha = 0.12f)
    val borderColor = if (isVerified) StatusGreen.copy(alpha = 0.35f) else StatusAmber.copy(alpha = 0.35f)
    val icon = if (isVerified) Icons.Default.CheckCircle else Icons.Default.Warning
    val iconTint = if (isVerified) StatusGreen else StatusAmber
    val title = if (isVerified) "LOCATION VERIFIED" else "OUTSIDE DESTINATION AREA"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(10.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(title, color = iconTint, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            if (distanceMeters != null) {
                Text(
                    text = "Distance: %.0fm (GPS Accuracy: %.0fm)".format(distanceMeters, accuracyMeters ?: 0f),
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }
        }
    }
}
