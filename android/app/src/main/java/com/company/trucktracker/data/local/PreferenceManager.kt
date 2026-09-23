package com.company.trucktracker.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.company.trucktracker.data.models.User
import com.google.gson.Gson

class PreferenceManager(context: Context) {
    private val prefs: SharedPreferences

    init {
        prefs = try {
            val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            EncryptedSharedPreferences.create(
                "tt_secure_prefs",
                masterKeyAlias,
                context,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Throwable) {
            // Fallback for emulators/older devices without hardware Keystore
            context.getSharedPreferences("tt_fallback_prefs", Context.MODE_PRIVATE)
        }
    }

    fun saveAuthToken(token: String) {
        prefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
    }

    fun getAuthToken(): String? {
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }

    fun saveUser(user: User) {
        prefs.edit().putString(KEY_USER, Gson().toJson(user)).apply()
    }

    fun getUser(): User? {
        val json = prefs.getString(KEY_USER, null) ?: return null
        return try {
            Gson().fromJson(json, User::class.java)
        } catch (e: Exception) {
            null
        }
    }

    fun saveBaseUrl(url: String) {
        prefs.edit().putString(KEY_BASE_URL, url).apply()
    }

    fun getBaseUrl(): String {
        return prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    }

    fun isDarkTheme(): Boolean {
        return prefs.getBoolean(KEY_DARK_THEME, true)
    }

    fun setDarkTheme(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_DARK_THEME, enabled).apply()
    }

    fun clear() {
        prefs.edit().remove(KEY_AUTH_TOKEN).remove(KEY_USER).apply()
    }

    companion object {
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_USER = "user_profile"
        private const val KEY_BASE_URL = "base_url"
        private const val KEY_DARK_THEME = "dark_theme"
        // Production Render backend API URL
        const val DEFAULT_BASE_URL = "https://truck-tracker-api-9yhq.onrender.com/"
    }
}
