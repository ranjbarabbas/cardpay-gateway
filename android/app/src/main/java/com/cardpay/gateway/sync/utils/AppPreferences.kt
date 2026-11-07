package com.cardpay.gateway.sync.utils

import android.content.Context
import android.content.SharedPreferences

class AppPreferences(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("cardpay_prefs", Context.MODE_PRIVATE)

    var serverUrl: String
        get() = prefs.getString("server_url", "http://10.0.2.2:3050") ?: "http://10.0.2.2:3050"
        set(value) = prefs.edit().putString("server_url", value).apply()

    var apiKey: String
        get() = prefs.getString("api_key", "") ?: ""
        set(value) = prefs.edit().putString("api_key", value).apply()

    var isSyncEnabled: Boolean
        get() = prefs.getBoolean("is_sync_enabled", false)
        set(value) = prefs.edit().putBoolean("is_sync_enabled", value).apply()

    var lastSyncStatus: String
        get() = prefs.getString("last_sync_status", "Never synced") ?: "Never synced"
        set(value) = prefs.edit().putString("last_sync_status", value).apply()
}
