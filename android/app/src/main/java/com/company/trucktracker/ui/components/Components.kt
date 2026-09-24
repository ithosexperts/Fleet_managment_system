package com.company.trucktracker.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.company.trucktracker.data.models.AppVersionInfo
import com.company.trucktracker.ui.theme.*

// ─────────────────────────────────────────────────────────────────────────
// PRIMARY ACTION BUTTON — Main CTA button matching web design
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun PrimaryActionButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: ImageVector? = null,
    containerColor: Color = HoseXpertsBlue,
    contentColor: Color = Color.White
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = contentColor,
            disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
            disabledContentColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
        ),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 3.dp,
            pressedElevation = 6.dp,
            disabledElevation = 0.dp
        )
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text(
            text = text,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.6.sp
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────
// STATUS BADGE — Color-coded status indicator
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun StatusBadge(status: String) {
    val (bgColor, textColor) = when (status.uppercase()) {
        "COMPLETED"                -> Pair(StatusGreen.copy(alpha = 0.12f), StatusGreen)
        "IN_PROGRESS", "RETURNING" -> Pair(StatusBlue.copy(alpha = 0.12f), StatusBlue)
        "DELAYED"                  -> Pair(StatusRed.copy(alpha = 0.12f), StatusRed)
        "ARRIVED"                  -> Pair(HoseXpertsBlue.copy(alpha = 0.15f), HoseXpertsBlueLight)
        "PENDING", "PLANNED"       -> Pair(StatusAmber.copy(alpha = 0.12f), StatusAmber)
        "ASSIGNED"                 -> Pair(HoseXpertsBlue.copy(alpha = 0.12f), HoseXpertsBlueLight)
        else                       -> Pair(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant)
    }

    val animatedBg by animateColorAsState(targetValue = bgColor, animationSpec = tween(300), label = "badge_bg")

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(animatedBg)
            .border(1.dp, textColor.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
            .padding(horizontal = 9.dp, vertical = 4.dp)
    ) {
        Text(
            text = status.replace("_", " "),
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────
// OFFLINE QUEUE BANNER
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun OfflineQueueBanner(pendingCount: Int) {
    if (pendingCount > 0) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(StatusAmber.copy(alpha = 0.12f))
                .border(
                    width = 0.dp,
                    color = Color.Transparent,
                    shape = RoundedCornerShape(0.dp)
                )
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(
                Icons.Default.WifiOff,
                contentDescription = null,
                tint = StatusAmber,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = "$pendingCount event(s) queued — syncing when connected",
                color = StatusAmber,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// APP UPDATE BANNER
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun AppUpdateBanner(updateInfo: AppVersionInfo?, onUpdateClick: () -> Unit) {
    if (updateInfo != null) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(HoseXpertsBlueDark)
                .clickable { onUpdateClick() }
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    Icons.Default.SystemUpdate,
                    contentDescription = "App Update",
                    tint = Color.White,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = "New Build Available: v${updateInfo.version}",
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "DOWNLOAD",
                    color = HoseXperts100,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    Icons.Default.ArrowForward,
                    contentDescription = null,
                    tint = HoseXperts100,
                    modifier = Modifier.size(14.dp)
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────
// GEOFENCE STATUS BANNER
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun GeofenceStatusBanner(
    isVerified: Boolean,
    distanceMeters: Double?,
    accuracyMeters: Float?
) {
    val bgColor = if (isVerified) StatusGreen.copy(alpha = 0.10f) else StatusAmber.copy(alpha = 0.10f)
    val borderColor = if (isVerified) StatusGreen.copy(alpha = 0.3f) else StatusAmber.copy(alpha = 0.3f)
    val icon = if (isVerified) Icons.Default.CheckCircle else Icons.Default.Warning
    val iconTint = if (isVerified) StatusGreen else StatusAmber
    val title = if (isVerified) "LOCATION VERIFIED" else "OUTSIDE DESTINATION AREA"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(14.dp))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier.size(48.dp).clip(CircleShape).background(iconTint.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(26.dp))
        }
        Column {
            Text(title, color = iconTint, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 0.5.sp)
            if (distanceMeters != null) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Distance: %.0fm  |  GPS Accuracy: ±%.0fm".format(distanceMeters, accuracyMeters ?: 0f),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 12.sp
                )
            }
        }
    }
}
