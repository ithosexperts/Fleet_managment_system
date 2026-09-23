package com.company.trucktracker.data.network

import android.content.Context
import com.company.trucktracker.data.local.PreferenceManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class ApiClient(private val context: Context) {
    val preferenceManager = PreferenceManager(context)

    private val okHttpClient: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(preferenceManager))
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    @Volatile
    private var cachedService: TruckTrackerApiService? = null
    @Volatile
    private var lastBaseUrl: String? = null

    val apiService: TruckTrackerApiService
        get() {
            var url = preferenceManager.getBaseUrl()
            if (!url.endsWith("/")) {
                url = "$url/"
            }
            if (cachedService == null || lastBaseUrl != url) {
                synchronized(this) {
                    if (cachedService == null || lastBaseUrl != url) {
                        lastBaseUrl = url
                        cachedService = Retrofit.Builder()
                            .baseUrl(url)
                            .client(okHttpClient)
                            .addConverterFactory(GsonConverterFactory.create())
                            .build()
                            .create(TruckTrackerApiService::class.java)
                    }
                }
            }
            return cachedService!!
        }
}
