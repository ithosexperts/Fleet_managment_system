package com.company.trucktracker.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.core.content.FileProvider
import com.company.trucktracker.data.models.AppVersionInfo
import com.company.trucktracker.data.network.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.concurrent.TimeUnit

object AppUpdateManager {
    private const val TAG = "AppUpdateManager"
    private const val APK_FILE_NAME = "TruckTracker-update.apk"

    // Standalone OkHttpClient for high-speed streaming downloads without body buffering
    private val downloadClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .followRedirects(true)
            .followSslRedirects(true)
            .build()
    }

    /**
     * Checks if a new version is available on the operational backend
     */
    suspend fun checkForUpdate(
        apiClient: ApiClient,
        currentVersionCode: Int
    ): AppVersionInfo? = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.apiService.getAppVersion()
            if (response.isSuccessful) {
                val info = response.body()
                if (info != null && info.versionCode > currentVersionCode) {
                    Log.i(TAG, "Update detected: server versionCode=${info.versionCode} > current=$currentVersionCode")
                    return@withContext info
                }
            }
        } catch (e: Throwable) {
            Log.w(TAG, "Failed to check for app update: ${e.message}")
        }
        return@withContext null
    }

    /**
     * Resolves absolute APK download URL
     */
    fun resolveDownloadUrl(baseUrl: String, rawDownloadUrl: String): String {
        return if (rawDownloadUrl.startsWith("http://", ignoreCase = true) ||
            rawDownloadUrl.startsWith("https://", ignoreCase = true)
        ) {
            rawDownloadUrl
        } else {
            val cleanBase = baseUrl.trimEnd('/')
            val cleanPath = rawDownloadUrl.trimStart('/')
            "$cleanBase/$cleanPath"
        }
    }

    /**
     * Streams the APK directly to local app storage with live progress updates
     */
    suspend fun downloadApk(
        context: Context,
        downloadUrl: String,
        baseUrl: String,
        onProgress: (progress: Float, bytesDownloaded: Long, totalBytes: Long) -> Unit
    ): Result<File> = withContext(Dispatchers.IO) {
        try {
            val targetUrl = resolveDownloadUrl(baseUrl, downloadUrl)
            Log.i(TAG, "Starting APK download from: $targetUrl")

            val request = Request.Builder()
                .url(targetUrl)
                .addHeader("Accept", "application/vnd.android.package-archive, application/octet-stream, */*")
                .build()

            val response = downloadClient.newCall(request).execute()
            if (!response.isSuccessful) {
                return@withContext Result.failure(Exception("HTTP download error: ${response.code}"))
            }

            val body = response.body ?: return@withContext Result.failure(Exception("Empty download response body"))
            val contentLength = body.contentLength()

            // Target destination file in app's dedicated downloads directory
            val destDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: context.cacheDir
            if (!destDir.exists()) {
                destDir.mkdirs()
            }
            val apkFile = File(destDir, APK_FILE_NAME)
            if (apkFile.exists()) {
                apkFile.delete()
            }

            var inputStream: InputStream? = null
            var outputStream: FileOutputStream? = null

            try {
                inputStream = body.byteStream()
                outputStream = FileOutputStream(apkFile)

                val buffer = ByteArray(16 * 1024)
                var bytesRead: Int
                var totalRead: Long = 0

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    outputStream.write(buffer, 0, bytesRead)
                    totalRead += bytesRead

                    val progress = if (contentLength > 0) {
                        (totalRead.toFloat() / contentLength.toFloat()).coerceIn(0f, 1f)
                    } else {
                        -1f
                    }

                    withContext(Dispatchers.Main) {
                        onProgress(progress, totalRead, contentLength)
                    }
                }

                outputStream.flush()
                Log.i(TAG, "APK download finished successfully: ${apkFile.absolutePath} (${apkFile.length()} bytes)")
                return@withContext Result.success(apkFile)
            } finally {
                try { inputStream?.close() } catch (_: Throwable) {}
                try { outputStream?.close() } catch (_: Throwable) {}
            }
        } catch (e: Throwable) {
            Log.e(TAG, "APK download failed", e)
            return@withContext Result.failure(e)
        }
    }

    /**
     * Prompts the Android Package Installer to install the updated APK
     */
    fun installApk(context: Context, apkFile: File): Boolean {
        if (!apkFile.exists() || apkFile.length() == 0L) {
            Toast.makeText(context, "Error: Update file is missing or corrupted", Toast.LENGTH_LONG).show()
            return false
        }

        try {
            // Android 8.0+ Unknown App Sources Permission check
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!context.packageManager.canRequestPackageInstalls()) {
                    Toast.makeText(
                        context,
                        "Please allow TruckTracker to install the updated app",
                        Toast.LENGTH_LONG
                    ).show()

                    val settingsIntent = Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:${context.packageName}")
                    ).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(settingsIntent)
                    return false
                }
            }

            // Secure FileProvider URI
            val authority = "${context.packageName}.fileprovider"
            val apkUri: Uri = FileProvider.getUriForFile(context, authority, apkFile)

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }

            context.startActivity(installIntent)
            return true
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to launch package installer", e)
            Toast.makeText(context, "Install failed: ${e.message}", Toast.LENGTH_LONG).show()
            return false
        }
    }
}
