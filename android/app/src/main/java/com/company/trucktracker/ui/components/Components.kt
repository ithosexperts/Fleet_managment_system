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

// ─────────────────────────────────────────────────────────────────────────
// IN-APP AUTO-UPDATE DIALOG — Prompt, Download Progress, and Install Trigger
// ─────────────────────────────────────────────────────────────────────────
@Composable
fun AppUpdateDialog(
    updateInfo: AppVersionInfo,
    isDownloading: Boolean,
    downloadProgress: Float,
    downloadedBytes: Long = 0,
    totalBytes: Long = 0,
    downloadError: String? = null,
    isReadyToInstall: Boolean = false,
    onStartDownload: () -> Unit,
    onInstall: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = {
            if (!isDownloading && !updateInfo.mandatoryUpdate) {
                onDismiss()
            }
        },
        containerColor = MaterialTheme.colorScheme.surface,
        icon = {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(HoseXpertsBlue.copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when {
                        isReadyToInstall -> Icons.Default.CheckCircle
                        isDownloading -> Icons.Default.Download
                        else -> Icons.Default.SystemUpdate
                    },
                    contentDescription = "Update Icon",
                    tint = if (isReadyToInstall) StatusGreen else HoseXpertsBlue,
                    modifier = Modifier.size(30.dp)
                )
            }
        },
        title = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = when {
                        isReadyToInstall -> "Update Ready to Install"
                        isDownloading -> "Downloading Update..."
                        else -> "App Update Available"
                    },
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = HoseXpertsBlue.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = "Version ${updateInfo.version} (Build ${updateInfo.versionCode})",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = HoseXpertsBlue
                    )
                }
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (downloadError != null) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = StatusRed.copy(alpha = 0.12f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = StatusRed)
                            Text(
                                text = downloadError,
                                fontSize = 12.sp,
                                color = StatusRed
                            )
                        }
                    }
                }

                if (isDownloading) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (downloadProgress >= 0f) {
                            LinearProgressIndicator(
                                progress = { downloadProgress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp)),
                                color = HoseXpertsBlue,
                                trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${(downloadProgress * 100).toInt()}%",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = HoseXpertsBlue
                                )
                                if (totalBytes > 0) {
                                    val mbDownloaded = downloadedBytes.toDouble() / (1024 * 1024)
                                    val mbTotal = totalBytes.toDouble() / (1024 * 1024)
                                    Text(
                                        text = "%.1f / %.1f MB".format(mbDownloaded, mbTotal),
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        } else {
                            LinearProgressIndicator(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp)),
                                color = HoseXpertsBlue,
                                trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                            )
                            Text(
                                text = "Connecting and downloading package...",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else if (isReadyToInstall) {
                    Text(
                        text = "The latest APK has been successfully downloaded. Tap 'Install Now' to complete the update without losing any trip data.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    Text(
                        text = "A new version of TruckTracker is available with real-time operational upgrades:",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    val notes = updateInfo.releaseNotes ?: "• Live delay & delivery timing synchronization\n• In-app automatic updates (OTA)\n• Enhanced GPS tracking & map routing"
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = notes,
                            fontSize = 12.sp,
                            lineHeight = 18.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (isReadyToInstall) {
                        onInstall()
                    } else if (!isDownloading) {
                        onStartDownload()
                    }
                },
                enabled = !isDownloading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isReadyToInstall) StatusGreen else HoseXpertsBlue
                ),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(
                    text = when {
                        isReadyToInstall -> "Install Now"
                        downloadError != null -> "Retry Download"
                        else -> "Update Now"
                    },
                    fontWeight = FontWeight.Bold
                )
            }
        },
        dismissButton = {
            if (!updateInfo.mandatoryUpdate && !isDownloading) {
                TextButton(
                    onClick = onDismiss,
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = "Later",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    )
}

