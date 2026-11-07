package com.cardpay.gateway.sync.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.cardpay.gateway.sync.service.SmsSyncForegroundService
import com.cardpay.gateway.sync.utils.AppPreferences

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val prefs = AppPreferences(context)
            if (prefs.isSyncEnabled && prefs.apiKey.isNotBlank()) {
                SmsSyncForegroundService.startService(context)
            }
        }
    }
}
