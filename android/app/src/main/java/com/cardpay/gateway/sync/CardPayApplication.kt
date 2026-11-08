package com.cardpay.gateway.sync

import android.app.Application
import com.cardpay.gateway.sync.utils.AppPreferences

class CardPayApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Apply saved theme mode (Dark / Light / System) on app startup
        AppPreferences(this).applyTheme()
    }
}
