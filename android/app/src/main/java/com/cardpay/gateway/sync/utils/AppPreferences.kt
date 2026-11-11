package com.cardpay.gateway.sync.utils

import android.content.Context
import android.content.SharedPreferences
import androidx.appcompat.app.AppCompatDelegate
import com.cardpay.gateway.sync.data.model.RecentTransaction
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class AppPreferences(context: Context) {
    companion object {
        const val PRODUCTION_SERVER_URL = "https://pay.honarhub.com"
        const val DEFAULT_TEST_SERVER_URL = "http://10.0.2.2:3050"
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences("cardpay_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    /**
     * Environment Mode:
     * true = Production (Server URL is strictly locked to https://pay.honarhub.com)
     * false = Test / Sandbox (Server URL is editable)
     */
    var isProductionMode: Boolean
        get() = prefs.getBoolean("is_production_mode", true)
        set(value) = prefs.edit().putBoolean("is_production_mode", value).apply()

    var testServerUrl: String
        get() = prefs.getString("test_server_url", DEFAULT_TEST_SERVER_URL) ?: DEFAULT_TEST_SERVER_URL
        set(value) = prefs.edit().putString("test_server_url", value).apply()

    var serverUrl: String
        get() = if (isProductionMode) PRODUCTION_SERVER_URL else testServerUrl
        set(value) {
            if (!isProductionMode) {
                testServerUrl = value
            }
        }

    var apiKey: String
        get() = prefs.getString("api_key", "") ?: ""
        set(value) = prefs.edit().putString("api_key", value).apply()

    var isSyncEnabled: Boolean
        get() = prefs.getBoolean("is_sync_enabled", false)
        set(value) = prefs.edit().putBoolean("is_sync_enabled", value).apply()

    var lastSyncStatus: String
        get() = prefs.getString("last_sync_status", "هنوز پیامکی دریافت نشده است") ?: "هنوز پیامکی دریافت نشده است"
        set(value) = prefs.edit().putString("last_sync_status", value).apply()

    /**
     * Theme mode: "dark", "light", or "system"
     */
    var themeMode: String
        get() = prefs.getString("theme_mode", "dark") ?: "dark"
        set(value) = prefs.edit().putString("theme_mode", value).apply()

    fun applyTheme() {
        when (themeMode) {
            "light" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
            "dark" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
            else -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
        }
    }

    /**
     * Retrieves the last 10 processed transactions from local storage.
     */
    fun getRecentTransactions(): List<RecentTransaction> {
        val json = prefs.getString("recent_transactions_json", null) ?: return emptyList()
        return try {
            val type = object : TypeToken<List<RecentTransaction>>() {}.type
            gson.fromJson<List<RecentTransaction>>(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    /**
     * Adds a transaction to the top of the list, keeping maximum 10 items.
     */
    @Synchronized
    fun addRecentTransaction(tx: RecentTransaction) {
        val current = getRecentTransactions().toMutableList()
        // Remove duplicate if same ID exists
        current.removeAll { it.id == tx.id }
        current.add(0, tx)
        val trimmed = if (current.size > 10) current.take(10) else current
        prefs.edit().putString("recent_transactions_json", gson.toJson(trimmed)).apply()
    }

    /**
     * Sets/replaces the list of recent transactions (takes up to 10 items).
     */
    @Synchronized
    fun setRecentTransactions(list: List<RecentTransaction>) {
        val trimmed = if (list.size > 10) list.take(10) else list
        prefs.edit().putString("recent_transactions_json", gson.toJson(trimmed)).apply()
    }
}
